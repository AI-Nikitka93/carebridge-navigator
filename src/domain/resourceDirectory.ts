import type { CareResource } from "./careTypes";

export const RESOURCE_CATEGORIES: CareResource["category"][] = [
  "emergency",
  "clinic",
  "mental_health",
  "maternal_child",
  "community",
  "logistics",
];

export const RESOURCE_CHANNELS: CareResource["channel"][] = [
  "walk_in",
  "phone",
  "sms",
  "offline_referral",
];

export interface ResourceDirectoryExport {
  schema: "carebridge-resource-directory/v1";
  exportedAt: string;
  resources: CareResource[];
}

export const COMMUNITY_RESOURCES: CareResource[] = [
  {
    id: "urgent-response",
    name: "Emergency response desk",
    category: "emergency",
    tags: ["emergency", "danger-signs", "transport"],
    distanceKm: 3.2,
    availability: "24/7 escalation",
    channel: "phone"
  },
  {
    id: "maternal-child-hub",
    name: "Maternal and child health hub",
    category: "maternal_child",
    tags: ["maternal", "newborn", "immunization", "nutrition"],
    distanceKm: 5.4,
    availability: "Mon-Sat, 08:00-16:00",
    channel: "walk_in"
  },
  {
    id: "mental-wellbeing-line",
    name: "Mental well-being support line",
    category: "mental_health",
    tags: ["mental-health", "safety", "same-day-phone"],
    distanceKm: 0,
    availability: "Daily, 07:00-22:00",
    channel: "phone"
  },
  {
    id: "community-transport-pool",
    name: "Community transport pool",
    category: "logistics",
    tags: ["transport", "cost", "access"],
    distanceKm: 1.1,
    availability: "Request before 18:00",
    channel: "sms"
  },
  {
    id: "low-bandwidth-kiosk",
    name: "Low-bandwidth care kiosk",
    category: "community",
    tags: ["low-connectivity", "translation", "forms", "follow-up"],
    distanceKm: 2.8,
    availability: "Offline sync twice daily",
    channel: "offline_referral"
  },
  {
    id: "chronic-care-refill",
    name: "Chronic care refill desk",
    category: "clinic",
    tags: ["chronic-care", "medication", "cost", "follow-up"],
    distanceKm: 6.6,
    availability: "Tue, Thu, Sat",
    channel: "walk_in"
  },
  {
    id: "testing-and-prevention",
    name: "Testing and prevention outreach",
    category: "clinic",
    tags: ["communicable", "testing", "prevention"],
    distanceKm: 4.3,
    availability: "Mobile team schedule varies",
    channel: "sms"
  }
];

export function createResourceId(name: string, existingIds: string[] = []): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 44) || "local-resource";
  const used = new Set(existingIds);
  let candidate = base;
  let suffix = 2;

  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function parseResourceTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean),
    ),
  );
}

export function buildResourceDirectoryExport(
  resources: CareResource[],
  exportedAt = new Date().toISOString(),
): string {
  const payload: ResourceDirectoryExport = {
    schema: "carebridge-resource-directory/v1",
    exportedAt,
    resources,
  };

  return JSON.stringify(payload, null, 2);
}

export function parseResourceDirectoryImport(value: unknown): CareResource[] | null {
  if (canLoadPersistedResources(value)) return value;
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<ResourceDirectoryExport>;
  if (
    payload.schema === "carebridge-resource-directory/v1" &&
    typeof payload.exportedAt === "string" &&
    canLoadPersistedResources(payload.resources)
  ) {
    return payload.resources;
  }

  return null;
}

export function canLoadPersistedResources(value: unknown): value is CareResource[] {
  return Array.isArray(value) && value.length > 0 && value.every(isCareResource);
}

function isCareResource(value: unknown): value is CareResource {
  if (!value || typeof value !== "object") return false;
  const resource = value as Partial<CareResource>;
  const distanceKm = resource.distanceKm;
  return (
    typeof resource.id === "string" &&
    resource.id.length > 0 &&
    typeof resource.name === "string" &&
    resource.name.length > 0 &&
    RESOURCE_CATEGORIES.includes(resource.category as CareResource["category"]) &&
    Array.isArray(resource.tags) &&
    resource.tags.every((tag) => typeof tag === "string" && tag.length > 0) &&
    typeof distanceKm === "number" &&
    Number.isFinite(distanceKm) &&
    distanceKm >= 0 &&
    typeof resource.availability === "string" &&
    resource.availability.length > 0 &&
    RESOURCE_CHANNELS.includes(resource.channel as CareResource["channel"])
  );
}
