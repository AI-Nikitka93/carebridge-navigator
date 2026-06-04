import type { TriagePriority } from "../domain/careTypes";

const labels: Record<TriagePriority, string> = {
  emergency: "Emergency",
  same_day: "Same day",
  within_72_hours: "Within 72h",
  routine: "Routine"
};

export function PriorityBadge({ priority }: { priority: TriagePriority }) {
  return <span className={`priority priority-${priority}`}>{labels[priority]}</span>;
}
