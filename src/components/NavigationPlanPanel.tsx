import { Clipboard, FileText, HeartPulse, Languages, ListChecks, Route, ShieldAlert } from "lucide-react";
import type { NavigationPlan } from "../domain/careTypes";
import { buildFieldCard, downloadTextFile, fieldCardFilename } from "../domain/exporters";
import { describeTarget } from "../domain/sdgTargets";
import { PriorityBadge } from "./PriorityBadge";

export function NavigationPlanPanel({ plan }: { plan: NavigationPlan }) {
  const copyHandoff = async () => {
    await navigator.clipboard.writeText(plan.handoffScript);
  };

  const downloadFieldCard = () => {
    downloadTextFile(fieldCardFilename(plan), buildFieldCard(plan), "text/plain;charset=utf-8");
  };

  return (
    <section className="panel plan-panel" aria-labelledby="plan-title" aria-live="polite">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Generated plan</p>
          <h2 id="plan-title">{plan.headline}</h2>
        </div>
        <PriorityBadge priority={plan.priority} />
      </div>

      <div className="score-grid">
        <Metric label="Risk score" value={plan.riskScore} suffix="/100" />
        <Metric label="Access friction" value={plan.equityScore} suffix="/100" />
        <Metric label="Follow-up window" value={plan.followUpHours} suffix="h" />
      </div>

      <div className="safety-strip">
        <ShieldAlert size={20} aria-hidden="true" />
        <p>{plan.safetyNotice}</p>
      </div>

      <div className="language-strip">
        <Languages size={20} aria-hidden="true" />
        <p>
          <strong>Language handoff: {plan.languageHandoff.label}.</strong> {plan.languageHandoff.cue}
        </p>
      </div>

      <div className="decision-evidence">
        <div className="ledger-title">
          <ListChecks size={18} aria-hidden="true" />
          <h3>Decision evidence</h3>
        </div>
        {plan.decisionSignals.map((signal) => (
          <article key={signal.id} className={`decision-signal decision-${signal.kind}`}>
            <strong>{signal.label}</strong>
            <p>{signal.detail}</p>
          </article>
        ))}
      </div>

      <div className="action-list">
        {plan.actions.map((action) => (
          <article key={action.id} className="action-item">
            <div className="action-icon">
              {action.urgency === "emergency" ? <ShieldAlert size={18} /> : <Route size={18} />}
            </div>
            <div>
              <div className="action-title-row">
                <h3>{action.title}</h3>
                <PriorityBadge priority={action.urgency} />
              </div>
              <p>{action.rationale}</p>
              <span className="owner">Owner: {action.owner.replace("_", " ")}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="handoff">
        <div>
          <p className="eyebrow">Copy-ready handoff</p>
          <p>{plan.handoffScript}</p>
        </div>
        <div className="handoff-actions">
          <button type="button" className="icon-button" onClick={copyHandoff} aria-label="Copy handoff">
            <Clipboard size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={downloadFieldCard}
            aria-label="Download field card"
          >
            <FileText size={18} />
          </button>
        </div>
      </div>

      <div className="sdg-ledger">
        <div className="ledger-title">
          <HeartPulse size={18} aria-hidden="true" />
          <h3>SDG 3 evidence ledger</h3>
        </div>
        {plan.sdgTargets.map((target) => (
          <p key={target}>{describeTarget(target)}</p>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
    </div>
  );
}
