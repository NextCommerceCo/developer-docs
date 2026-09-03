import generated from '@/lib/generated/capabilities.json';

/**
 * Typed access to the generated capability map (lib/generated/capabilities.json,
 * written by scripts/generate-capability-map.mjs from content/capabilities.yaml).
 */

export interface CapabilityOperation {
  id: string;
  method: string;
  path: string;
  summary: string;
  url: string | null;
}

export interface CapabilityWebhook {
  event: string;
  url: string | null;
}

export interface CapabilitySkill {
  name: string;
  url: string;
}

export interface Capability {
  id: string;
  title: string;
  summary: string;
  audiences: string[];
  operator_docs: string[];
  developer_docs: string[];
  api_operations: CapabilityOperation[];
  webhooks: CapabilityWebhook[];
  skills: CapabilitySkill[];
  status: string;
  last_verified: string;
  notes: string[];
}

export interface CapabilityBundle {
  id: string;
  title: string;
  intro: string;
  url: string;
  capabilities: string[];
}

export interface CapabilityMap {
  $schema: string;
  version: number;
  generated_at: string;
  sources: {
    developer_docs: string;
    merchant_docs: string;
    changelog: string;
    admin_api_spec: string;
    admin_api_versions: string[];
    stable_api_version: string;
  };
  bundles: CapabilityBundle[];
  capabilities: Capability[];
}

export const capabilityMap = generated as CapabilityMap;

export const DEVELOPER_SITE = capabilityMap.sources.developer_docs;
export const MERCHANT_SITE = capabilityMap.sources.merchant_docs;

const byId = new Map(capabilityMap.capabilities.map((c) => [c.id, c]));

export function getCapability(id: string): Capability | undefined {
  return byId.get(id);
}

export function getBundle(id: string): CapabilityBundle | undefined {
  return capabilityMap.bundles.find((b) => b.id === id);
}

/** Capabilities whose developer_docs include this site-relative page URL (e.g. /docs/testing). */
export function capabilitiesForPage(pageUrl: string): Capability[] {
  const absolute = `${DEVELOPER_SITE}${pageUrl}`;
  return capabilityMap.capabilities.filter((c) => c.developer_docs.includes(absolute));
}
