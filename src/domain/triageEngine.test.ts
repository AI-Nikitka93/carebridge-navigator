import { describe, expect, it } from "vitest";
import type { CareIntake } from "./careTypes";
import { DEMO_SCENARIOS } from "./demoScenarios";
import {
  buildLanguageHandoff,
  calculateAccessFriction,
  calculateRiskScore,
  createNavigationPlan,
} from "./triageEngine";

describe("createNavigationPlan", () => {
  it("creates an actionable plan for every judge demo scenario", () => {
    for (const scenario of Object.values(DEMO_SCENARIOS)) {
      const plan = createNavigationPlan(scenario);

      expect(plan.headline).toContain(scenario.householdCode);
      expect(plan.actions.length).toBeGreaterThan(0);
      expect(plan.matchedResources.length).toBeGreaterThan(0);
      expect(plan.sdgTargets.length).toBeGreaterThan(0);
      expect(plan.handoffScript).toContain("navigation handoff");
      expect(plan.decisionSignals.length).toBeGreaterThan(0);
    }
  });

  it("escalates warning signs immediately", () => {
    const plan = createNavigationPlan(DEMO_SCENARIOS.emergencyChild);

    expect(plan.priority).toBe("emergency");
    expect(plan.followUpHours).toBe(0);
    expect(plan.actions[0].id).toBe("immediate-escalation");
    expect(plan.decisionSignals[0].id).toBe("warning-signs");
    expect(plan.sdgTargets).toContain("3.d");
  });

  it("turns access barriers into concrete SDG 3.8 actions", () => {
    const plan = createNavigationPlan(DEMO_SCENARIOS.maternalRemote);

    expect(plan.priority).toBe("same_day");
    expect(plan.actions.map((action) => action.id)).toContain("transport-plan");
    expect(plan.actions.map((action) => action.id)).toContain("offline-follow-up");
    expect(plan.decisionSignals.map((signal) => signal.id)).toContain("access-barriers");
    expect(plan.decisionSignals.map((signal) => signal.id)).toContain("distance-friction");
    expect(plan.sdgTargets).toContain("3.8");
  });

  it("keeps mental health support non-diagnostic", () => {
    const plan = createNavigationPlan(DEMO_SCENARIOS.youthWellbeing);

    expect(plan.actions.some((action) => action.id === "mental-wellbeing-support")).toBe(true);
    expect(plan.safetyNotice).toMatch(/non-diagnostic/i);
    expect(plan.handoffScript).toMatch(/not a diagnosis/i);
  });

  it("adds a language-safe handoff cue without claiming translation automation", () => {
    const plan = createNavigationPlan(DEMO_SCENARIOS.chronicCare);

    expect(buildLanguageHandoff(DEMO_SCENARIOS.chronicCare).cue).toMatch(/teach-back/i);
    expect(plan.languageHandoff.label).toBe("Spanish");
    expect(plan.handoffScript).toContain("Language handoff:");
    expect(plan.handoffScript).not.toMatch(/automated translation|AI translation/i);
  });

  it("matches locally configured resources before a fixed deployment", () => {
    const plan = createNavigationPlan(DEMO_SCENARIOS.communityFever, [
      {
        id: "pop-up-fever-tent",
        name: "Pop-up fever testing tent",
        category: "clinic",
        tags: ["communicable", "testing", "prevention"],
        distanceKm: 0.8,
        availability: "Today until 18:00",
        channel: "sms"
      }
    ]);

    expect(plan.matchedResources[0].name).toBe("Pop-up fever testing tent");
    expect(plan.handoffScript).toContain("Pop-up fever testing tent");
  });

  it("keeps risk and equity scoring deterministic for replayable demos", () => {
    const firstRun = createNavigationPlan(DEMO_SCENARIOS.chronicCare);
    const secondRun = createNavigationPlan(DEMO_SCENARIOS.chronicCare);

    expect(firstRun).toEqual(secondRun);
    expect(calculateRiskScore(DEMO_SCENARIOS.chronicCare)).toBe(firstRun.riskScore);
    expect(calculateAccessFriction(DEMO_SCENARIOS.chronicCare)).toBe(firstRun.equityScore);
  });

  it("still returns a useful routine action when no concern or barrier is selected", () => {
    const lowRiskIntake: CareIntake = {
      householdCode: "HH-000 Low risk",
      ageGroup: "adult",
      concerns: [],
      barriers: [],
      warningSigns: [],
      distanceKm: 1,
      hasPhoneAccess: true,
      preferredLanguage: "english",
      consentToStore: false
    };

    const plan = createNavigationPlan(lowRiskIntake);

    expect(plan.priority).toBe("routine");
    expect(plan.actions.map((action) => action.id)).toEqual(["routine-community-check-in"]);
    expect(plan.decisionSignals.map((signal) => signal.id)).toEqual([
      "routine-low-risk",
      "local-storage-consent"
    ]);
    expect(plan.matchedResources.some((resource) => resource.tags.includes("follow-up"))).toBe(true);
    expect(plan.sdgTargets).toEqual(["3.8", "3.c"]);
  });
});
