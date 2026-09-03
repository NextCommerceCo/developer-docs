import { source } from '@/lib/source';

export const revalidate = false;

const SITE = 'https://developers.nextcommerce.com';
const MERCHANT_SITE = 'https://docs.nextcommerce.com';

// Groups named here come first, in this order; any other top-level folder
// follows alphabetically. 'index' is the /docs root page itself.
const PREFERRED_GROUP_ORDER = [
  'index',
  'admin-api',
  'webhooks',
  'storefront',
  'campaigns',
  'apps',
  'skills',
  'testing',
];

const GROUP_TITLES: Record<string, string> = {
  index: 'Overview',
  'admin-api': 'Admin API',
  webhooks: 'Webhooks',
  storefront: 'Storefront',
  campaigns: 'Campaigns',
  apps: 'Apps',
  skills: 'Skills',
  testing: 'Testing',
};

function groupTitle(key: string): string {
  if (GROUP_TITLES[key]) return GROUP_TITLES[key];
  return key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function groupKey(url: string): string {
  const rest = url.replace(/^\/docs\/?/, '');
  const first = rest.split('/')[0];
  return first || 'index';
}

// Frontmatter values are interpolated into Markdown link syntax; keep each
// page on exactly one line and neutralise the characters that would break it.
function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function linkText(value: string): string {
  return oneLine(value).replace(/[\[\]]/g, '\\$&');
}

function header(): string {
  return [
    '# Next Commerce Developer Docs',
    '',
    '> API, webhook, storefront theme, campaign, and app documentation for Next Commerce, the ecommerce platform for direct-to-consumer brands. Merchant and operator guides live on the sibling site.',
    '',
    '## Start here',
    '',
    `- [Developer docs home](${SITE})`,
    `- [Merchant docs](${MERCHANT_SITE}): guides for store operators, on the sibling site`,
    `- [Merchant docs index](${MERCHANT_SITE}/llms.txt)`,
    `- [Platform and API changelog](${MERCHANT_SITE}/changelog): the developer portal has no changelog of its own`,
    `- [Full corpus](${SITE}/llms-full.txt): every page in one file (large, about 1.5 MB)`,
    `- [Admin API spec, 2024-04-01](${SITE}/api/admin/2024-04-01.yaml): stable, raw OpenAPI`,
    `- [Admin API spec, unstable](${SITE}/api/admin/unstable.yaml): raw OpenAPI`,
    `- [Admin API spec, 2023-02-10](${SITE}/api/admin/2023-02-10.yaml): deprecated, raw OpenAPI`,
    `- [Campaigns API spec, v1](${SITE}/api/campaigns/v1.yaml): raw OpenAPI`,
    `- [Webhooks](${SITE}/docs/webhooks)`,
    `- [Skills](${SITE}/docs/skills): AI agent skills for the platform`,
    `- [Testing](${SITE}/docs/testing)`,
    `- [Agent guide (AGENTS.md)](https://github.com/NextCommerceCo/developer-docs/blob/main/AGENTS.md): navigation and evidence rules for agents reading this site`,
    '',
    '## Legacy identifiers',
    '',
    'Next Commerce was formerly 29 Next, and the platform still carries that name in its core technical identifiers: store and account hostnames (`{store}.29next.store`, `accounts.29next.com`), the `X-29next-API-Version` and `X-29Next-Signature` headers, and the API key namespace. These are current, in use on every store, and not scheduled to change. Use them exactly as written.',
    '',
  ].join('\n');
}

export function GET() {
  const groups = new Map<string, string[]>();

  for (const page of source.getPages()) {
    const key = groupKey(page.url);
    const title = linkText(page.data.title ?? page.url);
    const description = page.data.description ? linkText(page.data.description) : '';
    const line = description
      ? `- [${title}](${SITE}${page.url}): ${description}`
      : `- [${title}](${SITE}${page.url})`;
    const list = groups.get(key) ?? [];
    list.push(line);
    groups.set(key, list);
  }

  const keys = [...groups.keys()].sort((a, b) => {
    const ia = PREFERRED_GROUP_ORDER.indexOf(a);
    const ib = PREFERRED_GROUP_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const body = keys
    .map((key) => `## ${groupTitle(key)}\n\n${groups.get(key)!.join('\n')}\n`)
    .join('\n');

  return new Response(header() + '\n' + body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
