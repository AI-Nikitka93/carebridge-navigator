import type { CareIntake } from "./careTypes";

const ageGroups = new Set([
  "child_under_5",
  "pregnant_or_postpartum",
  "adolescent",
  "adult",
  "older_adult"
]);

const healthConcerns = new Set([
  "maternal_follow_up",
  "newborn_child_health",
  "immunization_gap",
  "mental_distress",
  "chronic_care_gap",
  "communicable_symptoms",
  "nutrition_risk",
  "medication_access"
]);

const accessBarriers = new Set([
  "no_transport",
  "cost_pressure",
  "low_connectivity",
  "language_support",
  "caregiver_gap",
  "disability_access",
  "stigma_or_safety"
]);

const warningSigns = new Set([
  "self_harm_risk",
  "pregnancy_bleeding",
  "infant_fever",
  "severe_dehydration",
  "chest_pain",
  "breathing_difficulty"
]);

const preferredLanguages = new Set(["english", "spanish", "french", "local_language"]);

export function shouldPersistIntake(intake: CareIntake): boolean {
  return intake.consentToStore;
}

export function canLoadPersistedIntake(
  intake: unknown,
): intake is CareIntake {
  return isCareIntake(intake) && intake.consentToStore;
}

export function isCareIntake(value: unknown): value is CareIntake {
  if (!isRecord(value)) return false;

  return (
    typeof value.householdCode === "string" &&
    value.householdCode.trim().length > 0 &&
    typeof value.ageGroup === "string" &&
    ageGroups.has(value.ageGroup) &&
    isValidStringList(value.concerns, healthConcerns) &&
    isValidStringList(value.barriers, accessBarriers) &&
    isValidStringList(value.warningSigns, warningSigns) &&
    typeof value.distanceKm === "number" &&
    Number.isFinite(value.distanceKm) &&
    value.distanceKm >= 0 &&
    value.distanceKm <= 25 &&
    typeof value.hasPhoneAccess === "boolean" &&
    typeof value.preferredLanguage === "string" &&
    preferredLanguages.has(value.preferredLanguage) &&
    typeof value.consentToStore === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidStringList(value: unknown, allowedValues: Set<string>): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && allowedValues.has(item));
}
