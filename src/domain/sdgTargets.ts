export type SdgTargetId =
  | "3.1"
  | "3.2"
  | "3.3"
  | "3.4"
  | "3.7"
  | "3.8"
  | "3.c"
  | "3.d";

export interface SdgTarget {
  id: SdgTargetId;
  label: string;
  plainLanguageGoal: string;
}

export const SDG_TARGETS: Record<SdgTargetId, SdgTarget> = {
  "3.1": {
    id: "3.1",
    label: "Maternal mortality",
    plainLanguageGoal: "Help pregnant and postpartum people reach skilled care early."
  },
  "3.2": {
    id: "3.2",
    label: "Newborn and child health",
    plainLanguageGoal: "Prioritize children under five when warning signs or missed services appear."
  },
  "3.3": {
    id: "3.3",
    label: "Communicable diseases",
    plainLanguageGoal: "Route possible infectious disease concerns to timely testing and follow-up."
  },
  "3.4": {
    id: "3.4",
    label: "Mental health and NCDs",
    plainLanguageGoal: "Support mental well-being and continuity of chronic care."
  },
  "3.7": {
    id: "3.7",
    label: "Reproductive health",
    plainLanguageGoal: "Connect families to reproductive, maternal, and adolescent health resources."
  },
  "3.8": {
    id: "3.8",
    label: "Universal health coverage",
    plainLanguageGoal: "Reduce access barriers such as cost, transport, language, and distance."
  },
  "3.c": {
    id: "3.c",
    label: "Health workforce",
    plainLanguageGoal: "Give community health workers safer task lists and clearer handoffs."
  },
  "3.d": {
    id: "3.d",
    label: "Risk reduction and readiness",
    plainLanguageGoal: "Escalate warning signs and community risks before they become crises."
  }
};

export function describeTarget(id: SdgTargetId): string {
  const target = SDG_TARGETS[id];
  return `${target.id} ${target.label}: ${target.plainLanguageGoal}`;
}
