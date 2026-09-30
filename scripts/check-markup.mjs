/**
 * Markup rules that keep pages rendering the same way across the docs sites.
 *
 *   1. headings are plain text: no **bold** inside a heading
 *   2. the page title is the only h1, so body headings start at h2 and
 *      never skip a level (h2 then h4)
 *   3. a Callout heading goes in its title prop, not a bold first line
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

for (const rel of files) {
  const lines = readFileSync(join(ROOT, rel), 'utf8').split('\n');
  const snippet = rel.includes('_snippets');
  let i = 0;
  if (lines[0] === '---') {
    i = lines.indexOf('---', 1) + 1;
  }
  let inCode = false;
  let prev = snippet ? 2 : 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
    if (inCode) continue;
    const at = `${rel}:${i + 1}`;
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      if (heading[2].includes('**')) errors.push(`${at} bold inside a heading: ${line.trim()}`);
      if (level > prev + 1) errors.push(`${at} h${level} follows h${prev}; use h${prev + 1}`);
      if (level === 1) errors.push(`${at} h1 in the body; the frontmatter title is the page h1`);
      prev = level;
      continue;
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
