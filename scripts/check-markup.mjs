/**
 * Markup rules that keep pages rendering the same way across the docs sites.
 *
 *   1. headings are plain text: no **bold** inside a heading
 *   2. the page title is the only h1, so body headings start at h2 and
 *      never skip a level (h2 then h4)
 *   3. no empty headings, and the first heading doesn't repeat the page title
 *   4. a Callout heading goes in its title prop, not a bold first line
 *      (checked when the opening tag sits on its own line)
 *   5. bold markers inside link text are balanced
 *
 * Imported snippets are checked from h3, because they render under an h2.
 * Only git-tracked pages are read: the generated reference trees are ignored,
 * and the committed GraphQL reference is regenerated from the schema.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = execFileSync('git', ['ls-files', 'content/docs', 'content/_snippets'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.mdx?$/.test(f) && !f.startsWith('content/docs/storefront/graphql/'));

const errors = [];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

for (const rel of files) {
  const lines = readFileSync(join(ROOT, rel), 'utf8').split('\n');
  const snippet = rel.includes('_snippets');
  let i = 0;
  let title = '';
  if (lines[0] === '---') {
    i = lines.indexOf('---', 1) + 1;
    const m = lines.slice(1, i).map((l) => /^title:\s*["']?(.*?)["']?\s*$/.exec(l)).find(Boolean);
    if (m) title = m[1];
  }
  let inCode = false;
  let prev = snippet ? 2 : 1;
  let first = true;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
    if (inCode) continue;
    const at = `${rel}:${i + 1}`;
    const heading = /^(#{1,6})(?:\s+(.*))?$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = (heading[2] ?? '').trim();
      if (!text) errors.push(`${at} empty heading`);
      if (first && title && norm(text) === norm(title)) errors.push(`${at} heading repeats the page title: ${text}`);
      if (text.includes('**')) errors.push(`${at} bold inside a heading: ${line.trim()}`);
      if (level > prev + 1) errors.push(`${at} h${level} follows h${prev}; use h${prev + 1}`);
      if (level === 1) errors.push(`${at} h1 in the body; the frontmatter title is the page h1`);
      prev = level;
      first = false;
      continue;
    }
    for (const link of line.matchAll(/\[([^\]\n]*)\]\(/g)) {
      if ((link[1].match(/\*\*/g) ?? []).length % 2) errors.push(`${at} unbalanced ** in link text: [${link[1]}]`);
    }
    if (/^<Callout\b(?![^>]*\btitle=)[^>]*>\s*$/.test(line)) {
      const next = lines.slice(i + 1).find((l) => l.trim() !== '');
      if (next && /^\s*\*\*[^*]+\*\*\s*$/.test(next)) {
        errors.push(`${at} Callout opens with a bold line; pass it as title="${next.trim().replace(/\*\*/g, '')}"`);
      }
    }
  }
}

if (errors.length) {
  console.error(`check-markup: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('check-markup: ok');
