/**
 * Generates lib/generated/stats.json with counts shown on the home page.
 * Run before `next build` — wired into the "dev" and "build" npm scripts.
 *
 *   adminApiOperations — operations in the stable Admin API spec
 *   webhookEvents      — entries under `webhooks` in the same spec (the source the
 *                        webhook reference pages are generated from). The event table
 *                        on content/docs/webhooks/index.mdx is cross-checked and a
 *                        mismatch fails the build, so the two cannot drift.
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

const spec = loadYaml(readFileSync(SPEC_PATH, 'utf8'));

function countOperations() {
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

function countSpecWebhooks() {
  return Object.keys(spec?.webhooks ?? {}).length;
}

// Rows in the event table whose first cell is a backticked event name, e.g. `order.created`.
function countTableWebhooks(mdxPath) {
  const lines = readFileSync(mdxPath, 'utf8').split('\n');
  const row = /^\|\s*`[^`|]+\.[^`|]+`\s*\|/;
  return lines.filter((line) => row.test(line)).length;
}

const stats = {
  adminApiOperations: countOperations(),
  webhookEvents: countSpecWebhooks(),
  specVersion: SPEC_VERSION,
};

const tableCount = countTableWebhooks(WEBHOOKS_PATH);
if (tableCount !== stats.webhookEvents) {
  console.error(
    `generate-stats: the spec defines ${stats.webhookEvents} webhook events but the table on content/docs/webhooks/index.mdx lists ${tableCount}. Update the table.`,
  );
  process.exit(1);
}

if (stats.adminApiOperations === 0 || stats.webhookEvents === 0) {
  console.error('generate-stats: a count came back as zero', stats);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(stats, null, 2) + '\n');
console.log(`Generated ${OUT_PATH}:`, stats);
