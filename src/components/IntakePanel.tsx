import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { ShieldAlert } from "lucide-react";
import type { AccessBarrier, CareIntake, HealthConcern, WarningSign } from "../domain/careTypes";
import { DEMO_SCENARIO_OPTIONS, DEMO_SCENARIO_STORIES } from "../domain/demoScenarios";
import type { DemoScenarioKey } from "../domain/demoScenarios";
import type { ScenarioSelection } from "../hooks/useNavigatorState";
import { SwipeTriagePanel } from "./SwipeTriagePanel";

const concernOptions: Array<{ value: HealthConcern; label: string }> = [
  { value: "maternal_follow_up", label: "Maternal follow-up" },
  { value: "newborn_child_health", label: "Newborn or child health" },
  { value: "immunization_gap", label: "Immunization gap" },
  { value: "mental_distress", label: "Mental distress" },
  { value: "chronic_care_gap", label: "Chronic care gap" },
  { value: "communicable_symptoms", label: "Communicable symptoms" },
  { value: "nutrition_risk", label: "Nutrition risk" },
  { value: "medication_access", label: "Medication access" }
];

const barrierOptions: Array<{ value: AccessBarrier; label: string }> = [
  { value: "no_transport", label: "No transport" },
  { value: "cost_pressure", label: "Cost pressure" },
  { value: "low_connectivity", label: "Low connectivity" },
  { value: "language_support", label: "Language support" },
  { value: "caregiver_gap", label: "Caregiver gap" },
  { value: "disability_access", label: "Disability access" },
  { value: "stigma_or_safety", label: "Stigma or safety" }
];

const warningOptions: Array<{ value: WarningSign; label: string }> = [
  { value: "self_harm_risk", label: "Self-harm risk" },
  { value: "pregnancy_bleeding", label: "Pregnancy bleeding" },
  { value: "infant_fever", label: "Infant fever" },
  { value: "severe_dehydration", label: "Severe dehydration" },
  { value: "chest_pain", label: "Chest pain" },
  { value: "breathing_difficulty", label: "Breathing difficulty" }
];

interface IntakePanelProps {
  intake: CareIntake;
  scenarioSelection: ScenarioSelection;
  onChange: (next: CareIntake) => void;
  onLoadScenario: (scenarioKey: DemoScenarioKey) => void;
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function IntakePanel({ intake, scenarioSelection, onChange, onLoadScenario }: IntakePanelProps) {
  const [isHybridMode, setIsHybridMode] = useState(false);
  const [showSwipePanel, setShowSwipePanel] = useState(false);
  const [verifiedSigns, setVerifiedSigns] = useState<WarningSign[]>([]);

  const update = <K extends keyof CareIntake>(key: K, value: CareIntake[K]) =>
    onChange({ ...intake, [key]: value });

  const updateScenario = (event: ChangeEvent<HTMLSelectElement>) => {
    const scenarioKey = event.target.value;
    if (scenarioKey !== "custom") {
      onLoadScenario(scenarioKey as DemoScenarioKey);
    }
  };

  const updateDistance = (event: ChangeEvent<HTMLInputElement>) =>
    update("distanceKm", Number(event.target.value));
  
  // Sync verified signs when warning signs are removed in form or scenario changes
  useEffect(() => {
    setVerifiedSigns((prev) => prev.filter((s) => intake.warningSigns.includes(s)));
  }, [intake.warningSigns]);

  // Automatically trigger Swipe Panel when NEW warning signs are added
  const lastWarningLength = useRef(intake.warningSigns.length);
  useEffect(() => {
    const unverified = intake.warningSigns.filter((s) => !verifiedSigns.includes(s));
    if (unverified.length > 0 && intake.warningSigns.length > lastWarningLength.current) {
      setShowSwipePanel(true);
    }
    lastWarningLength.current = intake.warningSigns.length;
  }, [intake.warningSigns, verifiedSigns]);

  const scenarioStory = scenarioSelection === "custom" ? null : DEMO_SCENARIO_STORIES[scenarioSelection];
  const pendingWarnings = intake.warningSigns.filter((s) => !verifiedSigns.includes(s));

  if (showSwipePanel) {
    return (
      <SwipeTriagePanel
        warningSigns={pendingWarnings}
        onConfirm={(sign) => {
          if (!verifiedSigns.includes(sign)) {
            setVerifiedSigns((prev) => [...prev, sign]);
          }
        }}
        onDismiss={(sign) => {
          setVerifiedSigns((prev) => prev.filter((s) => s !== sign));
          onChange({
            ...intake,
            warningSigns: intake.warningSigns.filter((s) => s !== sign)
          });
        }}
        onClose={() => {
          setShowSwipePanel(false);
          setIsHybridMode(false);
        }}
        isHybridMode={isHybridMode}
      />
    );
  }

  return (
    <section className="panel intake-panel" aria-labelledby="intake-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Community visit intake</p>
          <h2 id="intake-title">Build the care-navigation case</h2>
        </div>
        <select
          className="select"
          aria-label="Load demo scenario"
          value={scenarioSelection}
          onChange={updateScenario}
        >
          <option value="custom" disabled>
            Custom intake
          </option>
          {DEMO_SCENARIO_OPTIONS.map((scenario) => (
            <option key={scenario.value} value={scenario.value}>
              {scenario.label}
            </option>
          ))}
        </select>
      </div>
      <div className="scenario-cue">
        {scenarioStory ? (
          <>
            <strong>Selected demo focus:</strong> {scenarioStory.judgeCue} {scenarioStory.sdgProof}
          </>
        ) : (
          <>
            <strong>Custom intake:</strong> Manual field edits are active; the generated plan updates from
            the household data currently on screen.
          </>
        )}
      </div>

      <label className="field">
        <span>Household code</span>
        <input
          value={intake.householdCode}
          onChange={(event) => update("householdCode", event.target.value)}
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span>Age group</span>
          <select
            value={intake.ageGroup}
            onChange={(event) => update("ageGroup", event.target.value as CareIntake["ageGroup"])}
          >
            <option value="child_under_5">Child under 5</option>
            <option value="pregnant_or_postpartum">Pregnant or postpartum</option>
            <option value="adolescent">Adolescent</option>
            <option value="adult">Adult</option>
            <option value="older_adult">Older adult</option>
          </select>
        </label>

        <label className="field">
          <span>Preferred language</span>
          <select
            value={intake.preferredLanguage}
            onChange={(event) =>
              update("preferredLanguage", event.target.value as CareIntake["preferredLanguage"])
            }
          >
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="french">French</option>
            <option value="local_language">Local language</option>
          </select>
        </label>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Distance to clinic: {intake.distanceKm} km</span>
          <input min="0" max="25" step="1" type="range" value={intake.distanceKm} onChange={updateDistance} />
        </label>
      </div>

      <Checklist
        title="Health concerns"
        values={intake.concerns}
        options={concernOptions}
        onToggle={(value) => update("concerns", toggleValue(intake.concerns, value))}
      />
      <Checklist
        title="Access barriers"
        values={intake.barriers}
        options={barrierOptions}
        onToggle={(value) => update("barriers", toggleValue(intake.barriers, value))}
      />
      <Checklist
        title="Warning signs"
        values={intake.warningSigns}
        options={warningOptions}
        onToggle={(value) => update("warningSigns", toggleValue(intake.warningSigns, value))}
      />

      {pendingWarnings.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <button
            type="button"
            className="text-button"
            style={{
              width: "100%",
              borderColor: "rgba(225, 29, 72, 0.3)",
              color: "var(--red)",
              background: "var(--red-soft)",
              justifyContent: "center"
            }}
            onClick={() => setShowSwipePanel(true)}
          >
            <ShieldAlert size={16} /> Verify Warning Signs ({pendingWarnings.length} pending)
          </button>
        </div>
      )}

      <div className="switch-row">
        <label>
          <input
            type="checkbox"
            checked={intake.hasPhoneAccess}
            onChange={(event) => update("hasPhoneAccess", event.target.checked)}
          />
          Phone access
        </label>
        <label>
          <input
            type="checkbox"
            checked={intake.consentToStore}
            onChange={(event) => update("consentToStore", event.target.checked)}
          />
          Consent to store locally
        </label>
      </div>

      <div className="switch-row" style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
        <label style={{ color: "var(--red)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={isHybridMode}
            onChange={(event) => {
              setIsHybridMode(event.target.checked);
              if (event.target.checked) {
                setShowSwipePanel(true);
              }
            }}
          />
          Experimental: Hybrid CFT Mode
        </label>
      </div>
    </section>
  );
}

function Checklist<T extends string>({
  title,
  values,
  options,
  onToggle
}: {
  title: string;
  values: T[];
  options: Array<{ value: T; label: string }>;
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset className="checklist">
      <legend>{title}</legend>
      <div className="chips">
        {options.map((option) => (
          <label key={option.value} className={values.includes(option.value) ? "chip chip-active" : "chip"}>
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
