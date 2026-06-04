import type { CareIntake } from "./careTypes";

export const DEMO_SCENARIOS = {
  maternalRemote: {
    householdCode: "HH-014 Maternal remote",
    ageGroup: "pregnant_or_postpartum",
    concerns: ["maternal_follow_up", "medication_access"],
    barriers: ["no_transport", "cost_pressure", "low_connectivity"],
    warningSigns: [],
    distanceKm: 14,
    hasPhoneAccess: false,
    preferredLanguage: "local_language",
    consentToStore: true
  },
  youthWellbeing: {
    householdCode: "HH-039 Youth support",
    ageGroup: "adolescent",
    concerns: ["mental_distress"],
    barriers: ["stigma_or_safety", "language_support"],
    warningSigns: [],
    distanceKm: 3,
    hasPhoneAccess: true,
    preferredLanguage: "english",
    consentToStore: false
  },
  emergencyChild: {
    householdCode: "HH-122 Child urgent",
    ageGroup: "child_under_5",
    concerns: ["newborn_child_health", "nutrition_risk"],
    barriers: ["caregiver_gap"],
    warningSigns: ["infant_fever", "severe_dehydration"],
    distanceKm: 6,
    hasPhoneAccess: true,
    preferredLanguage: "french",
    consentToStore: true
  },
  chronicCare: {
    householdCode: "HH-205 Chronic care",
    ageGroup: "older_adult",
    concerns: ["chronic_care_gap", "medication_access"],
    barriers: ["cost_pressure", "disability_access"],
    warningSigns: [],
    distanceKm: 7,
    hasPhoneAccess: true,
    preferredLanguage: "spanish",
    consentToStore: true
  },
  communityFever: {
    householdCode: "HH-311 Community fever",
    ageGroup: "adult",
    concerns: ["communicable_symptoms"],
    barriers: ["low_connectivity", "language_support"],
    warningSigns: [],
    distanceKm: 9,
    hasPhoneAccess: false,
    preferredLanguage: "local_language",
    consentToStore: true
  }
} satisfies Record<string, CareIntake>;

export type DemoScenarioKey = keyof typeof DEMO_SCENARIOS;

export interface DemoScenarioStory {
  label: string;
  judgeCue: string;
  sdgProof: string;
}

export const DEMO_SCENARIO_STORIES: Record<DemoScenarioKey, DemoScenarioStory> = {
  maternalRemote: {
    label: "Maternal remote",
    judgeCue: "Shows maternal follow-up, transport/cost barriers, local-language handoff, and offline continuity.",
    sdgProof: "Best for explaining SDG 3.1, 3.7, 3.8, and 3.c."
  },
  youthWellbeing: {
    label: "Youth support",
    judgeCue: "Shows non-diagnostic mental well-being support, stigma-aware contact, and storage consent off.",
    sdgProof: "Best for explaining SDG 3.4 and privacy-safe human follow-up."
  },
  emergencyChild: {
    label: "Child urgent",
    judgeCue: "Shows warning signs overriding normal scoring and escalating to urgent human care.",
    sdgProof: "Best for explaining SDG 3.2, 3.d, and safety-first escalation."
  },
  chronicCare: {
    label: "Chronic care",
    judgeCue: "Shows medication continuity, disability access, cost pressure, and Spanish handoff wording.",
    sdgProof: "Best for explaining SDG 3.4 and universal health coverage."
  },
  communityFever: {
    label: "Community fever",
    judgeCue: "Shows communicable-disease testing, low-connectivity follow-up, and resource coverage gaps.",
    sdgProof: "Best for explaining SDG 3.3, 3.d, and readiness before community risk grows."
  }
};

export const DEMO_SCENARIO_OPTIONS = (Object.keys(DEMO_SCENARIOS) as DemoScenarioKey[]).map((value) => ({
  value,
  ...DEMO_SCENARIO_STORIES[value]
}));

export const DEFAULT_SCENARIO = DEMO_SCENARIOS.maternalRemote;
