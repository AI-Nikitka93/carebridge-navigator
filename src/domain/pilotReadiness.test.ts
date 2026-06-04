import { describe, expect, it } from "vitest";
import {
  PILOT_ROADMAP,
  PRESENTME_DO_NOT_CLAIM,
  SAFETY_BOUNDARIES,
  SUSTAINABILITY_MODEL,
  readinessItems,
} from "./pilotReadiness";

describe("pilot readiness metadata", () => {
  it("keeps safety, roadmap, and sustainability signals visible to PresentMe", () => {
    expect(SAFETY_BOUNDARIES).toHaveLength(3);
    expect(PILOT_ROADMAP).toHaveLength(3);
    expect(SUSTAINABILITY_MODEL).toHaveLength(3);
    expect(readinessItems()).toHaveLength(9);
    expect(readinessItems().map((item) => item.kind)).toEqual(
      expect.arrayContaining(["safety_boundary", "pilot_next_step", "sustainability_model"]),
    );
  });

  it("makes the non-production health safety boundary explicit", () => {
    const safetyText = SAFETY_BOUNDARIES.map((item) => item.detail).join(" ");

    expect(safetyText).toMatch(/does not diagnose/i);
    expect(safetyText).toMatch(/human escalation/i);
    expect(safetyText).toMatch(/locally only/i);
    expect(PRESENTME_DO_NOT_CLAIM).toContain("production-ready");
    expect(PRESENTME_DO_NOT_CLAIM).toContain("clinically validated");
  });
});
