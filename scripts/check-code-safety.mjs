import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const allowedFetchFiles = new Set(["public/service-worker.js", "scripts/check-public-repo.mjs"]);
const allowedExternalUrlFiles = new Set(["scripts/check-public-repo.mjs"]);
const allowedEnvFiles = new Set(["scripts/check-public-repo.mjs"]);
const scannedRoots = ["src", "public", "scripts", "index.html", "package.json"];
const errors = [];

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...walk(join(directory, entry.name)));
      }
      continue;
    }

    if (entry.isFile()) {
      files.push(join(directory, entry.name));
    }
  }

  return files;
}

function toRelative(path) {
  return relative(root, path).split(sep).join("/");
}

function scanFiles() {
  return scannedRoots.flatMap((entry) => {
    const path = join(root, entry);
    try {
      return readdirSync(path, { withFileTypes: true }).length >= 0 ? walk(path) : [path];
    } catch {
      return [path];
    }
  });
}

const files = scanFiles()
  .map((path) => ({ path, relativePath: toRelative(path), text: readFileSync(path, "utf8") }))
  .filter(({ relativePath }) => !relativePath.endsWith(".svg"));

const secretPatterns = [
  [/api[_-]?key\s*[:=]\s*['"][^'"]{8,}/i, "hard-coded API key"],
  [/secret\s*[:=]\s*['"][^'"]{8,}/i, "hard-coded secret"],
  [/token\s*[:=]\s*['"][^'"]{12,}/i, "hard-coded token"],
  [/-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/, "private key"],
];

for (const { relativePath, text } of files) {
  for (const [pattern, label] of secretPatterns) {
    if (pattern.test(text)) {
      errors.push(`${relativePath} contains possible ${label}.`);
    }
  }

  const hasFetch = /\bfetch\s*\(/.test(text);
  if (hasFetch && !allowedFetchFiles.has(relativePath)) {
    errors.push(`${relativePath} uses fetch outside the service worker. CareBridge should not depend on external APIs.`);
  }

  const hasExternalUrl = /https?:\/\//.test(text);
  if (hasExternalUrl && !allowedExternalUrlFiles.has(relativePath)) {
    errors.push(`${relativePath} contains an external URL. Keep the public app self-contained for judging.`);
  }

  const readsEnvironment = /\bprocess\.env\b/.test(text) || /\bimport\.meta\.env\.(?!PROD\b|BASE_URL\b)/.test(text);
  if (readsEnvironment && !allowedEnvFiles.has(relativePath)) {
    errors.push(`${relativePath} reads environment variables. The public demo should not require secrets or config.`);
  }
}

const sourceText = files.map(({ text }) => text).join("\n");
for (const requiredSafetyClaim of [
  "non-diagnostic",
  "not a diagnosis",
  "consentToStore",
  "canLoadPersistedIntake",
  "canLoadPersistedResources",
  "service-worker.js",
  "carebridge-field-card",
]) {
  if (!sourceText.includes(requiredSafetyClaim)) {
    errors.push(`Public source is missing safety/offline signal: ${requiredSafetyClaim}`);
  }
}

if (errors.length > 0) {
  console.error("Code safety gate failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Code safety gate passed: no secrets, no runtime external API dependency, offline and safety signals present.");
