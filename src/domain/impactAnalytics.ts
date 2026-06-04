import type { CareIntake, CareResource, NavigationPlan } from "./careTypes";
import { COMMUNITY_RESOURCES } from "./resourceDirectory";
import type { SdgTargetId } from "./sdgTargets";
import { SDG_TARGETS } from "./sdgTargets";
import { createNavigationPlan } from "./triageEngine";

export interface CommunityMetric {
  label: string;
  value: number;
  unit: string;
  explanation: string;
}

export interface CommunityQueueItem {
  householdCode: string;
  priority: NavigationPlan["priority"];
  followUpHours: number;
  riskScore: number;
  equityScore: number;
  topAction: string;
  topResource: string;
}

export interface ResourceGap {
  tag: string;
  affectedHouseholds: number;
  exampleHouseholds: string[];
}

export interface CommunitySnapshot {
  plans: NavigationPlan[];
  queue: CommunityQueueItem[];
  resourceGaps: ResourceGap[];
  metrics: CommunityMetric[];
  barrierCounts: Record<string, number>;
  targetCounts: Record<SdgTargetId, number>;
  supervisorFocus: {
    label: string;
    affectedHouseholds: number;
    recommendation: string;
  };
}

export function buildCommunitySnapshot(
  intakes: CareIntake[],
  resources?: CareResource[],
): CommunitySnapshot {
  const plans = intakes.map((intake) => createNavigationPlan(intake, resources));
  const queue = plans.map(buildQueueItem).sort(compareQueueItems);
  const resourceGaps = buildResourceGaps(plans, resources ?? COMMUNITY_RESOURCES);
  const barrierCounts = intakes.reduce<Record<string, number>>((acc, intake) => {
    intake.barriers.forEach((barrier) => {
      acc[barrier] = (acc[barrier] ?? 0) + 1;
    });
    return acc;
  }, {});
  const targetCounts = plans.reduce<Record<SdgTargetId, number>>(
    (acc, plan) => {
      plan.sdgTargets.forEach((target) => {
        acc[target] += 1;
      });
      return acc;
    },
    Object.fromEntries(Object.keys(SDG_TARGETS).map((target) => [target, 0])) as Record<SdgTargetId, number>,
  );

  const urgentPlans = plans.filter((plan) => plan.priority === "emergency" || plan.priority === "same_day");
  const averageEquityScore =
    plans.reduce((total, plan) => total + plan.equityScore, 0) / Math.max(plans.length, 1);
  const targetCoverage = new Set(plans.flatMap((plan) => plan.sdgTargets)).size;
  const topBarrier = Object.entries(barrierCounts).sort(
    (a, b) => b[1] - a[1] || barrierPriority(a[0]) - barrierPriority(b[0]) || a[0].localeCompare(b[0])
  )[0];

  return {
    plans,
    queue,
    resourceGaps,
    barrierCounts,
    targetCounts,
    supervisorFocus: topBarrier
      ? {
          label: topBarrier[0].replaceAll("_", " "),
          affectedHouseholds: topBarrier[1],
          recommendation: recommendationForBarrier(topBarrier[0], urgentPlans.length)
        }
      : {
          label: "routine outreach",
          affectedHouseholds: plans.length,
          recommendation:
            "No repeated access barrier is dominating this queue. Keep routine follow-up active and watch for new warning signs."
        },
    metrics: [
      {
        label: "Same-day or emergency",
        value: urgentPlans.length,
        unit: "households",
        explanation: "Cases that should not wait for routine outreach."
      },
      {
        label: "Average access friction",
        value: Math.round(averageEquityScore),
        unit: "/100",
        explanation: "Higher means transport, cost, language, distance, or connectivity barriers need supervisor action."
      },
      {
        label: "SDG 3 targets touched",
        value: targetCoverage,
        unit: "targets",
        explanation: "How many SDG 3 target areas are represented in the current outreach queue."
      }
    ]
  };
}

function buildResourceGaps(plans: NavigationPlan[], resources: CareResource[]): ResourceGap[] {
  const availableTags = new Set(resources.flatMap((resource) => resource.tags));
  const missingByTag = new Map<string, Set<string>>();

  for (const plan of plans) {
    const householdCode = extractHouseholdCode(plan);
    const missingTags = new Set(
      plan.actions.flatMap((action) => action.resourceTags).filter((tag) => !availableTags.has(tag)),
    );

    for (const tag of missingTags) {
      const households = missingByTag.get(tag) ?? new Set<string>();
      households.add(householdCode);
      missingByTag.set(tag, households);
    }
  }

  return [...missingByTag.entries()]
    .map(([tag, households]) => ({
      tag,
      affectedHouseholds: households.size,
      exampleHouseholds: [...households].slice(0, 3),
    }))
    .sort(
      (a, b) =>
        b.affectedHouseholds - a.affectedHouseholds ||
        resourceTagPriority(a.tag) - resourceTagPriority(b.tag) ||
        a.tag.localeCompare(b.tag),
    )
    .slice(0, 6);
}

function buildQueueItem(plan: NavigationPlan): CommunityQueueItem {
  const topAction = plan.actions[0];
  const topResource = topAction
    ? plan.matchedResources.find((resource) =>
        resource.tags.some((tag) => topAction.resourceTags.includes(tag)),
      ) ?? plan.matchedResources[0]
    : plan.matchedResources[0];

  return {
    householdCode: extractHouseholdCode(plan),
    priority: plan.priority,
    followUpHours: plan.followUpHours,
    riskScore: plan.riskScore,
    equityScore: plan.equityScore,
    topAction: topAction?.title ?? "Supervisor review",
    topResource: topResource?.name ?? "Supervisor review"
  };
}

function extractHouseholdCode(plan: NavigationPlan): string {
  return plan.headline.replace(
    /^Navigation plan for |^Immediate escalation for /,
    "",
  );
}

function compareQueueItems(a: CommunityQueueItem, b: CommunityQueueItem): number {
  return (
    priorityRank(a.priority) - priorityRank(b.priority) ||
    a.followUpHours - b.followUpHours ||
    b.riskScore - a.riskScore ||
    b.equityScore - a.equityScore ||
    a.householdCode.localeCompare(b.householdCode)
  );
}

function priorityRank(priority: NavigationPlan["priority"]): number {
  const rank: Record<NavigationPlan["priority"], number> = {
    emergency: 1,
    same_day: 2,
    within_72_hours: 3,
    routine: 4
  };

  return rank[priority];
}

function barrierPriority(barrier: string): number {
  const priority: Record<string, number> = {
    low_connectivity: 1,
    language_support: 2,
    no_transport: 3,
    cost_pressure: 4,
    stigma_or_safety: 5,
    disability_access: 6,
    caregiver_gap: 7
  };

  return priority[barrier] ?? 99;
}

function resourceTagPriority(tag: string): number {
  const priority: Record<string, number> = {
    emergency: 1,
    "danger-signs": 2,
    communicable: 3,
    testing: 4,
    maternal: 5,
    newborn: 6,
    "mental-health": 7,
    transport: 8,
    translation: 9,
    "low-connectivity": 10,
    medication: 11,
    cost: 12
  };

  return priority[tag] ?? 99;
}

function recommendationForBarrier(barrier: string, urgentCount: number): string {
  const urgencyPrefix =
    urgentCount > 0
      ? `${urgentCount} urgent household${urgentCount === 1 ? "" : "s"} should be protected from delay. `
      : "";

  const recommendations: Record<string, string> = {
    no_transport: "Coordinate transport slots before sending referrals so distance does not cancel the care plan.",
    cost_pressure: "Route households through the lowest-cost eligible clinic or medication support path first.",
    low_connectivity: "Use paper, SMS, kiosk, or supervisor callback workflows instead of app-only follow-up.",
    language_support: "Assign translation or a language-matched worker before the clinical handoff.",
    caregiver_gap: "Confirm a reachable caregiver or clinic-side escort before the visit window.",
    disability_access: "Match the household to an accessible service point and avoid routes that require repeated travel.",
    stigma_or_safety: "Use private contact windows and non-exposing follow-up channels."
  };

  return `${urgencyPrefix}${recommendations[barrier] ?? "Review this barrier cluster with the outreach supervisor."}`;
}
