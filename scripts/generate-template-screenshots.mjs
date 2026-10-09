/**
 * Captures the campaign template previews to public/assets/templates/{slug}.png.
 *
 * One 1280x960 screenshot per template, taken from the page each card links to
 * in components/campaign-templates-grid.tsx. Committed to git; re-run by hand
 * when the templates change:
 *   node scripts/generate-template-screenshots.mjs
 *
 * Requires google-chrome on the PATH.
 */

import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/assets/templates');

const grid = readFileSync(join(ROOT, 'components/campaign-templates-grid.tsx'), 'utf8');
const base = grid.match(/const BASE = '([^']+)'/)[1];
const templates = [...grid.matchAll(/slug: '([^']+)'[\s\S]*?link: `\$\{BASE\}([^`]+)`/g)];

mkdirSync(OUT, { recursive: true });

for (const [, slug, path] of templates) {
  execFileSync('google-chrome', [
    '--headless=new',
    '--hide-scrollbars',
    '--window-size=1280,960',
    '--virtual-time-budget=8000',
    `--screenshot=${join(OUT, `${slug}.png`)}`,
    `${base}${path}`,
  ], { stdio: 'ignore' });
  console.log(`${slug}.png  ${base}${path}`);
}
