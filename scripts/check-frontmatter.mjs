/**
 * Frontmatter checks for authored developer pages.
 *
 * Counting rule (frozen 2026-09-03 for the docs agent-accessibility packet):
 *   an "authored page" is a git-tracked file matching content/docs/**\/*.{md,mdx}.
 *   Generated reference trees are git-ignored, so they never count. At 3d089df
 *   this rule counted 67 authored pages, of which 60 lacked a description.
 *
 * Checks:
 *   1. every authored page has a non-empty `description`
 *   2. `audience`, `status`, `last_verified` use the enums/format in source.config.ts
 *   3. every `capability_ids` entry exists in the generated capability map
 *   4. every page the map cites in developer_docs declares that id in capability_ids
 *      (run with --write to insert the missing ids; the map is the source, the page
 *      field is the derived copy that lets the page be filtered without the map)
 *
 * Run after generate-capability-map.mjs.
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

const MAP_PATH = join(ROOT, 'lib', 'generated', 'capabilities.json');
if (!existsSync(MAP_PATH)) {
  console.error('check-frontmatter: lib/generated/capabilities.json is missing; run `npm run generate` first');
  process.exit(1);
}
const map = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
const DEVELOPER_SITE = map.sources.developer_docs;
const knownIds = new Set(map.capabilities.map((c) => c.id));

// page url -> set of capability ids the map says it belongs to
const expectedIds = new Map();
for (const c of map.capabilities) {
  for (const url of c.developer_docs) {
    const path = url.replace(DEVELOPER_SITE, '');
    const set = expectedIds.get(path) ?? new Set();
    set.add(c.id);
    expectedIds.set(path, set);
  }
}

const AUDIENCES = new Set(['merchant', 'developer']);
const STATUSES = new Set(['available', 'beta', 'deprecated']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const files = execFileSync('git', ['ls-files', '--', 'content/docs/**/*.md', 'content/docs/**/*.mdx', 'content/docs/*.md', 'content/docs/*.mdx'], {
  cwd: ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

function pageUrl(file) {
  return (
    '/docs/' +
    file
      .replace(/^content\/docs\//, '')
      .replace(/\.(md|mdx)$/, '')
      .replace(/(^|\/)index$/, '')
  ).replace(/\/$/, '') || '/docs';
}

function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  return { raw: m[1], end: m[0].length };
}

const errors = [];
let missingDescriptions = 0;
let rewritten = 0;

for (const file of files) {
  const abs = join(ROOT, file);
  const text = readFileSync(abs, 'utf8');
  const fm = splitFrontmatter(text);
  if (!fm) {
    errors.push(`${file}: no frontmatter`);
    continue;
  }
  let data;
  try {
    data = loadYaml(fm.raw) ?? {};
  } catch (e) {
    errors.push(`${file}: frontmatter is not valid YAML (${e.message.split('\n')[0]})`);
    continue;
  }

  if (typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push(`${file}: missing description`);
    missingDescriptions += 1;
  }
  if (data.audience !== undefined) {
    if (!Array.isArray(data.audience) || data.audience.some((a) => !AUDIENCES.has(a)))
      errors.push(`${file}: audience must be a list drawn from merchant, developer`);
  }
  if (data.status !== undefined && !STATUSES.has(data.status))
    errors.push(`${file}: status must be one of available, beta, deprecated`);
  if (data.last_verified !== undefined && !DATE_RE.test(String(data.last_verified)))
    errors.push(`${file}: last_verified must be YYYY-MM-DD`);

  const declared = Array.isArray(data.capability_ids) ? data.capability_ids.map(String) : [];
  for (const id of declared) if (!knownIds.has(id)) errors.push(`${file}: unknown capability id ${id}`);

  const expected = expectedIds.get(pageUrl(file)) ?? new Set();
  const missing = [...expected].filter((id) => !declared.includes(id));
  if (missing.length > 0) {
    if (WRITE) {
      const all = [...new Set([...declared, ...missing])];
      const line = `capability_ids: [${all.join(', ')}]`;
      const raw = data.capability_ids === undefined
        ? fm.raw.replace(/^(description:[^\n]*)$/m, `$1\n${line}`)
        : fm.raw.replace(/^capability_ids:[^\n]*(\n\s+-[^\n]*)*/m, line);
      if (raw === fm.raw) {
        errors.push(`${file}: could not insert capability_ids (no description line to anchor on)`);
      } else {
        writeFileSync(abs, `---\n${raw}\n---\n` + text.slice(fm.end));
        rewritten += 1;
      }
    } else {
      errors.push(`${file}: capability map cites this page for ${missing.join(', ')} but capability_ids does not declare it (run check-frontmatter --write)`);
    }
  }
}

console.log(`check-frontmatter: ${files.length} authored pages checked${WRITE ? `, ${rewritten} rewritten` : ''}`);
if (errors.length > 0) {
  console.error(`check-frontmatter: FAIL (${errors.length} problems, ${missingDescriptions} missing descriptions)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('check-frontmatter: OK');
