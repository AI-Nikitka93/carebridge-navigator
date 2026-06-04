import { describe, expect, it } from "vitest";
import { DEMO_SCENARIOS } from "./demoScenarios";
import { canLoadPersistedIntake, isCareIntake, shouldPersistIntake } from "./privacyPolicy";

describe("privacyPolicy", () => {
  it("persists only when the household intake has explicit local-storage consent", () => {
    expect(shouldPersistIntake(DEMO_SCENARIOS.maternalRemote)).toBe(true);
    expect(shouldPersistIntake(DEMO_SCENARIOS.youthWellbeing)).toBe(false);
  });

  it("rejects previously stored intake records that no longer carry consent", () => {
    expect(canLoadPersistedIntake(DEMO_SCENARIOS.maternalRemote)).toBe(true);
    expect(canLoadPersistedIntake(DEMO_SCENARIOS.youthWellbeing)).toBe(false);
    expect(canLoadPersistedIntake(null)).toBe(false);
  });

  it("rejects malformed persisted records even when consent is true", () => {
    expect(
      canLoadPersistedIntake({
        ...DEMO_SCENARIOS.maternalRemote,
        concerns: ["unknown_concern"]
      })
    ).toBe(false);

    expect(
      canLoadPersistedIntake({
        ...DEMO_SCENARIOS.maternalRemote,
        distanceKm: 999
      })
    ).toBe(false);
  });

  it("accepts only complete intake-shaped records", () => {
    expect(isCareIntake(DEMO_SCENARIOS.communityFever)).toBe(true);
    expect(isCareIntake({ consentToStore: true })).toBe(false);
    expect(isCareIntake("not an intake")).toBe(false);
  });
});
