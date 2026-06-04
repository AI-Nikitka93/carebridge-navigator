import type { SdgTargetId } from "./sdgTargets";

export type AgeGroup =
  | "child_under_5"
  | "pregnant_or_postpartum"
  | "adolescent"
  | "adult"
  | "older_adult";

export type HealthConcern =
  | "maternal_follow_up"
  | "newborn_child_health"
  | "immunization_gap"
  | "mental_distress"
  | "chronic_care_gap"
  | "communicable_symptoms"
  | "nutrition_risk"
  | "medication_access";

export type AccessBarrier =
  | "no_transport"
  | "cost_pressure"
  | "low_connectivity"
  | "language_support"
  | "caregiver_gap"
  | "disability_access"
  | "stigma_or_safety";

export type WarningSign =
  | "self_harm_risk"
  | "pregnancy_bleeding"
  | "infant_fever"
  | "severe_dehydration"
  | "chest_pain"
  | "breathing_difficulty";

export type TriagePriority =
  | "emergency"
  | "same_day"
  | "within_72_hours"
  | "routine";

export type ActionOwner = "health_worker" | "client" | "clinic" | "system";

export type DecisionSignalKind = "safety" | "risk" | "access" | "workflow";

export interface CareIntake {
  householdCode: string;
  ageGroup: AgeGroup;
  concerns: HealthConcern[];
  barriers: AccessBarrier[];
  warningSigns: WarningSign[];
  distanceKm: number;
  hasPhoneAccess: boolean;
  preferredLanguage: "english" | "spanish" | "french" | "local_language";
  consentToStore: boolean;
}

export interface CareResource {
  id: string;
  name: string;
  category:
    | "emergency"
    | "clinic"
    | "mental_health"
    | "maternal_child"
    | "community"
    | "logistics";
  tags: string[];
  distanceKm: number;
  availability: string;
  channel: "walk_in" | "phone" | "sms" | "offline_referral";
}

export interface CareAction {
  id: string;
  title: string;
  rationale: string;
  owner: ActionOwner;
  urgency: TriagePriority;
  resourceTags: string[];
  sdgTargets: SdgTargetId[];
}

export interface DecisionSignal {
  id: string;
  label: string;
  detail: string;
  kind: DecisionSignalKind;
}

export interface LanguageHandoff {
  preferredLanguage: CareIntake["preferredLanguage"];
  label: string;
  cue: string;
}

export interface NavigationPlan {
  priority: TriagePriority;
  riskScore: number;
  equityScore: number;
  headline: string;
  safetyNotice: string;
  followUpHours: number;
  languageHandoff: LanguageHandoff;
  actions: CareAction[];
  decisionSignals: DecisionSignal[];
  matchedResources: CareResource[];
  sdgTargets: SdgTargetId[];
  handoffScript: string;
}
