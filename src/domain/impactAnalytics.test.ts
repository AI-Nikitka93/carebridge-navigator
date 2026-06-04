import { describe, expect, it } from "vitest";
import type { CareResource } from "./careTypes";
import { DEMO_SCENARIOS } from "./demoScenarios";
import { buildCommunitySnapshot } from "./impactAnalytics";
import { SDG_TARGETS, describeTarget } from "./sdgTargets";

describe("buildCommunitySnapshot", () => {
  it("summarizes urgent plans, access friction, and SDG coverage", () => {
    const snapshot = buildCommunitySnapshot(Object.values(DEMO_SCENARIOS));

    expect(snapshot.plans).toHaveLength(Object.values(DEMO_SCENARIOS).length);
    expect(snapshot.queue).toHaveLength(Object.values(DEMO_SCENARIOS).length);
    expect(snapshot.metrics.find((metric) => metric.label === "Same-day or emergency")?.value).toBeGreaterThan(0);
    expect(snapshot.metrics.find((metric) => metric.label === "SDG 3 targets touched")?.value).toBeGreaterThan(3);
    expect(snapshot.barrierCounts.cost_pressure).toBe(2);
    expect(snapshot.targetCounts["3.8"]).toBe(Object.values(DEMO_SCENARIOS).length);
    expect(snapshot.supervisorFocus.label).toBe("low connectivity");
    expect(snapshot.supervisorFocus.recommendation).toContain("urgent households");
  });

  it("touches every SDG target declared in the product ledger across demo scenarios", () => {
    const snapshot = buildCommunitySnapshot(Object.values(DEMO_SCENARIOS));
    const touchedTargets = new Set(snapshot.plans.flatMap((plan) => plan.sdgTargets));

    expect([...touchedTargets].sort()).toEqual(Object.keys(SDG_TARGETS).sort());
    expect(Object.keys(snapshot.targetCounts).sort()).toEqual(Object.keys(SDG_TARGETS).sort());
    expect(Object.values(snapshot.targetCounts).every((count) => count > 0)).toBe(true);
  });

  it("orders the supervisor queue by urgency, follow-up window, and field value", () => {
    const snapshot = buildCommunitySnapshot(Object.values(DEMO_SCENARIOS));

    expect(snapshot.queue[0]).toMatchObject({
      householdCode: "HH-122 Child urgent",
      priority: "emergency",
      followUpHours: 0,
      topAction: "Escalate immediately to urgent human care",
    });

    const maternalItem = snapshot.queue.find((item) => item.householdCode === "HH-014 Maternal remote");
    const feverItem = snapshot.queue.find((item) => item.householdCode === "HH-311 Community fever");

    expect(maternalItem?.topResource).toContain("Maternal");
    expect(feverItem?.topAction).toBe("Route to testing and prevention outreach");
  });

  it("renders plain-language target descriptions for PresentMe-friendly analysis", () => {
    expect(describeTarget("3.8")).toContain("Universal health coverage");
    expect(describeTarget("3.c")).toContain("community health workers");
  });

  it("keeps supervisor focus useful when no repeated barrier exists", () => {
    const snapshot = buildCommunitySnapshot([]);

    expect(snapshot.supervisorFocus.label).toBe("routine outreach");
    expect(snapshot.queue).toEqual([]);
    expect(snapshot.resourceGaps).toEqual([]);
    expect(snapshot.supervisorFocus.recommendation).toContain("routine follow-up");
  });

  it("identifies missing local service tags for supervisor resource planning", () => {
    const limitedDirectory: CareResource[] = [
      {
        id: "offline-kiosk-only",
        name: "Offline kiosk only",
        category: "community",
        tags: ["low-connectivity", "translation", "forms", "follow-up"],
        distanceKm: 1.4,
        availability: "Daily offline handoff",
        channel: "offline_referral",
      },
    ];

    const snapshot = buildCommunitySnapshot([DEMO_SCENARIOS.communityFever], limitedDirectory);

    expect(snapshot.resourceGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: "communicable",
          affectedHouseholds: 1,
          exampleHouseholds: ["HH-311 Community fever"],
        }),
        expect.objectContaining({
          tag: "testing",
          affectedHouseholds: 1,
          exampleHouseholds: ["HH-311 Community fever"],
        }),
      ]),
    );
  });
});
