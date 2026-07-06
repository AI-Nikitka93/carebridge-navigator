import { useEffect, useMemo, useState, useCallback } from "react";
import { DEFAULT_SCENARIO, DEMO_SCENARIOS } from "../domain/demoScenarios";
import type { DemoScenarioKey } from "../domain/demoScenarios";
import type { CareIntake, CareResource } from "../domain/careTypes";
import { buildCommunitySnapshot } from "../domain/impactAnalytics";
import { canLoadPersistedIntake, shouldPersistIntake } from "../domain/privacyPolicy";
import { COMMUNITY_RESOURCES, canLoadPersistedResources } from "../domain/resourceDirectory";
import { createNavigationPlan } from "../domain/triageEngine";
import { useRxCollection } from "rxdb-hooks";

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
  const [activeIntake, setActiveIntake] = useState<CareIntake>(DEFAULT_SCENARIO);
  const [resourceDirectory, setResourceDirectory] = useState<CareResource[]>(COMMUNITY_RESOURCES);

  const intakeCollection = useRxCollection("intakes");
  const resourceCollection = useRxCollection("resources");

  useEffect(() => {
    if (!intakeCollection) return;
    const sub = intakeCollection.findOne("active").$.subscribe((doc: any) => {
      if (doc) {
        const intake = doc.toJSON() as CareIntake;
        if (canLoadPersistedIntake(intake)) {
          setActiveIntake(intake);
        }
      }
    });
    return () => sub.unsubscribe();
  }, [intakeCollection]);

  useEffect(() => {
    if (!resourceCollection) return;
    const sub = resourceCollection.find().$.subscribe((docs: any[]) => {
      if (docs && docs.length > 0) {
        const res = docs.map(d => d.toJSON() as CareResource);
        if (canLoadPersistedResources(res)) {
          setResourceDirectory(res);
        }
      }
    });
    return () => sub.unsubscribe();
  }, [resourceCollection]);

  const scenarioSelection = useMemo(() => scenarioKeyForIntake(activeIntake), [activeIntake]);

  const activePlan = useMemo(
    () => createNavigationPlan(activeIntake, resourceDirectory),
    [activeIntake, resourceDirectory],
  );
  const communitySnapshot = useMemo(
    () => buildCommunitySnapshot(Object.values(DEMO_SCENARIOS), resourceDirectory),
    [resourceDirectory],
  );

  const updateIntake = useCallback(async (nextIntake: CareIntake) => {
    setActiveIntake(nextIntake); // optimistic
    if (intakeCollection) {
      if (shouldPersistIntake(nextIntake)) {
        await intakeCollection.upsert({ id: "active", ...nextIntake });
      } else {
        const doc = await intakeCollection.findOne("active").exec();
        if (doc) await doc.remove(); // provides removeJson behavior
      }
    }
  }, [intakeCollection]);

  const addResource = useCallback(async (resource: CareResource) => {
    setResourceDirectory(curr => [...curr, resource]);
    if (resourceCollection) {
      await resourceCollection.upsert(resource);
    }
  }, [resourceCollection]);

  const importResources = useCallback(async (resources: CareResource[]) => {
    setResourceDirectory(resources);
    if (resourceCollection) {
      await Promise.all(resources.map(r => resourceCollection.upsert(r)));
    }
  }, [resourceCollection]);

  const loadScenario = useCallback(async (scenarioKey: DemoScenarioKey) => {
    const scenario = DEMO_SCENARIOS[scenarioKey];
    await updateIntake(scenario);
  }, [updateIntake]);

  const resetResources = useCallback(async () => {
    setResourceDirectory(COMMUNITY_RESOURCES);
    if (resourceCollection) {
      const allDocs = await resourceCollection.find().exec();
      if (allDocs.length > 0) {
         await resourceCollection.bulkRemove(allDocs.map((d: any) => d.id));
      }
      await Promise.all(COMMUNITY_RESOURCES.map(r => resourceCollection.upsert(r)));
    }
  }, [resourceCollection]);

  return {
    activeIntake,
    activePlan,
    communitySnapshot,
    resourceDirectory,
    scenarioSelection,
    addResource,
    importResources,
    loadScenario,
    resetResources,
    updateIntake
  };
}
