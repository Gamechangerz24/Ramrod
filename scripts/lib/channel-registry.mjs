import { readFileSync } from "node:fs";

const registryUrl = new URL("../../data/channel-config.json", import.meta.url);
const registry = JSON.parse(readFileSync(registryUrl, "utf8"));

export const channelRegistryVersion = Number(registry.version || 1);
export const channels = Object.freeze(registry.channels.map((channel) => Object.freeze({ ...channel })));

export function getChannel(identifier) {
  const value = String(identifier || "").trim().toLowerCase();
  return channels.find((channel) => channel.id.toLowerCase() === value || channel.name.toLowerCase() === value) || null;
}

export function publicChannelRegistry() {
  return channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    type: channel.type,
    status: channel.status,
    statusLabel: channel.statusLabel,
    automationLevel: channel.automationLevel,
    publishingMode: channel.publishingMode,
    priority: channel.priority,
    spotlight: Boolean(channel.spotlight),
    selectable: Boolean(channel.selectable),
    capabilities: channel.capabilities || [],
    bestFor: channel.bestFor || [],
    saleDetection: channel.saleDetection,
    delistSupported: channel.delistSupported
  }));
}

export function channelPlanEntry(identifier, overrides = {}) {
  const channel = getChannel(identifier);
  if (!channel) {
    return {
      id: String(identifier || "open").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      name: String(identifier || "Offen"),
      status: "review",
      statusLabel: "Prüfung nötig",
      automationLevel: "manual",
      publishingMode: "review",
      delistSupported: false,
      ...overrides
    };
  }

  return {
    id: channel.id,
    name: channel.name,
    status: channel.status,
    statusLabel: channel.statusLabel,
    automationLevel: channel.automationLevel,
    publishingMode: channel.publishingMode,
    delistSupported: channel.delistSupported,
    ...overrides
  };
}
