import { describe, expect, it } from "vitest";
import {
  buildResourceDirectoryExport,
  canLoadPersistedResources,
  createResourceId,
  parseResourceDirectoryImport,
  parseResourceTags,
} from "./resourceDirectory";

describe("resource directory helpers", () => {
  it("creates stable resource ids without collisions", () => {
    expect(createResourceId("Pop-up Fever Testing Tent", ["pop-up-fever-testing-tent"])).toBe(
      "pop-up-fever-testing-tent-2",
    );
  });

  it("normalizes resource tags for matching", () => {
    expect(parseResourceTags(" Testing, prevention, local language, Testing ")).toEqual([
      "testing",
      "prevention",
      "local-language",
    ]);
  });

  it("accepts valid local resource directories and rejects malformed records", () => {
    expect(
      canLoadPersistedResources([
        {
          id: "local-transport",
          name: "Local transport desk",
          category: "logistics",
          tags: ["transport", "access"],
          distanceKm: 1.5,
          availability: "Daily",
          channel: "sms",
        },
      ]),
    ).toBe(true);

    expect(
      canLoadPersistedResources([
        {
          id: "broken",
          name: "Broken external link",
          category: "logistics",
          tags: [],
          distanceKm: -2,
          availability: "",
          channel: "web",
        },
      ]),
    ).toBe(false);
  });

  it("exports and imports a schema-guarded resource directory payload", () => {
    const resources = [
      {
        id: "mobile-immunization-van",
        name: "Mobile immunization van",
        category: "maternal_child" as const,
        tags: ["immunization", "newborn", "transport"],
        distanceKm: 4.5,
        availability: "Wed and Fri mobile round",
        channel: "sms" as const,
      },
    ];
    const exported = buildResourceDirectoryExport(resources, "2026-06-03T00:00:00.000Z");

    expect(exported).toContain("carebridge-resource-directory/v1");
    expect(parseResourceDirectoryImport(JSON.parse(exported))).toEqual(resources);
    expect(parseResourceDirectoryImport(resources)).toEqual(resources);
    expect(parseResourceDirectoryImport({ schema: "carebridge-resource-directory/v1", resources: [] })).toBeNull();
  });
});
