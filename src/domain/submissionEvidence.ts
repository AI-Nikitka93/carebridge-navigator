export type SubmissionCriterionId =
  | "github_uploaded_code"
  | "presentme_repo_analyzer"
  | "sdg_3_relation"
  | "code_neatness";

export type EvidenceStatus =
  | "implemented_local"
  | "analyzer_input_ready"
  | "public_verification_required";

export interface SubmissionEvidenceItem {
  sourcePath: string;
  proof: string;
  status: EvidenceStatus;
}

export interface SubmissionCriterionEvidence {
  id: SubmissionCriterionId;
  marks: number;
  judgeQuestion: string;
  winCondition: string;
  evidence: SubmissionEvidenceItem[];
}

export const DEVPOST_SCORING_EVIDENCE: SubmissionCriterionEvidence[] = [
  {
    id: "github_uploaded_code",
    marks: 30,
    judgeQuestion: "Was the code successfully uploaded on GitHub?",
    winCondition:
      "Publish the committed README-free source as a public GitHub repository with MIT license, reproducible install, and CI.",
    evidence: [
      {
        sourcePath: "LICENSE",
        proof: "MIT license is present for open-source eligibility.",
        status: "implemented_local",
      },
      {
        sourcePath: "package-lock.json",
        proof: "Reproducible npm install is committed for judges and GitHub Actions.",
        status: "implemented_local",
      },
      {
        sourcePath: ".github/workflows/quality.yml",
        proof: "Public CI will run npm ci and the canonical release gate after push.",
        status: "implemented_local",
      },
      {
        sourcePath: "scripts/check-submission.mjs",
        proof:
          "Submission gate protects the public source tree against README files, private docs, logs, screenshots, package archives, and generated clutter.",
        status: "implemented_local",
      },
      {
        sourcePath: "scripts/check-public-repo.mjs",
        proof:
          "Post-public gate is ready to verify public visibility, repository description/topics, README-free source, expected public HEAD, and hosted Actions after the account-linked repository push.",
        status: "public_verification_required",
      },
    ],
  },
  {
    id: "presentme_repo_analyzer",
    marks: 40,
    judgeQuestion: "Was the code analyzed using PresentMe Repo Analyzer to generate a README?",
    winCondition:
      "Make the README-free codebase self-explanatory so PresentMe can infer product, safety, demo flow, SDG mapping, and implementation quality from source.",
    evidence: [
      {
        sourcePath: "src/domain/demoScenarios.ts",
        proof: "Judge-facing demo stories describe which scenario proves which SDG 3 value.",
        status: "analyzer_input_ready",
      },
      {
        sourcePath: "src/domain/sdgTargets.ts",
        proof: "Plain-language SDG 3 target ledger is encoded as source, not only pitch copy.",
        status: "analyzer_input_ready",
      },
      {
        sourcePath: "src/domain/pilotReadiness.ts",
        proof:
          "Safety boundaries, pilot roadmap, sustainability model, and do-not-claim guardrails are visible to the analyzer.",
        status: "analyzer_input_ready",
      },
      {
        sourcePath: "src/components/PilotReadinessPanel.tsx",
        proof:
          "The app renders a judge-visible path from hackathon demo to governed field pilot without clinical overclaiming.",
        status: "analyzer_input_ready",
      },
      {
        sourcePath: "scripts/check-ui.mjs",
        proof:
          "Production bundle gate confirms the built app exposes demo, safety, SDG, offline, field-card, resource-gap, and readiness signals.",
        status: "implemented_local",
      },
    ],
  },
  {
    id: "sdg_3_relation",
    marks: 20,
    judgeQuestion: "Was the code/project related to SDG 3?",
    winCondition:
      "Prove direct SDG 3 relation through care navigation, warning-sign escalation, UHC barriers, CHW workflow, and target-by-target evidence.",
    evidence: [
      {
        sourcePath: "src/domain/sdgTargets.ts",
        proof: "Covers targets 3.1, 3.2, 3.3, 3.4, 3.7, 3.8, 3.c, and 3.d.",
        status: "implemented_local",
      },
      {
        sourcePath: "src/domain/triageEngine.ts",
        proof:
          "Navigation actions map household concerns and access barriers to SDG 3 targets while keeping outputs non-diagnostic.",
        status: "implemented_local",
      },
      {
        sourcePath: "src/domain/impactAnalytics.ts",
        proof:
          "Supervisor snapshot counts target coverage, access friction, priority outreach, and resource coverage gaps.",
        status: "implemented_local",
      },
      {
        sourcePath: "src/components/CommunityDashboard.tsx",
        proof: "UI surfaces SDG target coverage, priority queue, resource gaps, and supervisor focus.",
        status: "implemented_local",
      },
    ],
  },
  {
    id: "code_neatness",
    marks: 10,
    judgeQuestion: "Was code well arranged in a quality manner?",
    winCondition:
      "Keep the repo small, typed, deterministic, tested, dependency-light, accessible, offline-capable, and free of generated clutter.",
    evidence: [
      {
        sourcePath: "src/domain/triageEngine.test.ts",
        proof: "Deterministic triage, safety escalation, routine fallback, and SDG 3.8 barrier actions are tested.",
        status: "implemented_local",
      },
      {
        sourcePath: "src/domain/impactAnalytics.test.ts",
        proof: "Supervisor analytics and full SDG target coverage are tested.",
        status: "implemented_local",
      },
      {
        sourcePath: "scripts/check-code-safety.mjs",
        proof: "Static safety gate rejects secrets, unexpected external URLs, API dependence, and over-broad env reads.",
        status: "implemented_local",
      },
      {
        sourcePath: "scripts/check-accessibility.mjs",
        proof: "Accessibility gate checks skip link, focus visibility, labelled controls, and live plan updates.",
        status: "implemented_local",
      },
      {
        sourcePath: "package.json",
        proof: "Runtime dependencies are intentionally limited to React, React DOM, and lucide-react.",
        status: "implemented_local",
      },
    ],
  },
];

export const REQUIRED_POST_PUBLIC_CHECKS = [
  "Create the public GitHub repository from the committed source without GitHub's auto README option.",
  "Confirm the pushed repository still contains no README before PresentMe analysis.",
  "Confirm the public GitHub Actions Quality workflow passes.",
  "Run PresentMe Repo Analyzer on the public repository URL and review the generated README/presentation.",
  "Submit Devpost only after the GitHub URL and PresentMe-generated output are live.",
] as const;

export function totalDevpostMarks(): number {
  return DEVPOST_SCORING_EVIDENCE.reduce((sum, criterion) => sum + criterion.marks, 0);
}

export function evidenceForCriterion(id: SubmissionCriterionId): SubmissionCriterionEvidence {
  const criterion = DEVPOST_SCORING_EVIDENCE.find((item) => item.id === id);
  if (!criterion) {
    throw new Error(`Unknown submission criterion: ${id}`);
  }
  return criterion;
}
