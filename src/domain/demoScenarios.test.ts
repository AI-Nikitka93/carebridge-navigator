import { describe, expect, it } from "vitest";
import { DEMO_SCENARIO_OPTIONS, DEMO_SCENARIO_STORIES, DEMO_SCENARIOS } from "./demoScenarios";

describe("demo scenario stories", () => {
  it("keeps every judge demo scenario paired with analyzer-readable story metadata", () => {
    const scenarioKeys = Object.keys(DEMO_SCENARIOS).sort();

    expect(Object.keys(DEMO_SCENARIO_STORIES).sort()).toEqual(scenarioKeys);
    expect(DEMO_SCENARIO_OPTIONS.map((scenario) => scenario.value).sort()).toEqual(scenarioKeys);
    for (const story of Object.values(DEMO_SCENARIO_STORIES)) {
      expect(story.label).not.toHaveLength(0);
      expect(story.judgeCue).toMatch(/show/i);
      expect(story.sdgProof).toMatch(/SDG 3/i);
    }
  });
});
