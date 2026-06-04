import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SCENARIO, DEMO_SCENARIOS } from "../domain/demoScenarios";
import type { DemoScenarioKey } from "../domain/demoScenarios";
import type { CareIntake, CareResource } from "../domain/careTypes";
import { buildCommunitySnapshot } from "../domain/impactAnalytics";
import { canLoadPersistedIntake, shouldPersistIntake } from "../domain/privacyPolicy";
import { COMMUNITY_RESOURCES, canLoadPersistedResources } from "../domain/resourceDirectory";
import { createNavigationPlan } from "../domain/triageEngine";
import { loadJson, removeJson, saveJson } from "../lib/storage";

const INTAKE_STORAGE_KEY = "active-intake";
const RESOURCE_STORAGE_KEY = "resource-directory";

export type ScenarioSelection = DemoScenarioKey | "custom";

function scenarioKeyForIntake(intake: CareIntake): ScenarioSelection {
  const match = Object.entries(DEMO_SCENARIOS).find(([, scenario]) => sameIntake(scenario, intake));
  return match ? (match[0] as DemoScenarioKey) : "custom";
}

function sameIntake(a: CareIntake, b: CareIntake): boolean {
  return (
    a.householdCode === b.householdCode &&
    a.ageGroup === b.ageGroup &&
    sameStringList(a.concerns, b.concerns) &&
    sameStringList(a.barriers, b.barriers) &&
    sameStringList(a.warningSigns, b.warningSigns) &&
    a.distanceKm === b.distanceKm &&
    a.hasPhoneAccess === b.hasPhoneAccess &&
    a.preferredLanguage === b.preferredLanguage &&
    a.consentToStore === b.consentToStore
  );
}

function sameStringList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

export function useNavigatorState() {
  const [activeIntake, setActiveIntake] = useState<CareIntake>(() => {
    const storedIntake = loadJson<unknown>(INTAKE_STORAGE_KEY, null);
    return canLoadPersistedIntake(storedIntake) ? storedIntake : DEFAULT_SCENARIO;
  });
  const [resourceDirectory, setResourceDirectory] = useState<CareResource[]>(() => {
    const storedResources = loadJson<unknown>(RESOURCE_STORAGE_KEY, null);
    return canLoadPersistedResources(storedResources) ? storedResources : COMMUNITY_RESOURCES;
  });
  const [scenarioSelection, setScenarioSelection] = useState<ScenarioSelection>(() =>
    scenarioKeyForIntake(activeIntake),
  );

  useEffect(() => {
    if (shouldPersistIntake(activeIntake)) {
      saveJson(INTAKE_STORAGE_KEY, activeIntake);
    } else {
      removeJson(INTAKE_STORAGE_KEY);
    }
  }, [activeIntake]);

  useEffect(() => {
    saveJson(RESOURCE_STORAGE_KEY, resourceDirectory);
  }, [resourceDirectory]);

  const activePlan = useMemo(
    () => createNavigationPlan(activeIntake, resourceDirectory),
    [activeIntake, resourceDirectory],
  );
  const communitySnapshot = useMemo(
    () => buildCommunitySnapshot(Object.values(DEMO_SCENARIOS), resourceDirectory),
    [resourceDirectory],
  );

  return {
    activeIntake,
    activePlan,
    communitySnapshot,
    resourceDirectory,
    scenarioSelection,
    addResource: (resource: CareResource) =>
      setResourceDirectory((currentResources) => [...currentResources, resource]),
    importResources: (resources: CareResource[]) => setResourceDirectory(resources),
    loadScenario: (scenarioKey: DemoScenarioKey) => {
      setScenarioSelection(scenarioKey);
      setActiveIntake(DEMO_SCENARIOS[scenarioKey]);
    },
    resetResources: () => setResourceDirectory(COMMUNITY_RESOURCES),
    updateIntake: (nextIntake: CareIntake) => {
      setScenarioSelection(scenarioKeyForIntake(nextIntake));
      setActiveIntake(nextIntake);
    }
  };
}
