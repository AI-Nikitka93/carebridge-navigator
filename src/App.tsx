import { Github, HeartPulse, ShieldCheck } from "lucide-react";
import { CommunityDashboard } from "./components/CommunityDashboard";
import { IntakePanel } from "./components/IntakePanel";
import { NavigationPlanPanel } from "./components/NavigationPlanPanel";
import { PilotReadinessPanel } from "./components/PilotReadinessPanel";
import { ResourcePanel } from "./components/ResourcePanel";
import { RouteMap } from "./components/RouteMap";
import { useNavigatorState } from "./hooks/useNavigatorState";

export function App() {
  const {
    activeIntake,
    activePlan,
    addResource,
    communitySnapshot,
    importResources,
    loadScenario,
    resetResources,
    resourceDirectory,
    scenarioSelection,
    updateIntake,
  } = useNavigatorState();

  return (
    <main className="app-shell">
      <a className="skip-link" href="#care-workspace">
        Skip to care workspace
      </a>
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <HeartPulse size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">SDG 3 · offline-first navigator</p>
            <h1>CareBridge Navigator</h1>
          </div>
        </div>
        <div className="topbar-proof">
          <span>
            <ShieldCheck size={16} aria-hidden="true" />
            Non-diagnostic
          </span>
          <span>
            <Github size={16} aria-hidden="true" />
            Local-first records
          </span>
        </div>
      </header>

      <section className="mission-band">
        <div>
          <p className="eyebrow">Community health worker workflow</p>
          <h2>Turn health access barriers into safe, explainable care-navigation plans.</h2>
        </div>
        <p>
          The app helps a community health worker identify urgency, remove access blockers, match
          local resources, and show exactly which SDG 3 targets each action supports.
        </p>
      </section>

      <RouteMap plan={activePlan} />

      <div id="care-workspace" className="workspace-grid">
        <IntakePanel
          intake={activeIntake}
          scenarioSelection={scenarioSelection}
          onChange={updateIntake}
          onLoadScenario={loadScenario}
        />
        <NavigationPlanPanel plan={activePlan} />
      </div>

      <div className="support-grid">
        <ResourcePanel
          resources={activePlan.matchedResources}
          directory={resourceDirectory}
          onAddResource={addResource}
          onImportResources={importResources}
          onResetResources={resetResources}
        />
        <CommunityDashboard snapshot={communitySnapshot} />
      </div>

      <PilotReadinessPanel />
    </main>
  );
}
