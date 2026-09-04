/**
 * Post-build assertions for the agent entry surfaces.
 * Run after `npm run build`; exits 1 on the first failing group.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'out');
const capabilitySource = loadYaml(readFileSync(join(ROOT, 'content', 'capabilities.yaml'), 'utf8'));
const authoredCapabilities = Array.isArray(capabilitySource?.capabilities) ? capabilitySource.capabilities : [];

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
  const pageSections = llms.slice(llms.indexOf('\n## Overview\n')).split(/^## /m).slice(1);
  for (const section of pageSections) {
    const lines = section.split('\n').filter((line) => line.startsWith('- ['));
    const sorted = [...lines].sort((a, b) => a.localeCompare(b));
    check(lines.every((line, index) => line === sorted[index]), `llms.txt section ${JSON.stringify(section.split('\n')[0])} is not sorted`);
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
    for (const needle of [
      `<span>${stats.adminApiOperations} REST Endpoints</span>`,
      `<span>${stats.webhookEvents} Webhook Events</span>`,
    ]) {
      check(index.includes(needle), `index.html is missing ${JSON.stringify(needle)}`);
    }
  }
}

// Capability map: the JSON served at /capabilities.json and its schema remain
// machine-readable surfaces. The former human-readable projection stays absent.
const capPath = join(OUT, 'capabilities.json');
const capRaw = read(capPath);
check(capRaw !== null, 'out/capabilities.json does not exist');
let capabilityMap = null;
if (capRaw !== null) {
  try {
    capabilityMap = JSON.parse(capRaw);
  } catch (e) {
    check(false, `capabilities.json is not valid JSON: ${e.message}`);
  }
}
check(read(join(OUT, 'capabilities.schema.json')) !== null, 'out/capabilities.schema.json does not exist');
if (capabilityMap) {
  check(capabilityMap.version === 1, `capabilities.json version is ${capabilityMap.version}`);
  check(Array.isArray(capabilityMap.capabilities) && capabilityMap.capabilities.length >= 8, 'capabilities.json has fewer than 8 capabilities');
  check(Array.isArray(capabilityMap.bundles) && capabilityMap.bundles.length === 6, 'capabilities.json does not list 6 bundles');
  const payments = capabilityMap.capabilities.find((c) => c.id === 'payments-gateways');
  const disputes = capabilityMap.capabilities.find((c) => c.id === 'disputes');
  const authoredOperationIds = (id) => authoredCapabilities.find((c) => c.id === id)?.api_operations ?? [];
  const outputOperationIds = (capability) => capability?.api_operations.map((operation) => operation.id) ?? [];
  for (const capability of [payments, disputes]) {
    const expected = authoredOperationIds(capability?.id);
    const actual = outputOperationIds(capability);
    check(
      actual.length === expected.length && expected.every((id) => actual.includes(id)),
      `${capability?.id ?? 'missing capability'} operations differ between capabilities.yaml and capabilities.json`,
    );
  }
  check(!payments?.api_operations.some((op) => op.id.startsWith('disputes')), 'payments-gateways still contains dispute operations');
  check(disputes?.api_operations.every((op) => op.id.startsWith('disputes')), 'disputes contains a non-dispute operation');
  const capPage = read(join(OUT, 'docs', 'capabilities.html')) ?? read(join(OUT, 'docs', 'capabilities', 'index.html'));
  check(capPage === null, 'out/docs/capabilities should not be built');
  for (const c of capabilityMap.capabilities) {
    for (const url of c.developer_docs) {
      const rel = url.replace('https://developers.nextcommerce.com', '');
      const html = read(join(OUT, `${rel}.html`)) ?? read(join(OUT, rel, 'index.html'));
      check(html !== null, `developer page ${rel} cited by ${c.id} was not built`);
    }
  }
}

// Agent setup: raw Markdown and human guide are generated from one source.
const setupPrompt = read(join(OUT, 'agent-setup', 'prompt.md'));
check(setupPrompt !== null, 'out/agent-setup/prompt.md does not exist');
if (setupPrompt !== null) {
  check(setupPrompt.startsWith('<!-- next-commerce-agent-setup version='), 'agent setup prompt has no version marker');
  check(!/\]\(\//.test(setupPrompt), 'agent setup prompt contains a relative Markdown link');
  for (const needle of [
    '# Start a Campaign Page Kit project with an AI agent',
    '## Before writing',
    'npx campaign-init --help',
    'npx campaign-init --non-interactive --json',
    '--template <selected-template>',
    '| GitHub Copilot |',
    '_site/',
    'https://developers.nextcommerce.com/llms.txt?ref=agent-setup',
  ]) {
    check(setupPrompt.includes(needle), `agent setup prompt is missing ${JSON.stringify(needle)}`);
  }
  check(!setupPrompt.includes('--api-key'), 'agent setup prompt asks for an API key during bootstrap');
  check(!setupPrompt.includes('npx skills add'), 'agent setup prompt duplicates the optional skill-install workflow');
  check(!setupPrompt.includes('--template apollo'), 'agent setup prompt silently chooses the Apollo template');
  check(!setupPrompt.includes('agent-starter'), 'agent setup prompt silently chooses a project identity');
}
const setupGuide = read(join(OUT, 'docs', 'agent-setup.html')) ?? read(join(OUT, 'docs', 'agent-setup', 'index.html'));
check(setupGuide !== null, 'out/docs/agent-setup.html does not exist');
if (setupGuide !== null) {
  check(setupGuide.includes('Read https://developers.nextcommerce.com/agent-setup/prompt.md'), 'agent setup guide is missing the one-line instruction');
}

const evaluationPrompt = read(join(OUT, 'evaluate', 'prompt.md'));
check(evaluationPrompt !== null, 'out/evaluate/prompt.md does not exist');
if (evaluationPrompt !== null) {
  check(evaluationPrompt.startsWith('<!-- next-commerce-evaluation-prompt version='), 'evaluation prompt has no version marker');
  check(!/\]\(\//.test(evaluationPrompt), 'evaluation prompt contains a relative Markdown link');
  for (const needle of [
    'https://developers.nextcommerce.com/capabilities.json?ref=agent-evaluation',
    'https://developers.nextcommerce.com/llms/platform.txt?ref=agent-evaluation',
    'https://docs.nextcommerce.com/llms.txt?ref=agent-evaluation',
    'Cite every material claim',
    'What is not documented',
  ]) {
    check(evaluationPrompt.includes(needle), `evaluation prompt is missing ${JSON.stringify(needle)}`);
  }
}

// Domain bundles: plain Markdown, absolute links, bounded size, no MDX residue.
// Budget: 400 KB per bundle. The largest (storefront, 18 pages) is ~200 KB at
// 2026-09-03; the full corpus is ~1.5 MB. Raise the budget deliberately, in this
// file, if a bundle legitimately grows past it.
const BUNDLE_BUDGET_BYTES = 400_000;
const MDX_RESIDUE = /^(import|export)\s|<\/?[A-Z][A-Za-z0-9]*[\s>/]|\{\/\*/m;
// Placeholders like <YOUR API KEY> inside code fences are prose, not components.
function outsideCodeFences(text) {
  return text.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '');
}
if (capabilityMap) {
  for (const b of capabilityMap.bundles) {
    const path = join(OUT, 'llms', `${b.id}.txt`);
    const text = read(path);
    check(text !== null, `out/llms/${b.id}.txt does not exist`);
    if (text === null) continue;
    const bytes = Buffer.byteLength(text, 'utf8');
    check(bytes <= BUNDLE_BUDGET_BYTES, `llms/${b.id}.txt is ${bytes} bytes, over the ${BUNDLE_BUDGET_BYTES} byte budget`);
    check(text.startsWith(`# Next Commerce: ${b.title}`), `llms/${b.id}.txt first line is not the bundle title`);
    check(!MDX_RESIDUE.test(outsideCodeFences(text)), `llms/${b.id}.txt still contains MDX (import/export line or a component tag)`);
    const relative = text.match(/\]\(\//g) ?? [];
    check(relative.length === 0, `llms/${b.id}.txt has ${relative.length} relative markdown link(s)`);
    check(text.includes('## Pages'), `llms/${b.id}.txt has no Pages section`);
    for (const id of b.capabilities) check(text.includes(`(id: ${id})`), `llms/${b.id}.txt does not render capability ${id}`);
  }
  // llms.txt must advertise every bundle and the map, and demote the full corpus.
  if (llms !== null) {
    check(llms.includes('/capabilities.json'), 'llms.txt does not link the capability map');
    for (const b of capabilityMap.bundles) check(llms.includes(b.url), `llms.txt does not link bundle ${b.id}`);
    const bundlesAt = llms.indexOf('## Domain bundles');
    const fullAt = llms.indexOf('/llms-full.txt');
    check(bundlesAt !== -1 && fullAt > bundlesAt, 'llms.txt lists the full corpus before the domain bundles');
  }
}

// Keep machine-only taxonomy out of human recovery navigation.
if (notFound !== null) check(!notFound.includes('/docs/capabilities'), '404.html links the removed capability page');

if (failures.length > 0) {
  console.error('check-agent-surfaces: FAIL');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('check-agent-surfaces: OK');
