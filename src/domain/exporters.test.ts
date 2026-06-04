import { describe, expect, it } from "vitest";
import { DEMO_SCENARIOS } from "./demoScenarios";
import { buildFieldCard, buildOutreachCsv, fieldCardFilename } from "./exporters";
import { buildCommunitySnapshot } from "./impactAnalytics";
import { createNavigationPlan } from "./triageEngine";

describe("buildOutreachCsv", () => {
  it("exports one row per demo household with operational columns", () => {
    const snapshot = buildCommunitySnapshot(Object.values(DEMO_SCENARIOS));
    const csv = buildOutreachCsv(snapshot);
    const rows = csv.split("\n");

    expect(rows).toHaveLength(Object.values(DEMO_SCENARIOS).length + 1);
    expect(rows[0]).toBe(
      "household,priority,risk_score,access_friction,follow_up_hours,language_handoff,decision_evidence,sdg_targets,top_actions,matched_resources"
    );
    expect(csv).toContain("HH-014 Maternal remote");
    expect(csv).toContain("HH-311 Community fever");
    expect(rows[0]).toContain("decision_evidence");
    expect(rows[0]).toContain("language_handoff");
    expect(csv).toContain("Route to testing and prevention outreach");
  });

  it("exports the supervisor queue in priority order", () => {
    const snapshot = buildCommunitySnapshot(Object.values(DEMO_SCENARIOS));
    const csv = buildOutreachCsv(snapshot);
    const rows = csv.split("\n");

    expect(rows[1]).toContain("HH-122 Child urgent");
    expect(rows[1]).toContain("emergency");
  });

  it("keeps multi-action lists inside stable spreadsheet columns", () => {
    const snapshot = buildCommunitySnapshot([DEMO_SCENARIOS.maternalRemote]);
    const csv = buildOutreachCsv(snapshot);
    const row = csv.split("\n")[1].split(",");

    expect(row).toHaveLength(10);
    expect(row[5]).toContain("Local language: Assign a language-matched worker");
    expect(row[6]).toContain("Higher-priority age group; Care concerns");
    expect(row[7]).toContain("3.1; 3.7; 3.8");
    expect(row[8]).toContain("Book a maternal care handoff; Protect medication and chronic-care continuity");
  });
});

describe("buildFieldCard", () => {
  it("exports a printable frontline handoff for the active household", () => {
    const plan = createNavigationPlan(DEMO_SCENARIOS.communityFever);
    const fieldCard = buildFieldCard(plan);

    expect(fieldCard).toContain("CareBridge Navigator field card");
    expect(fieldCard).toContain("Household: HH-311 Community fever");
    expect(fieldCard).toContain("Decision evidence:");
    expect(fieldCard).toContain("Language handoff:");
    expect(fieldCard).toContain("Navigation actions:");
    expect(fieldCard).toContain("Resource handoff:");
    expect(fieldCard).toContain("Route to testing and prevention outreach");
    expect(fieldCard).toContain("This field card is a navigation handoff, not a diagnosis.");
  });

  it("creates a stable lowercase text filename", () => {
    const plan = createNavigationPlan(DEMO_SCENARIOS.maternalRemote);

    expect(fieldCardFilename(plan)).toBe("carebridge-field-card-hh-014-maternal-remote.txt");
  });
});
