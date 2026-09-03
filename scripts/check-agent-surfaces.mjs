/**
 * Post-build assertions for the agent entry surfaces.
 * Run after `npm run build`; exits 1 on the first failing group.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'out');

const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

// llms.txt
const llmsPath = join(OUT, 'llms.txt');
const llms = read(llmsPath);
check(llms !== null, 'out/llms.txt does not exist');
if (llms !== null) {
  const firstLine = llms.split('\n')[0];
  check(firstLine === '# Next Commerce Developer Docs', `llms.txt first line is ${JSON.stringify(firstLine)}`);
  const relative = llms.match(/\]\(\//g) ?? [];
  check(relative.length === 0, `llms.txt has ${relative.length} relative markdown link(s)`);
  for (const needle of [
    'https://docs.nextcommerce.com/llms.txt',
    'https://docs.nextcommerce.com/changelog',
    '/api/admin/2024-04-01.yaml',
    '/docs/webhooks',
    'AGENTS.md',
  ]) {
    check(llms.includes(needle), `llms.txt is missing ${JSON.stringify(needle)}`);
  }
}

// 404 page
const notFound = read(join(OUT, '404.html'));
check(notFound !== null, 'out/404.html does not exist');
if (notFound !== null) {
  for (const needle of ['/llms.txt', 'https://docs.nextcommerce.com']) {
    check(notFound.includes(needle), `404.html is missing ${JSON.stringify(needle)}`);
  }
}

// stats.json and the home page
const statsPath = join(ROOT, 'lib', 'generated', 'stats.json');
const statsRaw = read(statsPath);
check(statsRaw !== null, 'lib/generated/stats.json does not exist');
if (statsRaw !== null) {
  const stats = JSON.parse(statsRaw);
  check(stats.adminApiOperations > 0, `stats.adminApiOperations is ${stats.adminApiOperations}`);
  check(stats.webhookEvents > 0, `stats.webhookEvents is ${stats.webhookEvents}`);
  const index = read(join(OUT, 'index.html'));
  check(index !== null, 'out/index.html does not exist');
  if (index !== null) {
    const needle = `${stats.webhookEvents} Webhook Events`;
    check(index.includes(needle), `index.html is missing ${JSON.stringify(needle)}`);
  }
}

if (failures.length > 0) {
  console.error('check-agent-surfaces: FAIL');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('check-agent-surfaces: OK');
