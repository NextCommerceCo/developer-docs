/**
 * Generates lib/generated/stats.json with counts shown on the home page.
 * Run before `next build` — wired into the "dev" and "build" npm scripts.
 *
 *   adminApiOperations — operations in the stable Admin API spec
 *   webhookEvents      — rows in the event table on content/docs/webhooks/index.mdx
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SPEC_VERSION = '2024-04-01';
const SPEC_PATH = join(ROOT, 'public', 'api', 'admin', `${SPEC_VERSION}.yaml`);
const WEBHOOKS_PATH = join(ROOT, 'content', 'docs', 'webhooks', 'index.mdx');
const OUT_DIR = join(ROOT, 'lib', 'generated');
const OUT_PATH = join(OUT_DIR, 'stats.json');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

function countOperations(specPath) {
  const spec = loadYaml(readFileSync(specPath, 'utf8'));
  const paths = spec?.paths ?? {};
  let count = 0;
  for (const item of Object.values(paths)) {
    if (!item || typeof item !== 'object') continue;
    for (const method of HTTP_METHODS) {
      if (item[method]) count += 1;
    }
  }
  return count;
}

function countWebhookEvents(mdxPath) {
  const lines = readFileSync(mdxPath, 'utf8').split('\n');
  // Table rows whose first cell is a backticked event name, e.g. `order.created`.
  const row = /^\|\s*`[a-z0-9_]+\.[a-z0-9_.]+`\s*\|/;
  return lines.filter((line) => row.test(line)).length;
}

const stats = {
  adminApiOperations: countOperations(SPEC_PATH),
  webhookEvents: countWebhookEvents(WEBHOOKS_PATH),
  specVersion: SPEC_VERSION,
};

if (stats.adminApiOperations === 0 || stats.webhookEvents === 0) {
  console.error('generate-stats: a count came back as zero', stats);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(stats, null, 2) + '\n');
console.log(`Generated ${OUT_PATH}:`, stats);
