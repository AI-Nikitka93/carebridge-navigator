import type { CommunitySnapshot } from "./impactAnalytics";
import type { NavigationPlan } from "./careTypes";

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildOutreachCsv(snapshot: CommunitySnapshot): string {
  const header = [
    "household",
    "priority",
    "risk_score",
    "access_friction",
    "follow_up_hours",
    "language_handoff",
    "decision_evidence",
    "sdg_targets",
    "top_actions",
    "matched_resources",
  ];

  const plansByHousehold = new Map(snapshot.plans.map((plan) => [extractHouseholdCode(plan), plan]));
  const prioritizedPlans = snapshot.queue
    .map((item) => plansByHousehold.get(item.householdCode))
    .filter((plan): plan is NavigationPlan => Boolean(plan));

  const rows = prioritizedPlans.map((plan) => [
    plan.headline.replace(
      /^Navigation plan for |^Immediate escalation for /,
      "",
    ),
    plan.priority,
    plan.riskScore,
    plan.equityScore,
    plan.followUpHours,
    `${plan.languageHandoff.label}: ${plan.languageHandoff.cue}`,
    plan.decisionSignals.map((signal) => signal.label).join("; "),
    plan.sdgTargets.join("; "),
    plan.actions
      .slice(0, 3)
      .map((action) => action.title)
      .join("; "),
    plan.matchedResources.map((resource) => resource.name).join("; "),
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

export function extractHouseholdCode(plan: NavigationPlan): string {
  return plan.headline.replace(
    /^Navigation plan for |^Immediate escalation for /,
    "",
  );
}

export function buildFieldCard(plan: NavigationPlan): string {
  const householdCode = extractHouseholdCode(plan);
  const actions = plan.actions
    .slice(0, 4)
    .map((action, index) => `${index + 1}. ${action.title} [${action.urgency.replaceAll("_", " ")}]`)
    .join("\n");
  const evidence = plan.decisionSignals
    .map((signal) => `- ${signal.label}: ${signal.detail}`)
    .join("\n");
  const resources =
    plan.matchedResources.length > 0
      ? plan.matchedResources
          .slice(0, 4)
          .map(
            (resource) =>
              `- ${resource.name} (${resource.channel.replaceAll("_", " ")}, ${resource.availability})`,
          )
          .join("\n")
      : "- Supervisor review";

  return [
    "CareBridge Navigator field card",
    `Household: ${householdCode}`,
    `Priority: ${plan.priority.replaceAll("_", " ")}`,
    `Follow-up window: ${plan.followUpHours} hours`,
    `Language handoff: ${plan.languageHandoff.label} - ${plan.languageHandoff.cue}`,
    "",
    "Decision evidence:",
    evidence,
    "",
    "Navigation actions:",
    actions,
    "",
    "Resource handoff:",
    resources,
    "",
    `SDG 3 targets: ${plan.sdgTargets.join(", ")}`,
    "",
    plan.safetyNotice,
    "This field card is a navigation handoff, not a diagnosis.",
  ].join("\n");
}

export function fieldCardFilename(plan: NavigationPlan): string {
  const householdCode = extractHouseholdCode(plan)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `carebridge-field-card-${householdCode || "household"}.txt`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
