import { Ambulance, ClipboardCheck, HeartHandshake, Home, RadioTower } from "lucide-react";
import type { NavigationPlan } from "../domain/careTypes";

export function RouteMap({ plan }: { plan: NavigationPlan }) {
  const steps = [
    { label: "Household", icon: Home, active: true },
    { label: "Screen", icon: ClipboardCheck, active: plan.actions.length > 0 },
    { label: "Barrier fix", icon: HeartHandshake, active: plan.equityScore > 35 },
    { label: "Resource", icon: RadioTower, active: plan.matchedResources.length > 0 },
    { label: "Escalate", icon: Ambulance, active: plan.priority === "emergency" || plan.priority === "same_day" }
  ];

  return (
    <section className="route-map" aria-label="Care route map">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div className={step.active ? "route-step route-step-active" : "route-step"} key={step.label}>
            <span className="route-index">{index + 1}</span>
            <Icon size={20} aria-hidden="true" />
            <strong>{step.label}</strong>
          </div>
        );
      })}
    </section>
  );
}
