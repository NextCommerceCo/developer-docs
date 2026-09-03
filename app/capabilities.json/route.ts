import { capabilityMap } from '@/lib/capabilities';

export const revalidate = false;

/**
 * The platform capability map, generated at build time by
 * scripts/generate-capability-map.mjs from content/capabilities.yaml.
 * Stable URL: https://developers.nextcommerce.com/capabilities.json
 */
export function GET() {
  return new Response(JSON.stringify(capabilityMap, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
