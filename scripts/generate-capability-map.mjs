/**
 * Generates lib/generated/capabilities.json, the platform capability map served at
 * /capabilities.json and consumed by the /llms/<bundle>.txt routes, the capability
 * page, and the merchant docs site.
 *
 * Source: content/capabilities.yaml (hand-authored index; see its header comment).
 * Run after generate-api-docs.mjs, because developer page existence is checked
 * against content/docs including the generated reference pages.
 *
 * The map is a projection over owning sources, so everything that can be derived
 * is derived and validated here rather than typed twice:
 *   - api_operations "tag:<tag>" selectors expand to the operations carrying that
 *     tag in the stable spec; bare entries must be operationIds in the same spec
 *   - webhooks must be events in the spec's `webhooks` block ("all" expands to every event)
 *   - developer_docs must resolve to a page under content/docs
 *   - skills must appear in the AI Skills table
 *   - operator_docs are merchant-site paths; they are shape-checked here and verified
 *     live by scripts/check-live-surfaces.mjs and by the merchant repo's own CI
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SOURCE_PATH = join(ROOT, 'content', 'capabilities.yaml');
const SKILLS_PAGE = join(ROOT, 'content', 'docs', 'skills', 'index.mdx');
const OUT_DIR = join(ROOT, 'lib', 'generated');
const OUT_PATH = join(OUT_DIR, 'capabilities.json');

export const DEVELOPER_SITE = 'https://developers.nextcommerce.com';
export const MERCHANT_SITE = 'https://docs.nextcommerce.com';

const STATUSES = ['available', 'beta', 'deprecated'];
const AUDIENCES = ['merchant', 'developer'];
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
function fail(message) {
  errors.push(message);
}

const map = loadYaml(readFileSync(SOURCE_PATH, 'utf8'));
if (!map || map.version !== 1) fail('capabilities.yaml: expected `version: 1`');
const specVersion = String(map.spec_version ?? '');
const specPath = join(ROOT, 'public', 'api', 'admin', `${specVersion}.yaml`);
if (!existsSync(specPath)) fail(`capabilities.yaml: spec_version ${specVersion} has no file at public/api/admin/`);
const spec = existsSync(specPath) ? loadYaml(readFileSync(specPath, 'utf8')) : { paths: {}, webhooks: {} };

// ---- owning sources -------------------------------------------------------

const operationsById = new Map();
const operationsByTag = new Map();
for (const [path, item] of Object.entries(spec.paths ?? {})) {
  if (!item || typeof item !== 'object') continue;
  for (const method of HTTP_METHODS) {
    const op = item[method];
    if (!op) continue;
    const tags = Array.isArray(op.tags) ? op.tags : [];
    const record = {
      id: op.operationId,
      method: method.toUpperCase(),
      path,
      // The spec carries prose in `description`; keep the first sentence as the summary.
      summary: String(op.summary ?? op.description ?? '').split(/(?<=\.)\s/)[0].trim(),
      tag: tags[0] ?? null,
    };
    if (!record.id) {
      fail(`spec: ${method.toUpperCase()} ${path} has no operationId`);
      continue;
    }
    operationsById.set(record.id, record);
    for (const tag of tags) {
      const list = operationsByTag.get(tag) ?? [];
      list.push(record);
      operationsByTag.set(tag, list);
    }
  }
}
const allEvents = Object.keys(spec.webhooks ?? {}).sort();

const skillsTable = readFileSync(SKILLS_PAGE, 'utf8');
const knownSkills = new Set(
  [...skillsTable.matchAll(/^\|\s*\[\*\*([a-z0-9-]+)\*\*\]/gm)].map((m) => m[1]),
);
if (knownSkills.size === 0) fail('skills page: no skill rows found in the table');

// A developer path exists when content/docs holds <path>.mdx, <path>.md, or <path>/index.mdx.
function developerPageExists(path) {
  const rel = path.replace(/^\/docs\/?/, '');
  const base = join(ROOT, 'content', 'docs', rel);
  return (
    existsSync(`${base}.mdx`) ||
    existsSync(`${base}.md`) ||
    existsSync(join(base, 'index.mdx')) ||
    existsSync(join(base, 'index.md'))
  );
}

// Reference page for an operation, as generate-api-docs lays it out.
function operationUrl(op) {
  const dir = join(ROOT, 'content', 'docs', 'admin-api', 'reference', op.tag ?? '', `${op.id}.mdx`);
  return existsSync(dir) ? `/docs/admin-api/reference/${op.tag}/${op.id}` : null;
}

// Webhook reference pages are grouped by tag folder: /docs/webhooks/reference/<tag>/<event>.
const webhookRefDir = join(ROOT, 'content', 'docs', 'webhooks', 'reference');
const webhookPages = new Map();
if (existsSync(webhookRefDir)) {
  for (const entry of readdirSync(webhookRefDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(join(webhookRefDir, entry.name))) {
      if (file.endsWith('.mdx')) webhookPages.set(file.replace(/\.mdx$/, ''), `/docs/webhooks/reference/${entry.name}/${file.replace(/\.mdx$/, '')}`);
    }
  }
}
function webhookUrl(event) {
  return webhookPages.get(event) ?? null;
}

// ---- validate and resolve records ----------------------------------------

function expectArray(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    fail(`${label}: expected a list`);
    return [];
  }
  return value;
}

const ids = new Set();
const capabilities = [];
for (const raw of expectArray(map.capabilities, 'capabilities')) {
  const label = `capability ${raw?.id ?? '(no id)'}`;
  if (!raw || typeof raw !== 'object') {
    fail(`${label}: not a mapping`);
    continue;
  }
  if (!ID_RE.test(String(raw.id))) fail(`${label}: id must be kebab-case`);
  if (ids.has(raw.id)) fail(`${label}: duplicate id`);
  ids.add(raw.id);
  if (!raw.title) fail(`${label}: missing title`);
  if (!raw.summary || String(raw.summary).trim().length < 40) fail(`${label}: summary must be real prose`);
  if (!STATUSES.includes(raw.status)) fail(`${label}: status must be one of ${STATUSES.join(', ')}`);
  if (!DATE_RE.test(String(raw.last_verified))) fail(`${label}: last_verified must be YYYY-MM-DD`);

  const audiences = expectArray(raw.audiences, `${label}.audiences`);
  if (audiences.length === 0) fail(`${label}: at least one audience`);
  for (const a of audiences) if (!AUDIENCES.includes(a)) fail(`${label}: unknown audience ${a}`);
  // Every audience a record claims must be backed by evidence on that audience's site.
  if (audiences.includes('merchant') && expectArray(raw.operator_docs, `${label}.operator_docs`).length === 0)
    fail(`${label}: audience merchant needs at least one operator_docs page`);
  if (audiences.includes('developer') && expectArray(raw.developer_docs, `${label}.developer_docs`).length === 0)
    fail(`${label}: audience developer needs at least one developer_docs page`);

  const operatorDocs = expectArray(raw.operator_docs, `${label}.operator_docs`);
  for (const p of operatorDocs) {
    if (!/^\/(docs\/[a-z0-9\-/]+|changelog)$/.test(p)) fail(`${label}: operator path ${p} is not a site-relative merchant path`);
  }

  const developerDocs = expectArray(raw.developer_docs, `${label}.developer_docs`);
  for (const p of developerDocs) {
    if (!p.startsWith('/docs')) fail(`${label}: developer path ${p} must start with /docs`);
    else if (!developerPageExists(p)) fail(`${label}: developer page ${p} does not exist under content/docs`);
  }

  const operations = [];
  const seenOps = new Set();
  for (const selector of expectArray(raw.api_operations, `${label}.api_operations`)) {
    const s = String(selector);
    let matched = [];
    if (s.startsWith('tag:')) {
      matched = operationsByTag.get(s.slice(4)) ?? [];
      if (matched.length === 0) fail(`${label}: no operations carry tag ${s.slice(4)} in the ${specVersion} spec`);
    } else if (operationsById.has(s)) {
      matched = [operationsById.get(s)];
    } else {
      fail(`${label}: unknown operationId ${s} in the ${specVersion} spec`);
    }
    for (const op of matched) {
      if (seenOps.has(op.id)) continue;
      seenOps.add(op.id);
      operations.push({
        id: op.id,
        method: op.method,
        path: op.path,
        summary: op.summary,
        url: operationUrl(op),
      });
    }
  }

  let webhooks = raw.webhooks === 'all' ? allEvents : expectArray(raw.webhooks, `${label}.webhooks`);
  for (const e of webhooks) {
    if (!allEvents.includes(e)) fail(`${label}: unknown webhook event ${e} in the ${specVersion} spec`);
  }

  const skills = expectArray(raw.skills, `${label}.skills`);
  for (const s of skills) if (!knownSkills.has(s)) fail(`${label}: unknown skill ${s} (not on the AI Skills page)`);

  const notes = expectArray(raw.notes, `${label}.notes`).map(String);

  capabilities.push({
    id: raw.id,
    title: raw.title,
    summary: String(raw.summary).replace(/\s+/g, ' ').trim(),
    audiences,
    operator_docs: operatorDocs.map((p) => `${MERCHANT_SITE}${p}`),
    developer_docs: developerDocs.map((p) => `${DEVELOPER_SITE}${p}`),
    api_operations: operations.map((op) => ({
      ...op,
      url: op.url ? `${DEVELOPER_SITE}${op.url}` : null,
    })),
    webhooks: webhooks.map((event) => ({
      event,
      url: webhookUrl(event) ? `${DEVELOPER_SITE}${webhookUrl(event)}` : null,
    })),
    skills: skills.map((name) => ({
      name,
      url: `https://github.com/NextCommerceCo/skills/tree/main/${name}`,
    })),
    status: raw.status,
    last_verified: String(raw.last_verified),
    notes,
  });
}

const bundleIds = new Set();
const bundles = [];
for (const raw of expectArray(map.bundles, 'bundles')) {
  const label = `bundle ${raw?.id ?? '(no id)'}`;
  if (!ID_RE.test(String(raw?.id))) fail(`${label}: id must be kebab-case`);
  if (bundleIds.has(raw.id)) fail(`${label}: duplicate id`);
  bundleIds.add(raw.id);
  if (!raw.title) fail(`${label}: missing title`);
  if (!raw.intro || String(raw.intro).trim().length < 40) fail(`${label}: intro must be real prose`);
  const members = expectArray(raw.capabilities, `${label}.capabilities`);
  if (members.length === 0) fail(`${label}: lists no capabilities`);
  for (const id of members) if (!ids.has(id)) fail(`${label}: unknown capability ${id}`);
  bundles.push({
    id: raw.id,
    title: raw.title,
    intro: String(raw.intro).replace(/\s+/g, ' ').trim(),
    url: `${DEVELOPER_SITE}/llms/${raw.id}.txt`,
    capabilities: members,
  });
}
for (const id of ids) {
  if (!bundles.some((b) => b.capabilities.includes(id))) fail(`capability ${id} belongs to no bundle`);
}

if (errors.length > 0) {
  console.error('generate-capability-map: FAIL');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const specVersions = readdirSync(join(ROOT, 'public', 'api', 'admin'))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => f.replace(/\.yaml$/, ''))
  .sort();

const output = {
  $schema: `${DEVELOPER_SITE}/capabilities.schema.json`,
  version: 1,
  generated_at: new Date().toISOString().slice(0, 10),
  sources: {
    developer_docs: DEVELOPER_SITE,
    merchant_docs: MERCHANT_SITE,
    changelog: `${MERCHANT_SITE}/changelog`,
    admin_api_spec: `${DEVELOPER_SITE}/api/admin/${specVersion}.yaml`,
    admin_api_versions: specVersions,
    stable_api_version: specVersion,
  },
  bundles,
  capabilities,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(
  `Generated ${OUT_PATH}: ${capabilities.length} capabilities, ${bundles.length} bundles, ` +
    `${capabilities.reduce((n, c) => n + c.api_operations.length, 0)} operation links, ` +
    `${capabilities.reduce((n, c) => n + c.webhooks.length, 0)} webhook links`,
);

// ---- readable page ----------------------------------------------------------
// content/docs/capabilities/index.mdx is generated (git-ignored) so the page and
// the JSON can never list different ids or links. meta.json beside it is committed.

function mdxEscape(text) {
  return text.replace(/[{}<>]/g, (ch) => ({ '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;' })[ch]);
}

// Links to /docs pages stay site-relative so validate-links checks them; links to
// non-docs routes (JSON, specs, bundles) stay absolute, which the link validator
// cannot see and which agents copy verbatim.
function relative(url) {
  return url.startsWith(`${DEVELOPER_SITE}/docs/`) ? url.slice(DEVELOPER_SITE.length) : url;
}

const page = [];
page.push('---');
page.push('title: Platform Capabilities');
page.push('description: One record per platform capability linking merchant guides, developer guides, Admin API operations, webhook events, and AI agent skills under a stable id');
page.push('full: true');
page.push('---');
page.push('');
page.push(`This page and [capabilities.json](${DEVELOPER_SITE}/capabilities.json) are the same generated projection (${output.generated_at}) over the two documentation sites and the Admin API specification. Each capability has a stable id that pages on both sites declare in their frontmatter. Links, operations, and events come from the owning sources; when they disagree with this page, the guide, the [spec](${DEVELOPER_SITE}/api/admin/${specVersion}.yaml), or the [changelog](${MERCHANT_SITE}/changelog) wins.`);
page.push('');
page.push(`Agents: fetch a [domain bundle](${DEVELOPER_SITE}/llms.txt) rather than this page when you need the prose behind a capability. The JSON schema is at [capabilities.schema.json](${DEVELOPER_SITE}/capabilities.schema.json).`);
page.push('');
page.push('## Bundles');
page.push('');
page.push('| Bundle | Capabilities | Plain-text URL |');
page.push('| --- | --- | --- |');
for (const b of bundles) {
  page.push(`| ${b.title} | ${b.capabilities.map((id) => `[${id}](#${id})`).join(', ')} | [${b.url.replace(DEVELOPER_SITE, '')}](${b.url}) |`);
}
page.push('');
page.push('## Capabilities');
page.push('');
for (const c of capabilities) {
  page.push(`### ${mdxEscape(c.title)} [#${c.id}]`);
  page.push('');
  page.push(`\`id: ${c.id}\` · status: ${c.status} · audiences: ${c.audiences.join(', ')} · links verified ${c.last_verified}`);
  page.push('');
  page.push(mdxEscape(c.summary));
  page.push('');
  for (const n of c.notes) page.push(`> ${mdxEscape(n)}`);
  if (c.notes.length > 0) page.push('');
  if (c.operator_docs.length > 0) {
    page.push('**Merchant guides**');
    page.push('');
    for (const u of c.operator_docs) page.push(`- [${u.replace(MERCHANT_SITE, 'docs.nextcommerce.com')}](${u})`);
    page.push('');
  }
  if (c.developer_docs.length > 0) {
    page.push('**Developer guides**');
    page.push('');
    for (const u of c.developer_docs) page.push(`- [${relative(u)}](${relative(u)})`);
    page.push('');
  }
  if (c.api_operations.length > 0) {
    page.push(`**Admin API operations (${c.api_operations.length}, version ${specVersion})**`);
    page.push('');
    for (const op of c.api_operations) {
      const text = `\`${op.method} ${op.path}\`${op.summary ? ` ${mdxEscape(op.summary)}` : ''}`;
      page.push(op.url ? `- [${text}](${relative(op.url)})` : `- ${text}`);
    }
    page.push('');
  }
  if (c.webhooks.length > 0) {
    page.push(`**Webhook events (${c.webhooks.length})**`);
    page.push('');
    for (const w of c.webhooks) page.push(w.url ? `- [\`${w.event}\`](${relative(w.url)})` : `- \`${w.event}\``);
    page.push('');
  }
  if (c.skills.length > 0) {
    page.push('**AI agent skills**');
    page.push('');
    for (const s of c.skills) page.push(`- [${s.name}](${s.url})`);
    page.push('');
  }
}

const pageDir = join(ROOT, 'content', 'docs', 'capabilities');
mkdirSync(pageDir, { recursive: true });
writeFileSync(join(pageDir, 'index.mdx'), page.join('\n') + '\n');
console.log(`Generated ${join(pageDir, 'index.mdx')}`);
