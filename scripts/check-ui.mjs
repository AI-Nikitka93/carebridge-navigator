import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = join(root, "dist");
const errors = [];

function read(path) {
  return readFileSync(path, "utf8");
}

if (!existsSync(distRoot)) {
  errors.push("dist/ is missing. Run npm run build before npm run check:ui.");
} else {
  const indexPath = join(distRoot, "index.html");
  if (!existsSync(indexPath)) {
    errors.push("dist/index.html is missing.");
  } else {
    const indexHtml = read(indexPath);
    for (const signal of [
      "CareBridge Navigator",
      "/favicon.svg",
      "/site.webmanifest",
      'name="theme-color"',
      'type="module"',
    ]) {
      if (!indexHtml.includes(signal)) {
        errors.push(`dist/index.html is missing UI signal: ${signal}`);
      }
    }
  }

  const manifestPath = join(distRoot, "site.webmanifest");
  if (!existsSync(manifestPath)) {
    errors.push("dist/site.webmanifest is missing.");
  } else {
    const manifest = JSON.parse(read(manifestPath));
    const manifestSignals = {
      name: "CareBridge Navigator",
      display: "standalone",
      theme_color: "#0f766e",
    };

    for (const [key, expected] of Object.entries(manifestSignals)) {
      if (manifest[key] !== expected) {
        errors.push(`dist/site.webmanifest has wrong ${key}: ${manifest[key]}`);
      }
    }

    if (!manifest.categories?.includes("health")) {
      errors.push("dist/site.webmanifest is missing health category.");
    }
  }

  const serviceWorkerPath = join(distRoot, "service-worker.js");
  if (!existsSync(serviceWorkerPath)) {
    errors.push("dist/service-worker.js is missing.");
  } else {
    const serviceWorker = read(serviceWorkerPath);
    for (const signal of [
      "carebridge-navigator-v1",
      "cache.addAll",
      "./site.webmanifest",
      "request.mode === \"navigate\"",
      "caches.match",
    ]) {
      if (!serviceWorker.includes(signal)) {
        errors.push(`dist/service-worker.js is missing offline-first signal: ${signal}`);
      }
    }
  }

  const assetRoot = join(distRoot, "assets");
  const bundleFiles = existsSync(assetRoot)
    ? readdirSync(assetRoot)
        .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
        .map((file) => join(assetRoot, file))
    : [];

  const bundleText = bundleFiles.map(read).join("\n");
  for (const signal of [
    "CareBridge Navigator",
    "Skip to care workspace",
    "Custom intake",
    "Selected demo focus",
    "Shows maternal follow-up",
    "Manual field edits are active",
    "Non-diagnostic",
    "Local-first records",
    "Export CSV",
    "Consent to store locally",
    "Preferred language",
    "Local language",
    "Assign a language-safe handoff",
    "Language handoff",
    "carebridge-outreach-queue.csv",
    "carebridge-field-card",
    "Download field card",
    "Priority outreach queue",
    "Top action",
    "Top resource",
    "Resource directory editor",
    "Resource coverage gaps",
    "All current action tags have at least one local service point",
    "Add local resource",
    "Export directory JSON",
    "Import directory JSON",
    "Reset directory",
    "SDG target coverage",
    "Universal health coverage",
    "routine-community-check-in",
    "Supervisor focus",
    "Decision evidence",
    "SDG 3 evidence ledger",
    "Pilot readiness",
    "Safe path from hackathon demo to governed field pilot",
    "Free open-source core",
    "Charge organizations, not patients",
    "governance review",
    "service-worker.js",
  ]) {
    if (!bundleText.includes(signal)) {
      errors.push(`production bundle is missing UI/product signal: ${signal}`);
    }
  }
}

if (errors.length > 0) {
  console.error("UI content gate failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  "UI content gate passed: production bundle exposes the demo, safety, field-card export, offline, and SDG coverage signals.",
);
