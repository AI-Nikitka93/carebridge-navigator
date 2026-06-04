import { Activity, BarChart3, Download, ListChecks, UsersRound } from "lucide-react";
import { buildOutreachCsv, downloadTextFile } from "../domain/exporters";
import type { CommunitySnapshot } from "../domain/impactAnalytics";
import { SDG_TARGETS, describeTarget } from "../domain/sdgTargets";
import { PriorityBadge } from "./PriorityBadge";

export function CommunityDashboard({ snapshot }: { snapshot: CommunitySnapshot }) {
  const maxBarrier = Math.max(...Object.values(snapshot.barrierCounts), 1);
  const exportCsv = () => {
    downloadTextFile("carebridge-outreach-queue.csv", buildOutreachCsv(snapshot), "text/csv;charset=utf-8");
  };

  return (
    <section className="panel dashboard-panel" aria-labelledby="dashboard-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Supervisor view</p>
          <h2 id="dashboard-title">Access gaps across outreach queue</h2>
        </div>
        <div className="dashboard-actions">
          <button type="button" className="text-button" onClick={exportCsv}>
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
          <UsersRound size={24} aria-hidden="true" />
        </div>
      </div>

      <div className="snapshot-grid">
        {snapshot.metrics.map((metric) => (
          <article key={metric.label} className="snapshot-metric">
            <Activity size={18} aria-hidden="true" />
            <span>{metric.label}</span>
            <strong>
              {metric.value}
              {metric.unit}
            </strong>
            <p>{metric.explanation}</p>
          </article>
        ))}
      </div>

      <div className="priority-queue">
        <div className="ledger-title">
          <ListChecks size={18} aria-hidden="true" />
          <h3>Priority outreach queue</h3>
        </div>
        <div className="queue-list">
          {snapshot.queue.map((item) => (
            <article className="queue-row" key={item.householdCode}>
              <div className="queue-heading">
                <strong>{item.householdCode}</strong>
                <PriorityBadge priority={item.priority} />
              </div>
              <dl className="queue-meta">
                <div>
                  <dt>Follow-up</dt>
                  <dd>{item.followUpHours}h</dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd>{item.riskScore}/100</dd>
                </div>
                <div>
                  <dt>Access</dt>
                  <dd>{item.equityScore}/100</dd>
                </div>
              </dl>
              <p>
                <strong>Top action:</strong> {item.topAction}
              </p>
              <p>
                <strong>Top resource:</strong> {item.topResource}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="supervisor-focus">
        <div className="ledger-title">
          <BarChart3 size={18} aria-hidden="true" />
          <h3>Supervisor focus</h3>
        </div>
        <p>
          <strong>{snapshot.supervisorFocus.label}</strong> affects{" "}
          {snapshot.supervisorFocus.affectedHouseholds} household
          {snapshot.supervisorFocus.affectedHouseholds === 1 ? "" : "s"}.
        </p>
        <p>{snapshot.supervisorFocus.recommendation}</p>
      </div>

      <div className="resource-gap-summary">
        <div className="ledger-title">
          <ListChecks size={18} aria-hidden="true" />
          <h3>Resource coverage gaps</h3>
        </div>
        {snapshot.resourceGaps.length > 0 ? (
          snapshot.resourceGaps.map((gap) => (
            <p key={gap.tag}>
              <strong>{gap.tag.replaceAll("-", " ")}</strong> missing for {gap.affectedHouseholds} household
              {gap.affectedHouseholds === 1 ? "" : "s"}: {gap.exampleHouseholds.join(", ")}
            </p>
          ))
        ) : (
          <p>All current action tags have at least one local service point in the directory.</p>
        )}
      </div>

      <div className="sdg-coverage-matrix">
        <div className="ledger-title">
          <BarChart3 size={18} aria-hidden="true" />
          <h3>SDG target coverage</h3>
        </div>
        {Object.keys(SDG_TARGETS).map((target) => (
          <div className="target-row" key={target}>
            <strong>{target}</strong>
            <span>{describeTarget(target as keyof typeof SDG_TARGETS)}</span>
            <em>
              {snapshot.targetCounts[target as keyof typeof SDG_TARGETS]} household
              {snapshot.targetCounts[target as keyof typeof SDG_TARGETS] === 1 ? "" : "s"}
            </em>
          </div>
        ))}
      </div>

      <div className="barrier-chart">
        <div className="ledger-title">
          <BarChart3 size={18} aria-hidden="true" />
          <h3>Barrier pressure</h3>
        </div>
        {Object.entries(snapshot.barrierCounts).map(([barrier, count]) => (
          <div className="bar-row" key={barrier}>
            <span>{barrier.replaceAll("_", " ")}</span>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${(count / maxBarrier) * 100}%` }} />
            </div>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
