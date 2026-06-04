import { ListChecks, ShieldCheck, UsersRound } from "lucide-react";
import {
  PILOT_ROADMAP,
  SAFETY_BOUNDARIES,
  SUSTAINABILITY_MODEL,
  type ReadinessItem,
} from "../domain/pilotReadiness";

interface ReadinessGroup {
  title: string;
  eyebrow: string;
  summary: string;
  items: ReadinessItem[];
  Icon: typeof ShieldCheck;
}

const READINESS_GROUPS: ReadinessGroup[] = [
  {
    title: "Safety boundaries",
    eyebrow: "What the demo refuses to overclaim",
    summary: "Navigation only, human escalation, and no server-side patient records.",
    items: SAFETY_BOUNDARIES,
    Icon: ShieldCheck,
  },
  {
    title: "Pilot next steps",
    eyebrow: "What must happen before real deployment",
    summary: "Localization, encrypted profiles, and governed supervisor sync.",
    items: PILOT_ROADMAP,
    Icon: ListChecks,
  },
  {
    title: "Sustainability model",
    eyebrow: "How it can grow without charging patients",
    summary: "Free open-source core with paid support for organizations.",
    items: SUSTAINABILITY_MODEL,
    Icon: UsersRound,
  },
];

export function PilotReadinessPanel() {
  return (
    <section className="panel readiness-panel" aria-labelledby="readiness-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Pilot readiness</p>
          <h2 id="readiness-title">Safe path from hackathon demo to governed field pilot</h2>
        </div>
      </div>

      <div className="readiness-grid">
        {READINESS_GROUPS.map(({ Icon, eyebrow, items, summary, title }) => (
          <article className="readiness-column" key={title}>
            <div className="readiness-column-header">
              <Icon size={20} aria-hidden="true" />
              <div>
                <p className="eyebrow">{eyebrow}</p>
                <h3>{title}</h3>
              </div>
            </div>
            <p>{summary}</p>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
