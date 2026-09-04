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
 */

import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const AUDIENCES = new Set(['merchant', 'developer']);
const STATUSES = new Set(['available', 'beta', 'deprecated']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const files = execFileSync('git', ['ls-files', '--', 'content/docs/**/*.md', 'content/docs/**/*.mdx', 'content/docs/*.md', 'content/docs/*.mdx'], {
  cwd: ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  return m[1];
}

const errors = [];
let missingDescriptions = 0;

for (const file of files) {
  const abs = join(ROOT, file);
  const text = readFileSync(abs, 'utf8');
  const frontmatter = splitFrontmatter(text);
  if (!frontmatter) {
    errors.push(`${file}: no frontmatter`);
    continue;
  }
  let data;
  try {
    data = loadYaml(frontmatter) ?? {};
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

}

console.log(`check-frontmatter: ${files.length} authored pages checked`);
if (errors.length > 0) {
  console.error(`check-frontmatter: FAIL (${errors.length} problems, ${missingDescriptions} missing descriptions)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('check-frontmatter: OK');
