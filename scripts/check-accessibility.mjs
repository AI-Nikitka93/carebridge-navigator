import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const errors = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function requireSignal(path, signal, message) {
  const text = read(path);
  if (!text.includes(signal)) {
    errors.push(`${path}: ${message}`);
  }
}

for (const [path, signal, message] of [
  ["src/App.tsx", "skip-link", "missing keyboard skip link"],
  ["src/App.tsx", 'href="#care-workspace"', "skip link must target the care workspace"],
  ["src/App.tsx", 'id="care-workspace"', "workspace target must have a stable id"],
  ["src/components/IntakePanel.tsx", 'aria-label="Load demo scenario"', "demo scenario select needs an accessible name"],
  ["src/components/IntakePanel.tsx", "<fieldset", "checkbox groups should use fieldsets"],
  ["src/components/IntakePanel.tsx", "<legend>{title}</legend>", "checkbox groups should expose legends"],
  ["src/components/NavigationPlanPanel.tsx", 'aria-live="polite"', "generated plan should announce updates politely"],
  ["src/components/NavigationPlanPanel.tsx", 'aria-label="Copy handoff"', "icon-only copy button needs an accessible name"],
  ["src/components/NavigationPlanPanel.tsx", 'aria-label="Download field card"', "icon-only field-card button needs an accessible name"],
  ["src/components/CommunityDashboard.tsx", 'aria-labelledby="dashboard-title"', "dashboard section needs a labelled heading"],
  ["src/components/ResourcePanel.tsx", 'aria-labelledby="resources-title"', "resource section needs a labelled heading"],
  ["src/components/RouteMap.tsx", 'aria-label="Care route map"', "route map needs an accessible label"],
  ["src/styles.css", ":focus-visible", "keyboard focus styles are required"],
  ["src/styles.css", ".skip-link:focus-visible", "skip link must become visible on keyboard focus"],
  ["src/styles.css", "outline-offset", "focus ring should not obscure controls"],
  ["src/styles.css", "min-height: 44px", "mobile tap targets should be at least 44px tall"],
  ["src/styles.css", "min-width: 44px", "icon buttons should be at least 44px wide"],
]) {
  requireSignal(path, signal, message);
}

const navigationPlanPanel = read("src/components/NavigationPlanPanel.tsx");
const iconButtonCount = (navigationPlanPanel.match(/className="icon-button"/g) ?? []).length;
const labelledIconButtonCount = (navigationPlanPanel.match(/aria-label="/g) ?? []).length;
if (labelledIconButtonCount < iconButtonCount) {
  errors.push("src/components/NavigationPlanPanel.tsx: every icon-only button needs an aria-label.");
}

if (errors.length > 0) {
  console.error("Accessibility gate failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Accessibility gate passed: keyboard skip link, focus ring, labelled controls, and live plan updates present.");
