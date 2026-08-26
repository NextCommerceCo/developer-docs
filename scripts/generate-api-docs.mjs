/**
 * Generates fumadocs-openapi MDX pages from the OpenAPI YAML specs.
 * Run before `next build` — already wired into the "build" npm script.
 *
 * Output locations (under content/docs/):
 *   admin-api/reference/             ← 2024-04-01 (stable, REST endpoints only)
 *   admin-api/reference/2023-02-10/  ← REST endpoints only
 *   admin-api/reference/unstable/    ← REST endpoints only
 *   campaigns/api/                   ← stable (current version)
 *   campaigns/api/<version>/         ← future versioned releases
 *   webhooks/reference/              ← webhook events from 2024-04-01, grouped by tag
 *   webhooks/reference/2023-02-10/   ← webhook events, legacy version
 *   webhooks/reference/unstable/     ← webhook events, unstable version
 *
 * Versioning strategy (consistent across Admin API, Campaigns, Webhooks):
 *   - Stable content lives directly in the base output dir (reference/ or api/)
 *   - Each additional version gets its own subdir with root:true in meta.json
 *   - root:true version subdirs are discovered automatically by fumadocs — they
 *     are NOT listed in the parent pages array (that would make them appear as
 *     duplicate sidebar items)
 *   - DocsLayout sidebar.tabs.transform filters version roots from the section dropdown
 */

import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { readdirSync, writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as loadYaml, dump as dumpYaml } from 'js-yaml';

// ── Paths anchored to project root ──────────────────────────────────────────

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Ensure CWD is the project root so relative paths in generated MDX match api-page.tsx
process.chdir(ROOT);

function rootPath(...segments) {
  return join(ROOT, ...segments);
}

// ── Webhook schema fixup ────────────────────────────────────────────────────

/**
 * Fix webhook schemas in admin API YAML files so fumadocs-openapi renders them
 * correctly. Writes fixes back to the source file so the document path in
 * generated MDX matches what createOpenAPI expects in api-page.tsx.
 */
function fixWebhookSchemas(specPath) {
  const raw = readFileSync(specPath, 'utf8');
  const spec = loadYaml(raw);
  if (!spec.webhooks) return;
  const version = spec.info?.version ?? '';

  for (const [eventName, pathItem] of Object.entries(spec.webhooks)) {
    const post = pathItem.post;
    if (!post) continue;

    // Fix responses misplaced at path-item level (should be inside post)
    if (pathItem.responses && !post.responses) {
      post.responses = pathItem.responses;
      delete pathItem.responses;
    }

    const contentJson = post.requestBody?.content?.['application/json'];
    if (!contentJson) continue;
    const schema = contentJson.schema;
    if (!schema) continue;

    // Add missing type: object to root schema
    if (!schema.type) schema.type = 'object';

    // Recursively fix type arrays → strings
    fixTypes(schema);

    // Generate example payload if not already present
    if (!contentJson.example) {
      const dataSchema = schema.properties?.data;
      const objectName = schema.properties?.object?.examples?.[0] ?? eventName.split('.')[0];
      contentJson.example = {
        api_version: version,
        object: objectName,
        data: generateExample(dataSchema, 0),
        event_id: 'a7a26ff2-e851-45b6-9634-d595f45458b7',
        event_type: eventName,
        webhook: {
          id: 1,
          store: 'example',
          events: [eventName],
          target: 'https://example.com/webhook/',
        },
      };
    }
  }

  writeFileSync(specPath, dumpYaml(spec, { lineWidth: -1 }));
}

/**
 * Generate a JSON example value from an OpenAPI schema.
 * Shared format constants match tools/webhooks.py generate_example().
 */
function generateExample(schema, depth) {
  if (!schema || typeof schema !== 'object' || depth > 4) return null;
  const t = Array.isArray(schema.type) ? schema.type.filter(x => x !== 'null')[0] : schema.type;
  if (schema.example !== undefined) return schema.example;
  if (schema.examples?.length) return schema.examples[0];
  if (t === 'object' || schema.properties) {
    const props = schema.properties ?? {};
    return Object.fromEntries(Object.entries(props).map(([k, v]) => [k, generateExample(v, depth + 1)]));
  }
  if (t === 'array') return schema.items ? [generateExample(schema.items, depth + 1)].filter(x => x !== null) : [];
  if (t === 'integer') return schema.default ?? 0;
  if (t === 'number') return schema.default ?? 0.0;
  if (t === 'boolean') return schema.default ?? false;
  if (t === 'string') {
    const fmt = schema.format ?? '';
    if (fmt === 'date-time') return '2024-01-01T00:00:00Z';
    if (fmt === 'date') return '2024-01-01';
    if (fmt === 'uuid') return 'a7a26ff2-e851-45b6-9634-d595f45458b7';
    if (fmt === 'uri') return 'https://example.com';
    if (fmt === 'email') return 'user@example.com';
    if (fmt === 'decimal') return '0.00';
    return schema.default ?? 'string';
  }
  return null;
}

/**
 * fumadocs-openapi ≥10.8 silently skips operations whose tags aren't listed in
 * the document's top-level `tags` array. Walk paths + webhooks, collect every
 * tag in use, and write them back to the spec so `groupBy: 'tag'` keeps working.
 */
function ensureTopLevelTags(specPath) {
  const raw = readFileSync(specPath, 'utf8');
  const spec = loadYaml(raw);
  const seen = new Set();
  const collect = (container) => {
    for (const methods of Object.values(container ?? {})) {
      for (const op of Object.values(methods ?? {})) {
        if (!op || typeof op !== 'object') continue;
        for (const tag of op.tags ?? []) seen.add(tag);
      }
    }
  };
  collect(spec.paths);
  collect(spec.webhooks);
  const existing = new Map((spec.tags ?? []).map(t => [t.name, t]));
  for (const name of seen) if (!existing.has(name)) existing.set(name, { name });
  spec.tags = [...existing.values()];
  writeFileSync(specPath, dumpYaml(spec, { lineWidth: -1 }));
}

/** Recursively fix array-style types to plain strings. Returns true if any changes were made. */
function fixTypes(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (Array.isArray(obj)) { let changed = false; obj.forEach(v => { if (fixTypes(v)) changed = true; }); return changed; }
  let changed = false;
  if (Array.isArray(obj.type)) {
    obj.type = obj.type.filter(t => t !== 'null')[0] ?? 'string';
    changed = true;
  }
  if (Array.isArray(obj.format)) {
    obj.format = obj.format[0];
    changed = true;
  }
  for (const val of Object.values(obj)) {
    if (fixTypes(val)) changed = true;
  }
  return changed;
}

// ── Configuration ───────────────────────────────────────────────────────────

// Remove stale directories from previous generation layout
const STALE_DIRS = [
  rootPath('content/docs/admin-api/reference/2024-04-01'),
  rootPath('content/docs/campaigns/api/reference/v1'),
];
for (const dir of STALE_DIRS) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
    console.log(`Removed stale directory: ${dir}`);
  }
}

// Admin API + Webhooks share date-based versioning (2023-02-10, unstable)
const VERSION_SUBFOLDERS = ['2023-02-10', 'unstable'];

// Campaigns version subfolders — empty now (v1 is the stable/base), add future versions here
const CAMPAIGNS_VERSION_SUBFOLDERS = [];

// Webhook event file names (dot-separated) to exclude from REST reference generation
function isWebhookFile(filename) {
  return filename.includes('.');
}

/**
 * Extract the tag order from an OpenAPI spec by first-appearance in paths.
 */
function getTagOrder(specPath) {
  const raw = readFileSync(specPath, 'utf8');
  const spec = loadYaml(raw);
  if (spec.tags?.length) return spec.tags.map(t => t.name);
  const seen = [];
  for (const methods of Object.values(spec.paths ?? {})) {
    for (const op of Object.values(methods)) {
      if (!op || typeof op !== 'object') continue;
      for (const tag of op.tags ?? []) {
        if (!seen.includes(tag)) seen.push(tag);
      }
    }
  }
  return seen;
}

/**
 * Sort tag folders to match spec order; any folders not in spec go at the end alphabetically.
 */
function sortBySpecOrder(folders, specOrder) {
  return [
    ...specOrder.filter(t => folders.includes(t)),
    ...folders.filter(t => !specOrder.includes(t)).sort(),
  ];
}

/**
 * Scan generated MDX files and return a map of URL path → HTTP method.
 */
function collectMethods(dir, urlBase, map = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMethods(fullPath, `${urlBase}/${entry.name}`, map);
    } else if (entry.name.endsWith('.mdx')) {
      const content = readFileSync(fullPath, 'utf8');
      const match = content.match(/^_openapi:\s*\n(?:[ \t]+\S[^\n]*\n)*?[ \t]+method:\s*(\w+)/m);
      if (match) {
        const slug = entry.name.replace(/\.mdx$/, '');
        map[`${urlBase}/${slug}`] = match[1].toUpperCase();
      }
    }
  }
  return map;
}

// ── Spec definitions ────────────────────────────────────────────────────────

// Relative paths for spec inputs — these get embedded in generated MDX document props
// and must match the paths in components/api-page.tsx createOpenAPI({ input: [...] })
const ADMIN_SPECS = [
  'public/api/admin/2024-04-01.yaml',
  'public/api/admin/2023-02-10.yaml',
  'public/api/admin/unstable.yaml',
];

// Fix webhook schemas in admin API YAML files before generating MDX
for (const specPath of ADMIN_SPECS) {
  fixWebhookSchemas(specPath);
  console.log(`Fixed webhook schemas in ${specPath}`);
}

// Inject top-level tags so fumadocs-openapi ≥10.8 doesn't drop tagged operations
const ALL_SPECS = [...ADMIN_SPECS, 'public/api/campaigns/v1.yaml'];
for (const specPath of ALL_SPECS) {
  ensureTopLevelTags(specPath);
}

const specs = [
  {
    input: [ADMIN_SPECS[0]],
    output: rootPath('content/docs/admin-api/reference'),
    urlBase: '/docs/admin-api/reference',
  },
  {
    input: [ADMIN_SPECS[1]],
    output: rootPath('content/docs/admin-api/reference/2023-02-10'),
    urlBase: '/docs/admin-api/reference/2023-02-10',
    hidden: true,
  },
  {
    input: [ADMIN_SPECS[2]],
    output: rootPath('content/docs/admin-api/reference/unstable'),
    urlBase: '/docs/admin-api/reference/unstable',
    hidden: true,
  },
  {
    input: ['public/api/campaigns/v1.yaml'],
    output: rootPath('content/docs/campaigns/api'),
    urlBase: '/docs/campaigns/api',
  },
];

const allMethods = {};

// Pre-clean reference dirs before regeneration
function cleanRefDir(dir, keepSubdirs = [], keepFiles = []) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!keepSubdirs.includes(entry.name)) rmSync(full, { recursive: true });
    } else if ((entry.name.endsWith('.mdx') || entry.name === 'meta.json') && !keepFiles.includes(entry.name)) {
      rmSync(full);
    }
  }
}

// Admin API: clean stable reference dir (preserve versioned subdirs; they're regenerated separately)
cleanRefDir(specs[0].output, VERSION_SUBFOLDERS);
// Clean versioned subdirs entirely (regenerated fresh below)
for (const version of VERSION_SUBFOLDERS) {
  const vdir = join(specs[0].output, version);
  if (existsSync(vdir)) rmSync(vdir, { recursive: true });
  mkdirSync(vdir, { recursive: true });
}

// Campaigns API: clean stable api dir (preserve versioned subdirs and hand-written index.mdx)
const campaignsSpecOutput = specs.find(s => s.output === rootPath('content/docs/campaigns/api')).output;
cleanRefDir(campaignsSpecOutput, CAMPAIGNS_VERSION_SUBFOLDERS, ['index.mdx']);
for (const version of CAMPAIGNS_VERSION_SUBFOLDERS) {
  const vdir = join(campaignsSpecOutput, version);
  if (existsSync(vdir)) rmSync(vdir, { recursive: true });
  mkdirSync(vdir, { recursive: true });
}

// ── Generate REST endpoint docs ─────────────────────────────────────────────
// Excluding webhook event files, grouped by tag

for (const spec of specs) {
  console.log(`Generating API docs from ${spec.input[0]}...`);
  const openapi = createOpenAPI({ input: spec.input });
  await generateFiles({
    input: openapi,
    output: spec.output,
    groupBy: 'tag',
    beforeWrite(files) {
      const keep = files.filter(f => !isWebhookFile(f.path.split('/').pop().replace('.mdx', '')));
      files.splice(0, files.length, ...keep);
    },
  });
  console.log(`  → ${spec.output}`);

  collectMethods(spec.output, spec.urlBase, allMethods);
}

// ── Generate webhook docs ───────────────────────────────────────────────────

const WEBHOOK_SPECS = [
  { input: ADMIN_SPECS[0], output: rootPath('content/docs/webhooks/reference') },
  { input: ADMIN_SPECS[1], output: rootPath('content/docs/webhooks/reference/2023-02-10') },
  { input: ADMIN_SPECS[2], output: rootPath('content/docs/webhooks/reference/unstable') },
];

// Clean up stable output dir before regenerating
const webhookOutput = rootPath('content/docs/webhooks/reference');
if (existsSync(webhookOutput)) rmSync(webhookOutput, { recursive: true });
mkdirSync(webhookOutput, { recursive: true });

function webhookBeforeWrite(files) {
  // Keep only webhook event files (dot-separated names like cart.abandoned.mdx)
  const keep = files.filter(f => isWebhookFile(f.path.split('/').pop().replace('.mdx', '')));
  files.splice(0, files.length, ...keep);
  // Replace generated title with the full event name
  for (const file of files) {
    const eventName = file.path.split('/').pop().replace('.mdx', '');
    file.content = file.content.replace(/^title:.*$/m, `title: ${eventName}`);
  }
}

for (const wspec of WEBHOOK_SPECS) {
  console.log(`Generating webhook docs from ${wspec.input}...`);
  mkdirSync(wspec.output, { recursive: true });
  const wOpenapi = createOpenAPI({ input: [wspec.input] });
  await generateFiles({
    input: wOpenapi,
    output: wspec.output,
    groupBy: 'tag',
    beforeWrite: webhookBeforeWrite,
  });
  console.log(`  → ${wspec.output}`);

  // Write meta.json for this version's tag subfolders
  const tagFolders = readdirSync(wspec.output, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
  const metaObj = wspec.output === webhookOutput
    ? { title: 'Webhook Event Reference', pages: tagFolders }
    : { root: true, title: 'Webhook Event Reference', pages: tagFolders };
  writeFileSync(
    join(wspec.output, 'meta.json'),
    JSON.stringify(metaObj, null, 2),
  );
  console.log(`Wrote ${wspec.output}/meta.json with tags: ${tagFolders.join(', ')}`);
}

// ── Write meta.json files for tag ordering ──────────────────────────────────

// Admin API reference
const refDir = rootPath('content/docs/admin-api/reference');
const stableTagOrder = getTagOrder(ADMIN_SPECS[0]);
const tagFolders = sortBySpecOrder(
  readdirSync(refDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !VERSION_SUBFOLDERS.includes(e.name))
    .map(e => e.name),
  stableTagOrder,
);
writeFileSync(
  join(refDir, 'meta.json'),
  JSON.stringify({ title: 'API Reference', pages: tagFolders }, null, 2),
);
console.log(`Wrote reference/meta.json with tag folders: ${tagFolders.join(', ')}`);

// Admin API versioned subdirs
for (const version of VERSION_SUBFOLDERS) {
  const versionDir = join(refDir, version);
  if (!existsSync(versionDir)) continue;
  const versionSpecPath = specs.find(s => s.output === versionDir)?.input[0] ?? ADMIN_SPECS[0];
  const versionTagOrder = getTagOrder(versionSpecPath);
  const versionTagFolders = sortBySpecOrder(
    readdirSync(versionDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name),
    versionTagOrder,
  );
  writeFileSync(
    join(versionDir, 'meta.json'),
    JSON.stringify({ root: true, title: 'API Reference', pages: versionTagFolders }, null, 2),
  );
  console.log(`Wrote reference/${version}/meta.json`);
}

// Campaigns API
const campaignsApiDir = rootPath('content/docs/campaigns/api');
const campaignsTagOrder = getTagOrder(specs.find(s => s.output === campaignsApiDir).input[0]);
const campaignsTagFolders = sortBySpecOrder(
  readdirSync(campaignsApiDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !CAMPAIGNS_VERSION_SUBFOLDERS.includes(e.name))
    .map(e => e.name),
  campaignsTagOrder,
);
writeFileSync(
  join(campaignsApiDir, 'meta.json'),
  JSON.stringify({ title: 'Campaign Cart API', pages: campaignsTagFolders }, null, 2),
);
console.log(`Wrote campaigns/api/meta.json with tag folders: ${campaignsTagFolders.join(', ')}`);

// Campaigns versioned subdirs
for (const version of CAMPAIGNS_VERSION_SUBFOLDERS) {
  const versionDir = join(campaignsApiDir, version);
  if (!existsSync(versionDir)) continue;
  const versionTagFolders = readdirSync(versionDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
  writeFileSync(
    join(versionDir, 'meta.json'),
    JSON.stringify({ root: true, title: 'API Reference', pages: versionTagFolders }, null, 2),
  );
  console.log(`Wrote campaigns/api/${version}/meta.json`);
}

// ── Write method map & endpoint data for sidebar/search ─────────────────────

const generatedDir = rootPath('lib/generated');
mkdirSync(generatedDir, { recursive: true });
writeFileSync(join(generatedDir, 'api-methods.json'), JSON.stringify(allMethods, null, 2));
console.log(`Wrote api-methods.json (${Object.keys(allMethods).length} endpoints)`);

// Collect endpoint data for AI search indexing (stable specs only)
function collectEndpointData(spec, urlBase) {
  const endpoints = [];
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op || typeof op !== 'object' || !op.operationId) continue;
      if (op.operationId.includes('.')) continue;
      const tag = op.tags?.[0];
      if (!tag) continue;

      const url = `${urlBase}/${tag}/${op.operationId}`;

      const params = (op.parameters ?? [])
        .filter(p => p.in !== 'header')
        .map(p => `${p.name} (${p.in})${p.description ? ': ' + p.description.split('\n')[0].slice(0, 80) : ''}`);

      const bodyFields = [];
      const bodyContent = op.requestBody?.content;
      if (bodyContent) {
        const schema = bodyContent['application/json']?.schema ?? bodyContent['multipart/form-data']?.schema;
        if (schema) {
          let resolved = schema;
          if (schema.$ref) {
            const schemaName = schema.$ref.split('/').pop();
            resolved = spec.components?.schemas?.[schemaName] ?? {};
          }
          for (const [fieldName, fieldDef] of Object.entries(resolved.properties ?? {})) {
            const desc = fieldDef.description ? ': ' + fieldDef.description.split('\n')[0].slice(0, 80) : '';
            bodyFields.push(`${fieldName}${desc}`);
          }
        }
      }

      const contentParts = [`${method.toUpperCase()} ${path}`, op.description || op.summary || ''];
      if (params.length) contentParts.push(`Parameters: ${params.join(', ')}`);
      if (bodyFields.length) contentParts.push(`Request fields: ${bodyFields.join(', ')}`);

      endpoints.push({
        url,
        title: `${method.toUpperCase()} ${path}`,
        description: op.description || op.summary || '',
        content: contentParts.join('\n'),
      });
    }
  }
  return endpoints;
}

const allEndpoints = [];
for (const spec of specs.filter(s => !s.hidden)) {
  const specData = loadYaml(readFileSync(spec.input[0], 'utf8'));
  allEndpoints.push(...collectEndpointData(specData, spec.urlBase));
}
writeFileSync(join(generatedDir, 'api-endpoints.json'), JSON.stringify(allEndpoints, null, 2));
console.log(`Wrote api-endpoints.json (${allEndpoints.length} endpoints)`);

console.log('API docs generation complete.');
