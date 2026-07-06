import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const REQUIRED_PUBLIC_FILES = [
  "LICENSE",
  "package.json",
  "package-lock.json",
  "index.html",
  ".github/workflows/quality.yml",
  "public/service-worker.js",
  "public/site.webmanifest",
  "scripts/check-accessibility.mjs",
  "scripts/check-code-safety.mjs",
  "scripts/check-public-repo.mjs",
  "scripts/check-submission.mjs",
  "scripts/check-ui.mjs",
  "src/main.tsx",
  "src/domain/submissionEvidence.ts",
  "src/domain/triageEngine.ts",
  "src/components/CommunityDashboard.tsx",
  "src/components/PilotReadinessPanel.tsx",
];

export const EXPECTED_PUBLIC_DESCRIPTION = "Offline-first SDG 3 care-navigation app for community health workers.";
export const EXPECTED_LICENSE_SPDX_ID = "MIT";

export const REQUIRED_PUBLIC_TOPICS = [
  "care-navigation",
  "community-health",
  "offline-first",
  "public-health",
  "react",
  "sdg-3",
  "typescript",
  "universal-health-coverage",
  "vite",
];

export function normalizePublicPath(path) {
  return path.replaceAll("\\", "/").replace(/^\/+/, "");
}

export function isForbiddenPublicPath(path) {
  const normalized = normalizePublicPath(path);
  const basename = normalized.split("/").at(-1) ?? "";

  return (
    /^README(\.|$)/i.test(basename) ||
    normalized.startsWith("docs/") ||
    normalized.startsWith("dist/") ||
    normalized.startsWith("node_modules/") ||
    normalized.startsWith("screenshots/") ||
    /^carebridge-.*\.(png|jpe?g|gif|webp)$/i.test(basename) ||
    /\.(log|tgz|tsbuildinfo)$/i.test(normalized) ||
    /^vite\.config\.(js|d\.ts)$/i.test(normalized)
  );
}

export function findForbiddenPublicPaths(paths) {
  return paths.map(normalizePublicPath).filter(isForbiddenPublicPath).sort();
}

export function parseGitHubRepo(input) {
  const value = input?.trim();
  if (!value) {
    throw new Error("Set PUBLIC_REPO_URL or configure an origin remote before running the public repository gate.");
  }

  const sshMatch = value.match(/^(?:git@|ssh:\/\/git@)github\.com[:/](?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/);
  if (sshMatch?.groups) {
    return {
      owner: sshMatch.groups.owner,
      repo: sshMatch.groups.repo,
      htmlUrl: `https://github.com/${sshMatch.groups.owner}/${sshMatch.groups.repo}`,
    };
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Unsupported GitHub repository URL: ${value}`);
  }

  if (url.hostname.toLowerCase() !== "github.com") {
    throw new Error(`Repository URL must point to github.com, received: ${value}`);
  }

  const [owner, repoSegment] = url.pathname.split("/").filter(Boolean);
  if (!owner || !repoSegment) {
    throw new Error(`GitHub repository URL must include owner and repository name: ${value}`);
  }

  const repo = repoSegment.replace(/\.git$/i, "");
  return {
    owner,
    repo,
    htmlUrl: `https://github.com/${owner}/${repo}`,
  };
}

function tryGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function buildHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "carebridge-public-repo-gate",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGitHubJson(fetchImpl, url, token) {
  const response = await fetchImpl(url, {
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed (${response.status}) for ${url}: ${body.slice(0, 240)}`);
  }

  return response.json();
}

export async function inspectPublicRepository({
  repoUrl,
  token = process.env.GITHUB_TOKEN,
  expectedCommit = process.env.EXPECTED_PUBLIC_COMMIT || tryGit(["rev-parse", "HEAD"]),
  requireActionsSuccess = false,
  fetchImpl = fetch,
} = {}) {
  const remoteUrl = repoUrl || process.env.PUBLIC_REPO_URL || tryGit(["remote", "get-url", "origin"]);
  const repoIdentity = parseGitHubRepo(remoteUrl);
  const repoApiRoot = `https://api.github.com/repos/${repoIdentity.owner}/${repoIdentity.repo}`;

  const repository = await fetchGitHubJson(fetchImpl, repoApiRoot, token);
  const errors = [];

  if (repository.private !== false || repository.visibility !== "public") {
    errors.push(`Repository must be public, current visibility is ${repository.visibility ?? "unknown"}.`);
  }

  if (repository.archived) {
    errors.push("Repository must not be archived.");
  }

  if (repository.description !== EXPECTED_PUBLIC_DESCRIPTION) {
    errors.push(`Repository description must be: ${EXPECTED_PUBLIC_DESCRIPTION}`);
  }

  const publicLicenseSpdxId = repository.license?.spdx_id ?? "missing";
  if (publicLicenseSpdxId !== EXPECTED_LICENSE_SPDX_ID) {
    errors.push(`Repository license must be recognized by GitHub as MIT, current SPDX id is ${publicLicenseSpdxId}.`);
  }

  const repositoryTopics = new Set((repository.topics ?? []).map((topic) => topic.toLowerCase()));
  const missingTopics = REQUIRED_PUBLIC_TOPICS.filter((topic) => !repositoryTopics.has(topic));
  if (missingTopics.length > 0) {
    errors.push(`Repository is missing required topics: ${missingTopics.join(", ")}`);
  }

  const defaultBranch = repository.default_branch;
  if (!defaultBranch) {
    errors.push("Repository has no default branch.");
  }

  const tree = defaultBranch
    ? await fetchGitHubJson(fetchImpl, `${repoApiRoot}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`, token)
    : { tree: [] };
  const publicPaths = tree.tree?.filter((item) => item.type === "blob").map((item) => item.path) ?? [];
  const publicPathSet = new Set(publicPaths);

  const forbiddenPaths = findForbiddenPublicPaths(publicPaths);
  if (forbiddenPaths.length > 0) {
    errors.push(`Public repository still contains files that should stay out before PresentMe analysis: ${forbiddenPaths.join(", ")}`);
  }

  for (const requiredFile of REQUIRED_PUBLIC_FILES) {
    if (!publicPathSet.has(requiredFile)) {
      errors.push(`Public repository is missing required source file: ${requiredFile}`);
    }
  }

  const publicCommit = defaultBranch ? await fetchGitHubJson(fetchImpl, `${repoApiRoot}/commits/${encodeURIComponent(defaultBranch)}`, token) : null;
  const publicHeadSha = publicCommit?.sha ?? "";
  if (expectedCommit && publicHeadSha && publicHeadSha !== expectedCommit) {
    errors.push(`Public default-branch HEAD ${publicHeadSha.slice(0, 12)} does not match expected local commit ${expectedCommit.slice(0, 12)}.`);
  }

  let latestQualityRun = null;
  if (requireActionsSuccess) {
    const runs = await fetchGitHubJson(
      fetchImpl,
      `${repoApiRoot}/actions/runs?branch=${encodeURIComponent(defaultBranch)}&event=push&per_page=20`,
      token,
    );
    latestQualityRun =
      runs.workflow_runs?.find((run) => run.name === "Quality" || run.path === ".github/workflows/quality.yml") ?? null;

    if (!latestQualityRun) {
      errors.push("No public GitHub Actions Quality workflow run was found for the default branch.");
    } else if (latestQualityRun.status !== "completed" || latestQualityRun.conclusion !== "success") {
      errors.push(
        `Latest public Quality workflow is ${latestQualityRun.status}/${latestQualityRun.conclusion ?? "pending"} at ${latestQualityRun.html_url}.`,
      );
    }
  }

  return {
    repo: repoIdentity,
    defaultBranch,
    expectedCommit,
    publicHeadSha,
    publicFileCount: publicPaths.length,
    publicDescription: repository.description ?? "",
    publicLicenseSpdxId,
    publicTopics: [...repositoryTopics].sort(),
    latestQualityRun,
    errors,
  };
}

async function main() {
  const requireActionsSuccess = process.argv.includes("--require-actions-success");
  const report = await inspectPublicRepository({ requireActionsSuccess });

  if (report.errors.length > 0) {
    console.error("Public repository gate failed:");
    for (const error of report.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const actionsSignal = requireActionsSuccess ? ", GitHub Actions Quality passed" : ", GitHub Actions success check skipped";
  console.log(
    `Public repository gate passed: ${report.repo.htmlUrl} is public, README-free, source-complete, metadata-complete, and matches ${report.publicHeadSha.slice(0, 12)}${actionsSignal}.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
