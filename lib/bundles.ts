import { source } from '@/lib/source';
import { toPlainMarkdown } from '@/lib/plain-text';
import {
  capabilityMap,
  getBundle,
  getCapability,
  DEVELOPER_SITE,
  type Capability,
} from '@/lib/capabilities';

/**
 * Builds a domain bundle (/llms/<id>.txt): the capability records in the bundle
 * rendered as prose, followed by the plain-Markdown text of every developer page
 * those records cite. Everything comes from the generated capability map and the
 * page sources, so the bundle cannot say something the map and pages do not.
 */

function absolutize(markdown: string): string {
  return markdown.replaceAll('](/', `](${DEVELOPER_SITE}/`);
}

function renderCapability(c: Capability): string {
  const out: string[] = [];
  out.push(`### ${c.title} (id: ${c.id})`, '');
  out.push(c.summary, '');
  out.push(`Status: ${c.status}. Audiences: ${c.audiences.join(', ')}. Links verified: ${c.last_verified}.`, '');
  if (c.notes.length > 0) {
    out.push('Caveats:');
    for (const n of c.notes) out.push(`- ${n}`);
    out.push('');
  }
  if (c.operator_docs.length > 0) {
    out.push('Merchant and operator guides (docs.nextcommerce.com):');
    for (const u of c.operator_docs) out.push(`- ${u}`);
    out.push('');
  }
  if (c.developer_docs.length > 0) {
    out.push('Developer guides (developers.nextcommerce.com):');
    for (const u of c.developer_docs) out.push(`- ${u}`);
    out.push('');
  }
  if (c.api_operations.length > 0) {
    out.push(`Admin API operations, version ${capabilityMap.sources.stable_api_version} (${c.api_operations.length}):`);
    for (const op of c.api_operations) {
      const text = `${op.method} ${op.path}${op.summary ? ` — ${op.summary}` : ''}`;
      out.push(op.url ? `- [${text}](${op.url})` : `- ${text}`);
    }
    out.push('');
  }
  if (c.webhooks.length > 0) {
    out.push(`Webhook events (${c.webhooks.length}):`);
    for (const w of c.webhooks) out.push(w.url ? `- [${w.event}](${w.url})` : `- ${w.event}`);
    out.push('');
  }
  if (c.skills.length > 0) {
    out.push('AI agent skills:');
    for (const s of c.skills) out.push(`- [${s.name}](${s.url})`);
    out.push('');
  }
  return out.join('\n');
}

export async function buildBundle(id: string): Promise<string> {
  const bundle = getBundle(id);
  if (!bundle) throw new Error(`Unknown bundle ${id}`);
  const capabilities = bundle.capabilities
    .map((cid) => getCapability(cid))
    .filter((c): c is Capability => Boolean(c));

  const head = [
    `# Next Commerce: ${bundle.title}`,
    '',
    `> ${bundle.intro}`,
    '',
    `This is one of ${capabilityMap.bundles.length} domain bundles derived from the platform capability map at ${DEVELOPER_SITE}/capabilities.json (generated ${capabilityMap.generated_at}). The other bundles are listed at ${DEVELOPER_SITE}/llms.txt. Merchant and operator guides are on ${capabilityMap.sources.merchant_docs}; the changelog is ${capabilityMap.sources.changelog}. The Admin API contract is the OpenAPI file at ${capabilityMap.sources.admin_api_spec}.`,
    '',
    '## Capabilities',
    '',
    ...capabilities.map(renderCapability),
    '## Pages',
    '',
    'The full text of every developer page cited above, in the order listed.',
    '',
  ];

  const seen = new Set<string>();
  const pages: string[] = [];
  for (const c of capabilities) {
    for (const url of c.developer_docs) {
      if (seen.has(url)) continue;
      seen.add(url);
      const slug = url.replace(`${DEVELOPER_SITE}/docs`, '').split('/').filter(Boolean);
      const page = source.getPage(slug);
      if (!page) continue;
      const processed = await page.data.getText('processed');
      pages.push(`# ${page.data.title} (${url})`, '', absolutize(toPlainMarkdown(processed)), '');
    }
  }

  return [...head, ...pages].join('\n');
}

export function bundleResponse(id: string): () => Promise<Response> {
  return async () =>
    new Response(await buildBundle(id), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}
