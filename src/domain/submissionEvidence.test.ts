import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEVPOST_SCORING_EVIDENCE,
  REQUIRED_POST_PUBLIC_CHECKS,
  evidenceForCriterion,
  totalDevpostMarks,
} from "./submissionEvidence";

describe("submission evidence ledger", () => {
  it("mirrors the official 100-point Devpost scoring surface", () => {
    expect(totalDevpostMarks()).toBe(100);
    expect(DEVPOST_SCORING_EVIDENCE.map((criterion) => criterion.id)).toEqual([
      "github_uploaded_code",
      "presentme_repo_analyzer",
      "sdg_3_relation",
      "code_neatness",
    ]);
    expect(DEVPOST_SCORING_EVIDENCE.map((criterion) => criterion.marks)).toEqual([30, 40, 20, 10]);
  });

  it("keeps every evidence path inside the public source tree", () => {
    for (const criterion of DEVPOST_SCORING_EVIDENCE) {
      expect(criterion.evidence.length).toBeGreaterThan(0);
      for (const item of criterion.evidence) {
        expect(item.sourcePath).not.toMatch(/^docs\//);
        expect(item.sourcePath).not.toMatch(/README/i);
        expect(existsSync(join(process.cwd(), item.sourcePath))).toBe(true);
      }
    }
  });

  it("separates local readiness from account-linked public verification", () => {
    const githubEvidence = evidenceForCriterion("github_uploaded_code");

    expect(githubEvidence.evidence.some((item) => item.status === "implemented_local")).toBe(true);
    expect(githubEvidence.evidence.some((item) => item.status === "public_verification_required")).toBe(true);
    expect(githubEvidence.winCondition).toContain("committed README-free source");
    expect(githubEvidence.winCondition).not.toContain("staged");
    expect(githubEvidence.evidence).toContainEqual(
      expect.objectContaining({
        sourcePath: "scripts/check-public-repo.mjs",
        status: "public_verification_required",
      }),
    );
    expect(
      githubEvidence.evidence.find((item) => item.sourcePath === "scripts/check-public-repo.mjs")?.proof,
    ).toContain("repository description/topics");
    expect(REQUIRED_POST_PUBLIC_CHECKS).toContain(
      "Create the public GitHub repository from the committed source without GitHub's auto README option.",
    );
  });
});
