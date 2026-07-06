import { readdirSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative, sep } from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
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

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

function relativePath(path) {
  return relative(root, path).split(sep).join("/");
}

function gitTrackedFiles() {
  try {
    const output = execFileSync("git", ["ls-files"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output.split(/\r?\n/).filter(Boolean);
  } catch {
    return null;
  }
}

function isReadme(file) {
  return /^README(\.|$)/i.test(file.split("/").at(-1) ?? "");
}

function isSubmissionClutter(file) {
  return (
    isReadme(file) ||
    file.startsWith("docs/") ||
    file.startsWith("dist/") ||
    file.startsWith("node_modules/") ||
    file.startsWith("screenshots/") ||
    /^carebridge-.*\.(png|jpe?g|gif|webp)$/i.test(file) ||
    /\.(log|tgz|tsbuildinfo)$/i.test(file) ||
    /^vite\.config\.(js|d\.ts)$/i.test(file)
  );
}

const files = walk(root);
const sourceFiles = files.map(relativePath);

const readmeFiles = sourceFiles.filter(isReadme);
if (readmeFiles.length > 0) {
  errors.push(`Submission repository must not include README files before PresentMe analysis: ${readmeFiles.join(", ")}`);
}

const generatedClutter = sourceFiles.filter((file) => /\.(log|tsbuildinfo)$/i.test(file) || /^vite\.config\.(js|d\.ts)$/i.test(file));
if (generatedClutter.length > 0) {
  errors.push(`Generated TypeScript/Vite files should not be committed: ${generatedClutter.join(", ")}`);
}

const workingTreeSubmissionClutter = sourceFiles.filter((file) => isSubmissionClutter(file) && !isReadme(file) && !generatedClutter.includes(file));
if (workingTreeSubmissionClutter.length > 0) {
  errors.push(`Keep private docs, build outputs, screenshots, and package archives outside the public app repository: ${workingTreeSubmissionClutter.join(", ")}`);
}

const requiredFiles = [
  "LICENSE",
  ".npmignore",
  "package-lock.json",
  "public/service-worker.js",
  "public/site.webmanifest",
  "scripts/check-accessibility.mjs",
  "scripts/check-code-safety.mjs",
  "scripts/check-public-repo.mjs",
  "scripts/check-public-repo.test.mjs",
  "src/vite-env.d.ts",
  "src/domain/careTypes.ts",
  "src/domain/demoScenarios.ts",
  "src/domain/demoScenarios.test.ts",
  "src/domain/exporters.ts",
  "src/domain/impactAnalytics.ts",
  "src/domain/pilotReadiness.ts",
  "src/domain/pilotReadiness.test.ts",
  "src/domain/privacyPolicy.ts",
  "src/domain/exporters.test.ts",
  "src/domain/privacyPolicy.test.ts",
  "src/domain/resourceDirectory.ts",
  "src/domain/resourceDirectory.test.ts",
  "src/domain/sdgTargets.ts",
  "src/domain/submissionEvidence.ts",
  "src/domain/submissionEvidence.test.ts",
  "src/domain/triageEngine.ts",
  "src/domain/triageEngine.test.ts",
  "src/domain/impactAnalytics.test.ts",
  "src/components/IntakePanel.tsx",
  "src/components/NavigationPlanPanel.tsx",
  "src/components/CommunityDashboard.tsx",
  "src/components/PilotReadinessPanel.tsx",
];

for (const requiredFile of requiredFiles) {
  if (!sourceFiles.includes(requiredFile)) {
    errors.push(`Missing required analyzer-friendly file: ${requiredFile}`);
  }
}

const trackedFiles = gitTrackedFiles();
if (trackedFiles) {
  const trackedClutter = trackedFiles.filter(isSubmissionClutter);
  if (trackedClutter.length > 0) {
    errors.push(`Tracked public source contains files that should not be published before PresentMe analysis: ${trackedClutter.join(", ")}`);
  }

  for (const requiredFile of requiredFiles) {
    if (!trackedFiles.includes(requiredFile)) {
      errors.push(`Tracked public source is missing required analyzer-friendly file: ${requiredFile}`);
    }
  }
}

const packageJson = JSON.parse(readText("package.json"));
if (packageJson.license !== "MIT") {
  errors.push("package.json must declare MIT license for open-source rule compliance.");
}

if (packageJson.private === true) {
  errors.push("package.json must not declare private:true for a public open-source hackathon submission.");
}

if (packageJson.engines?.node !== "^20.19.0 || >=22.12.0") {
  errors.push("package.json must declare the Vite-compatible Node engine: ^20.19.0 || >=22.12.0.");
}

const runtimeDependencies = Object.keys(packageJson.dependencies ?? {}).sort();
const expectedRuntimeDependencies = ["dexie", "lucide-react", "react", "react-dom", "rxdb", "rxdb-hooks", "rxjs"];
if (runtimeDependencies.join(",") !== expectedRuntimeDependencies.join(",")) {
  errors.push(`Runtime dependencies should stay narrow: ${expectedRuntimeDependencies.join(", ")}.`);
}

if (packageJson.dependencies?.["@vitejs/plugin-react"]) {
  errors.push("@vitejs/plugin-react must stay in devDependencies, not runtime dependencies.");
}

for (const devDependency of ["@vitejs/plugin-react", "typescript", "vite", "vitest"]) {
  if (!packageJson.devDependencies?.[devDependency]) {
    errors.push(`package.json is missing build/test devDependency: ${devDependency}`);
  }
}

for (const keyword of ["sdg-3", "community-health", "care-navigation", "offline-first"]) {
  if (!packageJson.keywords?.includes(keyword)) {
    errors.push(`package.json is missing analyzer keyword: ${keyword}`);
  }
}

for (const script of [
  "build",
  "test",
  "typecheck",
  "check:accessibility",
  "check:public-repo",
  "check:submission",
  "check:security",
  "check:ui",
]) {
  if (!packageJson.scripts?.[script]) {
    errors.push(`package.json is missing script: ${script}`);
  }
}

const checkSecurityScript = packageJson.scripts?.["check:security"] ?? "";
for (const securitySignal of ["npm audit", "check-code-safety.mjs"]) {
  if (!checkSecurityScript.includes(securitySignal)) {
    errors.push(`check:security is missing security gate: ${securitySignal}`);
  }
}

const checkReleaseScript = packageJson.scripts?.["check:release"] ?? "";
for (const releaseGate of ["check:accessibility", "check:security", "check:ui", "check:submission"]) {
  if (!checkReleaseScript.includes(releaseGate)) {
    errors.push(`check:release is missing release gate: ${releaseGate}`);
  }
}

const gitignore = readText(".gitignore");
for (const ignored of ["node_modules/", "dist/", "*.tsbuildinfo", "*.log"]) {
  if (!gitignore.includes(ignored)) {
    errors.push(`.gitignore must protect ${ignored}`);
  }
}

const npmignore = readText(".npmignore");
for (const ignored of ["node_modules/", "dist/", "*.tgz", "*.log", "README.*"]) {
  if (!npmignore.includes(ignored)) {
    errors.push(`.npmignore must protect ${ignored}`);
  }
}

const indexHtml = readText("index.html");
for (const appShellSignal of [
  '<meta name="theme-color" content="#0f766e"',
  '<link rel="manifest" href="/site.webmanifest"',
]) {
  if (!indexHtml.includes(appShellSignal)) {
    errors.push(`index.html is missing installable app shell signal: ${appShellSignal}`);
  }
}

const webManifest = JSON.parse(readText("public/site.webmanifest"));
if (webManifest.name !== "CareBridge Navigator") {
  errors.push("Web app manifest must name the project as CareBridge Navigator.");
}

if (webManifest.display !== "standalone") {
  errors.push("Web app manifest must use standalone display for installable offline workflow.");
}

if (webManifest.theme_color !== "#0f766e") {
  errors.push("Web app manifest must keep the CareBridge theme color.");
}

if (!webManifest.categories?.includes("health")) {
  errors.push("Web app manifest must include the health category.");
}

const sdgTargets = readText("src/domain/sdgTargets.ts");
for (const target of ["3.1", "3.2", "3.3", "3.4", "3.7", "3.8", "3.c", "3.d"]) {
  if (!sdgTargets.includes(`"${target}"`)) {
    errors.push(`SDG target ledger is missing target ${target}`);
  }
}

const impactAnalytics = readText("src/domain/impactAnalytics.ts");
for (const analyticsSignal of [
  "CommunityQueueItem",
  "queue",
  "resourceGaps",
  "ResourceGap",
  "buildResourceGaps",
  "compareQueueItems",
  "topAction",
  "topResource",
  "targetCounts",
  "SDG_TARGETS",
  "SdgTargetId",
]) {
  if (!impactAnalytics.includes(analyticsSignal)) {
    errors.push(`Impact analytics is missing SDG coverage signal: ${analyticsSignal}`);
  }
}

const communityDashboard = readText("src/components/CommunityDashboard.tsx");
for (const dashboardSignal of [
  "Priority outreach queue",
  "Top action",
  "Top resource",
  "Resource coverage gaps",
  "SDG target coverage",
  "targetCounts",
  "describeTarget",
]) {
  if (!communityDashboard.includes(dashboardSignal)) {
    errors.push(`Community dashboard is missing SDG coverage signal: ${dashboardSignal}`);
  }
}

const pilotReadinessPanel = readText("src/components/PilotReadinessPanel.tsx");
for (const panelSignal of [
  "Pilot readiness",
  "Safety boundaries",
  "Pilot next steps",
  "Sustainability model",
  "SAFETY_BOUNDARIES",
  "PILOT_ROADMAP",
  "SUSTAINABILITY_MODEL",
]) {
  if (!pilotReadinessPanel.includes(panelSignal)) {
    errors.push(`Pilot readiness panel is missing judge-facing rollout signal: ${panelSignal}`);
  }
}

const submissionEvidence = readText("src/domain/submissionEvidence.ts");
for (const submissionSignal of [
  "DEVPOST_SCORING_EVIDENCE",
  "github_uploaded_code",
  "presentme_repo_analyzer",
  "sdg_3_relation",
  "code_neatness",
  "public_verification_required",
  "REQUIRED_POST_PUBLIC_CHECKS",
  "Was the code successfully uploaded on GitHub?",
  "Was the code analyzed using PresentMe Repo Analyzer",
  "Was the code/project related to SDG 3?",
  "Was code well arranged in a quality manner?",
]) {
  if (!submissionEvidence.includes(submissionSignal)) {
    errors.push(`Submission evidence ledger is missing scoring signal: ${submissionSignal}`);
  }
}

const triageEngine = readText("src/domain/triageEngine.ts");
for (const safetySignal of [
  "buildLanguageHandoff",
  "priorityFromScore",
  "emergencyAction",
  "buildDecisionSignals",
  "decisionSignals",
  "immediate-escalation",
  "routine-community-check-in",
  "warningSigns",
  "non-diagnostic",
  "Language handoff",
  "followUpHours"
]) {
  if (!triageEngine.includes(safetySignal)) {
    errors.push(`Triage engine is missing safety signal: ${safetySignal}`);
  }
}

const navigatorState = readText("src/hooks/useNavigatorState.ts");
for (const privacySignal of [
  "canLoadPersistedIntake",
  "shouldPersistIntake",
  "removeJson",
  "canLoadPersistedResources",
  "resourceDirectory",
  "scenarioSelection",
  "scenarioKeyForIntake",
]) {
  if (!navigatorState.includes(privacySignal)) {
    errors.push(`Navigator state is missing consent-respecting persistence signal: ${privacySignal}`);
  }
}

const intakePanel = readText("src/components/IntakePanel.tsx");
for (const intakeSignal of [
  "Custom intake",
  "Selected demo focus",
  "DEMO_SCENARIO_OPTIONS",
  "DEMO_SCENARIO_STORIES",
  "scenarioSelection",
  "Load demo scenario",
  "Manual field edits are active",
]) {
  if (!intakePanel.includes(intakeSignal)) {
    errors.push(`Intake panel is missing controlled demo scenario signal: ${intakeSignal}`);
  }
}

const demoScenarios = readText("src/domain/demoScenarios.ts");
for (const demoSignal of [
  "DemoScenarioStory",
  "DEMO_SCENARIO_STORIES",
  "DEMO_SCENARIO_OPTIONS",
  "judgeCue",
  "sdgProof",
  "Shows maternal follow-up",
  "Shows warning signs",
  "Shows communicable-disease testing",
]) {
  if (!demoScenarios.includes(demoSignal)) {
    errors.push(`Demo scenarios are missing PresentMe-readable story signal: ${demoSignal}`);
  }
}

const resourceDirectory = readText("src/domain/resourceDirectory.ts");
for (const resourceSignal of [
  "RESOURCE_CATEGORIES",
  "RESOURCE_CHANNELS",
  "buildResourceDirectoryExport",
  "createResourceId",
  "parseResourceDirectoryImport",
  "parseResourceTags",
  "canLoadPersistedResources",
]) {
  if (!resourceDirectory.includes(resourceSignal)) {
    errors.push(`Resource directory is missing configurable-resource signal: ${resourceSignal}`);
  }
}

const exporters = readText("src/domain/exporters.ts");
for (const exportSignal of [
  "buildFieldCard",
  "fieldCardFilename",
  "CareBridge Navigator field card",
  "language_handoff",
  "Language handoff",
  "carebridge-field-card",
  "buildOutreachCsv",
]) {
  if (!exporters.includes(exportSignal)) {
    errors.push(`Export module is missing frontline handoff/export signal: ${exportSignal}`);
  }
}

const navigationPlanPanel = readText("src/components/NavigationPlanPanel.tsx");
for (const fieldCardSignal of ["Language handoff", "Download field card", "buildFieldCard", "fieldCardFilename"]) {
  if (!navigationPlanPanel.includes(fieldCardSignal)) {
    errors.push(`Navigation plan panel is missing field-card workflow signal: ${fieldCardSignal}`);
  }
}

const accessibilityGate = readText("scripts/check-accessibility.mjs");
for (const accessibilitySignal of [
  "skip-link",
  "focus-visible",
  "aria-live",
  "aria-label",
  "Accessibility gate passed",
]) {
  if (!accessibilityGate.includes(accessibilitySignal)) {
    errors.push(`Accessibility gate is missing signal: ${accessibilitySignal}`);
  }
}

const privacyPolicy = readText("src/domain/privacyPolicy.ts");
for (const validationSignal of ["isCareIntake", "isValidStringList", "Number.isFinite"]) {
  if (!privacyPolicy.includes(validationSignal)) {
    errors.push(`Privacy policy is missing persisted-intake validation signal: ${validationSignal}`);
  }
}

const pilotReadiness = readText("src/domain/pilotReadiness.ts");
for (const readinessSignal of [
  "SAFETY_BOUNDARIES",
  "PILOT_ROADMAP",
  "SUSTAINABILITY_MODEL",
  "PRESENTME_DO_NOT_CLAIM",
  "does not diagnose",
  "human escalation",
  "encrypted",
  "governance review",
  "Free open-source core",
  "Charge organizations, not patients",
  "production-ready",
]) {
  if (!pilotReadiness.includes(readinessSignal)) {
    errors.push(`Pilot readiness metadata is missing PresentMe guardrail signal: ${readinessSignal}`);
  }
}

const mainEntry = readText("src/main.tsx");
for (const offlineRegistrationSignal of ["import.meta.env.PROD", "serviceWorker", "service-worker.js"]) {
  if (!mainEntry.includes(offlineRegistrationSignal)) {
    errors.push(`App entry is missing offline-first registration signal: ${offlineRegistrationSignal}`);
  }
}

const serviceWorker = readText("public/service-worker.js");
for (const offlineCapabilitySignal of [
  "carebridge-navigator-v1",
  "./site.webmanifest",
  "cache.addAll",
  "self.skipWaiting",
  "self.clients.claim",
  "request.mode === \"navigate\"",
  "caches.match",
]) {
  if (!serviceWorker.includes(offlineCapabilitySignal)) {
    errors.push(`Service worker is missing offline-first capability signal: ${offlineCapabilitySignal}`);
  }
}

const codeSafetyGate = readText("scripts/check-code-safety.mjs");
for (const safetyGateSignal of [
  "no secrets",
  "external API",
  "allowedFetchFiles",
  "service-worker.js",
  "carebridge-field-card",
]) {
  if (!codeSafetyGate.includes(safetyGateSignal)) {
    errors.push(`Code safety gate is missing signal: ${safetyGateSignal}`);
  }
}

const resourcePanel = readText("src/components/ResourcePanel.tsx");
for (const resourceEditorSignal of [
  "Resource directory editor",
  "Add local resource",
  "Export directory JSON",
  "Import directory JSON",
  "No matching resource in this directory yet",
  "Reset directory",
  "Directory changes stay in this browser",
]) {
  if (!resourcePanel.includes(resourceEditorSignal)) {
    errors.push(`Resource panel is missing local directory editor signal: ${resourceEditorSignal}`);
  }
}

const oversizedSourceFiles = files
  .filter((file) => !file.includes(`${sep}node_modules${sep}`) && !file.includes(`${sep}dist${sep}`))
  .filter((file) => statSync(file).size > 500_000)
  .map(relativePath);

if (oversizedSourceFiles.length > 0) {
  errors.push(`Oversized source files make analyzer output weaker: ${oversizedSourceFiles.join(", ")}`);
}

if (errors.length > 0) {
  console.error("Submission gate failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  "Submission gate passed: no README, no generated clutter, SDG 3 coverage present, field-card workflow present, dependency hygiene present.",
);
