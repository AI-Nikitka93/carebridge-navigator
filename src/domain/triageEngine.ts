import type {
  AccessBarrier,
  CareAction,
  CareIntake,
  CareResource,
  DecisionSignal,
  HealthConcern,
  LanguageHandoff,
  NavigationPlan,
  TriagePriority,
  WarningSign
} from "./careTypes";
import { COMMUNITY_RESOURCES } from "./resourceDirectory";
import type { SdgTargetId } from "./sdgTargets";

const concernTargets: Record<HealthConcern, SdgTargetId[]> = {
  maternal_follow_up: ["3.1", "3.7", "3.8"],
  newborn_child_health: ["3.2", "3.8"],
  immunization_gap: ["3.2", "3.8", "3.d"],
  mental_distress: ["3.4", "3.8"],
  chronic_care_gap: ["3.4", "3.8"],
  communicable_symptoms: ["3.3", "3.d"],
  nutrition_risk: ["3.2", "3.8"],
  medication_access: ["3.8", "3.4"]
};

const warningCopy: Record<WarningSign, string> = {
  self_harm_risk: "possible self-harm risk",
  pregnancy_bleeding: "pregnancy or postpartum bleeding",
  infant_fever: "fever in a young child or infant",
  severe_dehydration: "severe dehydration signs",
  chest_pain: "chest pain",
  breathing_difficulty: "breathing difficulty"
};

const concernCopy: Record<HealthConcern, string> = {
  maternal_follow_up: "maternal follow-up",
  newborn_child_health: "newborn or child health",
  immunization_gap: "missed immunization",
  mental_distress: "mental well-being support",
  chronic_care_gap: "chronic-care continuity",
  communicable_symptoms: "possible communicable symptoms",
  nutrition_risk: "nutrition risk",
  medication_access: "medication access"
};

const barrierCopy: Record<AccessBarrier, string> = {
  no_transport: "transport",
  cost_pressure: "cost pressure",
  low_connectivity: "low connectivity",
  language_support: "language support",
  caregiver_gap: "caregiver availability",
  disability_access: "disability access",
  stigma_or_safety: "stigma or safety"
};

const barrierTargets: Record<AccessBarrier, SdgTargetId[]> = {
  no_transport: ["3.8", "3.c"],
  cost_pressure: ["3.8"],
  low_connectivity: ["3.8", "3.c"],
  language_support: ["3.8", "3.c"],
  caregiver_gap: ["3.8"],
  disability_access: ["3.8"],
  stigma_or_safety: ["3.4", "3.8"]
};

const languageLabels: Record<CareIntake["preferredLanguage"], string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  local_language: "Local language"
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateAccessFriction(intake: CareIntake): number {
  const barrierWeight = intake.barriers.length * 13;
  const distanceWeight = intake.distanceKm > 12 ? 24 : intake.distanceKm > 6 ? 14 : 4;
  const phoneWeight = intake.hasPhoneAccess ? 0 : 18;
  const consentWeight = intake.consentToStore ? 0 : 6;
  return clamp(barrierWeight + distanceWeight + phoneWeight + consentWeight, 0, 100);
}

export function calculateRiskScore(intake: CareIntake): number {
  if (intake.warningSigns.length > 0) {
    return 100;
  }

  const vulnerableAge =
    intake.ageGroup === "child_under_5" ||
    intake.ageGroup === "pregnant_or_postpartum" ||
    intake.ageGroup === "older_adult";
  const vulnerabilityWeight = vulnerableAge ? 22 : 8;
  const concernWeight = intake.concerns.length * 12;
  const barrierWeight = Math.min(24, intake.barriers.length * 8);
  const distanceWeight = intake.distanceKm > 10 ? 12 : intake.distanceKm > 5 ? 6 : 0;

  return clamp(vulnerabilityWeight + concernWeight + barrierWeight + distanceWeight, 0, 100);
}

export function priorityFromScore(score: number): TriagePriority {
  if (score >= 95) return "emergency";
  if (score >= 65) return "same_day";
  if (score >= 38) return "within_72_hours";
  return "routine";
}

function buildConcernActions(intake: CareIntake): CareAction[] {
  const actions: CareAction[] = [];

  if (intake.concerns.includes("maternal_follow_up")) {
    actions.push({
      id: "maternal-handoff",
      title: "Book a maternal care handoff",
      rationale: "Pregnancy and postpartum concerns need skilled-care continuity, not self-management alone.",
      owner: "health_worker",
      urgency: "same_day",
      resourceTags: ["maternal", "newborn"],
      sdgTargets: ["3.1", "3.7", "3.8"]
    });
  }

  if (intake.concerns.includes("newborn_child_health") || intake.concerns.includes("immunization_gap")) {
    actions.push({
      id: "child-service-catchup",
      title: "Create a child health catch-up visit",
      rationale: "Children under five and missed immunization services should be routed to a concrete visit slot.",
      owner: "clinic",
      urgency: "within_72_hours",
      resourceTags: ["newborn", "immunization", "nutrition"],
      sdgTargets: ["3.2", "3.8", "3.d"]
    });
  }

  if (intake.concerns.includes("mental_distress")) {
    actions.push({
      id: "mental-wellbeing-support",
      title: "Offer a safe mental well-being support option",
      rationale: "The tool does not diagnose; it links the person to supportive human follow-up and safety resources.",
      owner: "health_worker",
      urgency: "same_day",
      resourceTags: ["mental-health", "safety", "same-day-phone"],
      sdgTargets: ["3.4", "3.8"]
    });
  }

  if (intake.concerns.includes("chronic_care_gap") || intake.concerns.includes("medication_access")) {
    actions.push({
      id: "continuity-of-care",
      title: "Protect medication and chronic-care continuity",
      rationale: "Missed refills and chronic-care gaps can become avoidable emergencies when cost or transport blocks care.",
      owner: "clinic",
      urgency: "within_72_hours",
      resourceTags: ["chronic-care", "medication", "cost"],
      sdgTargets: ["3.4", "3.8"]
    });
  }

  if (intake.concerns.includes("communicable_symptoms")) {
    actions.push({
      id: "testing-prevention-route",
      title: "Route to testing and prevention outreach",
      rationale: "Possible communicable symptoms need timely testing guidance and community risk reduction.",
      owner: "health_worker",
      urgency: "same_day",
      resourceTags: ["communicable", "testing", "prevention"],
      sdgTargets: ["3.3", "3.d", "3.8"]
    });
  }

  if (intake.concerns.includes("nutrition_risk")) {
    actions.push({
      id: "nutrition-follow-up",
      title: "Schedule nutrition screening and follow-up",
      rationale: "Nutrition risk is handled as a care-navigation issue with referral, not as a diagnosis.",
      owner: "health_worker",
      urgency: "within_72_hours",
      resourceTags: ["nutrition", "newborn"],
      sdgTargets: ["3.2", "3.8"]
    });
  }

  return actions;
}

function buildBarrierActions(intake: CareIntake): CareAction[] {
  const actions: CareAction[] = [];

  if (intake.barriers.includes("no_transport") || intake.distanceKm > 8) {
    actions.push({
      id: "transport-plan",
      title: "Resolve transport before assigning the visit",
      rationale: "A referral without transport is not an access plan.",
      owner: "system",
      urgency: "within_72_hours",
      resourceTags: ["transport", "access"],
      sdgTargets: ["3.8", "3.c"]
    });
  }

  if (intake.barriers.includes("cost_pressure")) {
    actions.push({
      id: "cost-safe-routing",
      title: "Use the lowest-cost eligible route first",
      rationale: "Financial hardship is a direct barrier to universal health coverage.",
      owner: "health_worker",
      urgency: "within_72_hours",
      resourceTags: ["cost", "access"],
      sdgTargets: ["3.8"]
    });
  }

  if (intake.barriers.includes("low_connectivity") || !intake.hasPhoneAccess) {
    actions.push({
      id: "offline-follow-up",
      title: "Prepare an offline follow-up path",
      rationale: "Low-connectivity households need paper, SMS, or kiosk-based continuity instead of app-only instructions.",
      owner: "health_worker",
      urgency: "within_72_hours",
      resourceTags: ["low-connectivity", "forms", "follow-up"],
      sdgTargets: ["3.8", "3.c"]
    });
  }

  if (intake.barriers.includes("language_support") || intake.preferredLanguage === "local_language") {
    actions.push({
      id: "language-safe-handoff",
      title: "Assign a language-safe handoff",
      rationale: "A person cannot act on a care plan they cannot understand.",
      owner: "clinic",
      urgency: "within_72_hours",
      resourceTags: ["translation", "forms"],
      sdgTargets: ["3.8", "3.c"]
    });
  }

  if (intake.barriers.includes("stigma_or_safety")) {
    actions.push({
      id: "private-contact-window",
      title: "Use a private contact window",
      rationale: "Stigma and safety barriers require careful follow-up timing and non-exposing communication.",
      owner: "health_worker",
      urgency: "same_day",
      resourceTags: ["mental-health", "safety"],
      sdgTargets: ["3.4", "3.8"]
    });
  }

  return actions;
}

function routineCheckInAction(): CareAction {
  return {
    id: "routine-community-check-in",
    title: "Schedule a routine community check-in",
    rationale: "Even low-risk households should leave outreach with a clear follow-up path and resource awareness.",
    owner: "health_worker",
    urgency: "routine",
    resourceTags: ["follow-up", "forms"],
    sdgTargets: ["3.8", "3.c"]
  };
}

function emergencyAction(intake: CareIntake): CareAction | null {
  if (intake.warningSigns.length === 0) return null;
  return {
    id: "immediate-escalation",
    title: "Escalate immediately to urgent human care",
    rationale: `Warning sign detected: ${intake.warningSigns.map((sign) => warningCopy[sign]).join(", ")}.`,
    owner: "health_worker",
    urgency: "emergency",
    resourceTags: ["emergency", "danger-signs", "transport"],
    sdgTargets: ["3.d", "3.8", "3.c"]
  };
}

function matchResources(actions: CareAction[], resources: CareResource[] = COMMUNITY_RESOURCES): CareResource[] {
  const wantedTags = new Set(actions.flatMap((action) => action.resourceTags));
  return resources
    .map((resource) => ({
      resource,
      score:
        resource.tags.filter((tag) => wantedTags.has(tag)).length * 10 -
        Math.min(8, Math.floor(resource.distanceKm / 2))
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.resource.distanceKm - b.resource.distanceKm)
    .slice(0, 5)
    .map(({ resource }) => resource);
}

function followUpHours(priority: TriagePriority): number {
  if (priority === "emergency") return 0;
  if (priority === "same_day") return 8;
  if (priority === "within_72_hours") return 72;
  return 168;
}

export function buildLanguageHandoff(intake: CareIntake): LanguageHandoff {
  const needsLanguageSupport =
    intake.preferredLanguage !== "english" || intake.barriers.includes("language_support");
  const label = languageLabels[intake.preferredLanguage];

  if (!needsLanguageSupport) {
    return {
      preferredLanguage: intake.preferredLanguage,
      label,
      cue: "Use plain-language English and confirm the household can repeat the next step."
    };
  }

  if (intake.preferredLanguage === "local_language") {
    return {
      preferredLanguage: intake.preferredLanguage,
      label,
      cue:
        "Assign a language-matched worker or interpreter before clinical follow-up; do not rely on untranslated written instructions."
    };
  }

  return {
    preferredLanguage: intake.preferredLanguage,
    label,
    cue: `Prepare ${label} handoff wording and confirm understanding with a teach-back before the referral is closed.`
  };
}

function ageGroupSignal(intake: CareIntake): DecisionSignal | null {
  const labels: Partial<Record<CareIntake["ageGroup"], string>> = {
    child_under_5: "Child under five",
    pregnant_or_postpartum: "Pregnant or postpartum",
    older_adult: "Older adult"
  };
  const label = labels[intake.ageGroup];
  if (!label) return null;

  return {
    id: "age-vulnerability",
    label: "Higher-priority age group",
    detail: `${label} intake receives extra navigation attention before routine scheduling.`,
    kind: "risk"
  };
}

function buildDecisionSignals(intake: CareIntake): DecisionSignal[] {
  const signals: DecisionSignal[] = [];
  const hasCareFactors =
    intake.warningSigns.length > 0 || intake.concerns.length > 0 || intake.barriers.length > 0;

  if (intake.warningSigns.length > 0) {
    signals.push({
      id: "warning-signs",
      label: "Warning signs",
      detail: `${intake.warningSigns.map((sign) => warningCopy[sign]).join(", ")} trigger urgent human escalation.`,
      kind: "safety"
    });
  }

  const ageSignal = ageGroupSignal(intake);
  if (ageSignal) signals.push(ageSignal);

  if (intake.concerns.length > 0) {
    signals.push({
      id: "concern-mix",
      label: "Care concerns",
      detail: `${intake.concerns.map((concern) => concernCopy[concern]).join(", ")} shape the action list.`,
      kind: "risk"
    });
  }

  if (intake.barriers.length > 0) {
    signals.push({
      id: "access-barriers",
      label: "Access barriers",
      detail: `${intake.barriers.map((barrier) => barrierCopy[barrier]).join(", ")} must be solved for the handoff to work.`,
      kind: "access"
    });
  }

  if (intake.distanceKm > 8) {
    signals.push({
      id: "distance-friction",
      label: "Distance friction",
      detail: `${intake.distanceKm} km from care increases the need for transport or offline coordination.`,
      kind: "access"
    });
  }

  if (!intake.hasPhoneAccess || intake.barriers.includes("low_connectivity")) {
    signals.push({
      id: "offline-continuity",
      label: "Offline continuity",
      detail: "No reliable phone or connectivity means follow-up cannot depend on app-only instructions.",
      kind: "workflow"
    });
  }

  if (intake.preferredLanguage === "local_language" || intake.barriers.includes("language_support")) {
    signals.push({
      id: "language-safe",
      label: "Language-safe handoff",
      detail: "The plan needs translation or a language-matched worker before clinical follow-up.",
      kind: "workflow"
    });
  }

  if (!hasCareFactors) {
    signals.push({
      id: "routine-low-risk",
      label: "Routine outreach",
      detail: "No warning signs, concerns, or access barriers were selected, so the plan keeps a light follow-up path.",
      kind: "workflow"
    });
  }

  if (!intake.consentToStore) {
    signals.push({
      id: "local-storage-consent",
      label: "Privacy guardrail",
      detail: "Local persistence is disabled unless explicit storage consent is on.",
      kind: "workflow"
    });
  }

  return signals.slice(0, 6);
}

export function createNavigationPlan(
  intake: CareIntake,
  resources: CareResource[] = COMMUNITY_RESOURCES,
): NavigationPlan {
  const riskScore = calculateRiskScore(intake);
  const equityScore = calculateAccessFriction(intake);
  const priority = priorityFromScore(riskScore);
  const emergency = emergencyAction(intake);
  const plannedActions = [
    ...(emergency ? [emergency] : []),
    ...buildConcernActions(intake),
    ...buildBarrierActions(intake)
  ];
  const actions = plannedActions.length > 0 ? plannedActions : [routineCheckInAction()];

  const sdgTargets = unique([
    ...intake.concerns.flatMap((concern) => concernTargets[concern]),
    ...intake.barriers.flatMap((barrier) => barrierTargets[barrier]),
    ...actions.flatMap((action) => action.sdgTargets)
  ]);

  const matchedResources = matchResources(actions, resources);
  const actionWord = priority === "emergency" ? "Immediate escalation" : "Navigation plan";
  const languageHandoff = buildLanguageHandoff(intake);

  return {
    priority,
    riskScore,
    equityScore,
    headline: `${actionWord} for ${intake.householdCode}`,
    safetyNotice:
      "CareBridge is a non-diagnostic navigator. It supports referral, barrier removal, and human follow-up decisions.",
    followUpHours: followUpHours(priority),
    languageHandoff,
    actions,
    decisionSignals: buildDecisionSignals(intake),
    matchedResources,
    sdgTargets,
    handoffScript: buildHandoffScript(intake, priority, actions, matchedResources, languageHandoff)
  };
}

export function buildHandoffScript(
  intake: CareIntake,
  priority: TriagePriority,
  actions: CareAction[],
  resources: CareResource[],
  languageHandoff = buildLanguageHandoff(intake)
): string {
  const resourceNames = resources.length > 0 ? resources.map((resource) => resource.name).join("; ") : "local supervisor review";
  return [
    `Household ${intake.householdCode}: ${priority.replaceAll("_", " ")} priority.`,
    `Main actions: ${actions.slice(0, 3).map((action) => action.title).join("; ")}.`,
    `Suggested resources: ${resourceNames}.`,
    `Language handoff: ${languageHandoff.cue}`,
    "This is a navigation handoff, not a diagnosis."
  ].join(" ");
}
