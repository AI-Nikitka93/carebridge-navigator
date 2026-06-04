import { MapPin, PhoneCall, Send, WifiOff } from "lucide-react";
import { useState } from "react";
import type { CareResource } from "../domain/careTypes";
import { downloadTextFile } from "../domain/exporters";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_CHANNELS,
  buildResourceDirectoryExport,
  createResourceId,
  parseResourceDirectoryImport,
  parseResourceTags,
} from "../domain/resourceDirectory";

const channelIcon = {
  phone: PhoneCall,
  sms: Send,
  offline_referral: WifiOff,
  walk_in: MapPin
};

interface ResourceDraft {
  name: string;
  category: CareResource["category"];
  tags: string;
  distanceKm: string;
  availability: string;
  channel: CareResource["channel"];
}

const defaultDraft: ResourceDraft = {
  name: "Mobile immunization van",
  category: "maternal_child",
  tags: "immunization, newborn, transport",
  distanceKm: "4.5",
  availability: "Wed and Fri mobile round",
  channel: "sms"
};

export function ResourcePanel({
  resources,
  directory,
  onAddResource,
  onImportResources,
  onResetResources,
}: {
  resources: CareResource[];
  directory: CareResource[];
  onAddResource: (resource: CareResource) => void;
  onImportResources: (resources: CareResource[]) => void;
  onResetResources: () => void;
}) {
  const [draft, setDraft] = useState<ResourceDraft>(defaultDraft);
  const [formError, setFormError] = useState("");

  const addResource = () => {
    const distanceKm = Number.parseFloat(draft.distanceKm);
    const tags = parseResourceTags(draft.tags);
    if (!draft.name.trim() || !draft.availability.trim() || tags.length === 0 || !Number.isFinite(distanceKm)) {
      setFormError("Name, availability, tags, and distance are required.");
      return;
    }

    onAddResource({
      id: createResourceId(draft.name, directory.map((resource) => resource.id)),
      name: draft.name.trim(),
      category: draft.category,
      tags,
      distanceKm: Math.max(0, Math.round(distanceKm * 10) / 10),
      availability: draft.availability.trim(),
      channel: draft.channel,
    });
    setFormError("");
    setDraft(defaultDraft);
  };

  const exportDirectory = () => {
    downloadTextFile(
      "carebridge-resource-directory.json",
      buildResourceDirectoryExport(directory),
      "application/json;charset=utf-8",
    );
  };

  const importDirectory = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseResourceDirectoryImport(JSON.parse(await file.text()));
      if (!parsed) {
        setFormError("Imported directory must use the CareBridge resource schema.");
        return;
      }
      onImportResources(parsed);
      setFormError("");
    } catch {
      setFormError("Imported directory must be valid JSON.");
    }
  };

  return (
    <section className="panel" aria-labelledby="resources-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Matched resources</p>
          <h2 id="resources-title">Nearest safe handoff routes</h2>
        </div>
      </div>
      <div className="resource-list">
        {resources.length > 0 ? (
          resources.map((resource) => {
            const Icon = channelIcon[resource.channel];
            return (
              <article key={resource.id} className="resource-item">
                <div className="resource-icon">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3>{resource.name}</h3>
                  <p>{resource.availability}</p>
                  <span>
                    {resource.distanceKm} km · {resource.channel.replace("_", " ")}
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            No matching resource in this directory yet. Add or import service points with matching
            care tags before handing off this plan.
          </p>
        )}
      </div>
      <div className="resource-editor" aria-labelledby="resource-editor-title">
        <div className="ledger-title">
          <MapPin size={18} aria-hidden="true" />
          <h3 id="resource-editor-title">Resource directory editor</h3>
        </div>
        <p>
          {directory.length} local service point{directory.length === 1 ? "" : "s"} available for
          matching. Directory changes stay in this browser.
        </p>
        <div className="resource-form">
          <label>
            <span>Resource name</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            <span>Category</span>
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as CareResource["category"],
                }))
              }
            >
              {RESOURCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Channel</span>
            <select
              value={draft.channel}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  channel: event.target.value as CareResource["channel"],
                }))
              }
            >
              {RESOURCE_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Distance km</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.distanceKm}
              onChange={(event) => setDraft((current) => ({ ...current, distanceKm: event.target.value }))}
            />
          </label>
          <label className="resource-form-wide">
            <span>Matching tags</span>
            <input
              value={draft.tags}
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
            />
          </label>
          <label className="resource-form-wide">
            <span>Availability</span>
            <input
              value={draft.availability}
              onChange={(event) => setDraft((current) => ({ ...current, availability: event.target.value }))}
            />
          </label>
        </div>
        {formError ? <p className="form-error">{formError}</p> : null}
        <div className="resource-editor-actions">
          <button type="button" className="text-button" onClick={addResource}>
            Add local resource
          </button>
          <button type="button" className="text-button" onClick={exportDirectory}>
            Export directory JSON
          </button>
          <label className="text-button file-button">
            Import directory JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importDirectory(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" className="text-button" onClick={onResetResources}>
            Reset directory
          </button>
        </div>
      </div>
    </section>
  );
}
