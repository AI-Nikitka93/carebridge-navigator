export type ReadinessKind = "safety_boundary" | "pilot_next_step" | "sustainability_model";

export interface ReadinessItem {
  id: string;
  kind: ReadinessKind;
  title: string;
  detail: string;
}

export const SAFETY_BOUNDARIES: ReadinessItem[] = [
  {
    id: "not-diagnosis",
    kind: "safety_boundary",
    title: "Navigation only, not diagnosis",
    detail:
      "CareBridge does not diagnose, prescribe, predict disease, replace clinicians, or claim clinical validation.",
  },
  {
    id: "human-escalation",
    kind: "safety_boundary",
    title: "Warning signs escalate to people",
    detail:
      "Urgent warning signs produce a human escalation path instead of treatment instructions or automated medical advice.",
  },
  {
    id: "no-server-patient-data",
    kind: "safety_boundary",
    title: "No server-side patient data in the demo",
    detail:
      "The hackathon demo runs in the browser and persists structured intake locally only when explicit storage consent is enabled.",
  },
];

export const PILOT_ROADMAP: ReadinessItem[] = [
  {
    id: "localization-packs",
    kind: "pilot_next_step",
    title: "Localized handoff packs",
    detail:
      "Add reviewed multilingual wording, local resource labels, and teach-back scripts with community health partner input.",
  },
  {
    id: "encrypted-profiles",
    kind: "pilot_next_step",
    title: "Encrypted local profiles",
    detail:
      "Replace plain localStorage with encrypted, device-bound records before any real household deployment.",
  },
  {
    id: "governed-sync",
    kind: "pilot_next_step",
    title: "Audited optional sync",
    detail:
      "Add role-based supervisor sync only after governance review, data minimization, and local partner approval.",
  },
];

export const SUSTAINABILITY_MODEL: ReadinessItem[] = [
  {
    id: "open-core",
    kind: "sustainability_model",
    title: "Free open-source core",
    detail:
      "Keep the care-navigation core free for students, small NGOs, and community teams so the product does not create a patient access barrier.",
  },
  {
    id: "implementation-support",
    kind: "sustainability_model",
    title: "Paid implementation support",
    detail:
      "Charge organizations, not patients, for resource-directory configuration, training, governance review, and deployment support.",
  },
  {
    id: "hosted-dashboard",
    kind: "sustainability_model",
    title: "Optional hosted supervisor dashboard",
    detail:
      "Offer a managed multi-site reporting layer only for organizations that need secure coordination beyond the local-first app.",
  },
];

export const PRESENTME_DO_NOT_CLAIM = [
  "AI doctor",
  "diagnoses patients",
  "clinically validated",
  "replaces clinicians",
  "real patient data",
  "official partner",
  "HIPAA/GDPR compliant",
  "production-ready",
] as const;

export function readinessItems(): ReadinessItem[] {
  return [...SAFETY_BOUNDARIES, ...PILOT_ROADMAP, ...SUSTAINABILITY_MODEL];
}
