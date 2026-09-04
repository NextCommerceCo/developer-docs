/**
 * Generates lib/generated/capabilities.json, the platform capability map served at
 * /capabilities.json and consumed by the /llms/<bundle>.txt routes and the merchant
 * docs site.
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

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
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

// Reference page for an operation, as generate-api-docs lays it out (one folder per
// tag, named exactly as the tag). If the generator ever changes that layout, or a tag
// stops matching its folder, the build fails here instead of silently dropping links.
const TAG_RE = /^[a-z0-9-]+$/;
function operationUrl(op) {
  if (!op.tag || !TAG_RE.test(op.tag)) {
    fail(`spec: operation ${op.id} has tag ${JSON.stringify(op.tag)}, which is not a reference folder name`);
    return null;
  }
  const file = join(ROOT, 'content', 'docs', 'admin-api', 'reference', op.tag, `${op.id}.mdx`);
  if (!existsSync(file)) {
    fail(`operation ${op.id} has no generated reference page at admin-api/reference/${op.tag}/; run generate-api-docs first`);
    return null;
  }
  return `/docs/admin-api/reference/${op.tag}/${op.id}`;
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

// Remove the generated human-readable page from checkouts that built an older
// version of this script. capabilities.json and the domain bundles are the agent
// surfaces; the machine taxonomy should not occupy the public docs navigation.
const obsoleteReadablePage = join(ROOT, 'content', 'docs', 'capabilities', 'index.mdx');
if (existsSync(obsoleteReadablePage)) {
  rmSync(obsoleteReadablePage);
  console.log(`Removed obsolete ${obsoleteReadablePage}`);
}
