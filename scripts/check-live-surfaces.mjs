/**
 * Live checks against the two deployed documentation sites. Network only; no
 * build needed. Exit 1 on any failure. Run by .github/workflows/live-surfaces.yml
 * on a schedule and by `npm run check-live-surfaces`.
 *
 * Two groups:
 *   1. Entry surfaces: sitemap, robots, llms.txt (absolute and reciprocal links),
 *      capability map and bundles, semantic text output, 404 recovery links,
 *      merchant search index budget.
 *   2. The deterministic half of the 10-question prospect-agent smoke set
 *      (executive packet docs-agent-accessibility-review, step 1). Each check is
 *      a fact a page must state, not a judgement about an answer; the judged
 *      half still needs a cold agent run.
 *
 * Override hosts with DEVELOPER_SITE / MERCHANT_SITE to point at a preview.
 */

const DEV = (process.env.DEVELOPER_SITE ?? 'https://developers.nextcommerce.com').replace(/\/$/, '');
const MERCHANT = (process.env.MERCHANT_SITE ?? 'https://docs.nextcommerce.com').replace(/\/$/, '');
const SEARCH_INDEX_BUDGET_BYTES = 6_000_000; // mirrors docs/scripts/check-search-budget.mjs
const BUNDLE_BUDGET_BYTES = 400_000; // mirrors scripts/check-agent-surfaces.mjs

const failures = [];
const passes = [];
function check(name, condition, detail = '') {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

const cache = new Map();
// A network failure is a failed check, not a crash: status 0 with the error in the body.
async function fetchText(url) {
  if (cache.has(url)) return cache.get(url);
  let out;
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'next-docs-live-check/1' },
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.text();
    out = { status: res.status, headers: res.headers, body, bytes: Buffer.byteLength(body, 'utf8') };
  } catch (error) {
    out = { status: 0, headers: new Headers(), body: '', bytes: 0, error: error?.cause?.code ?? error?.name ?? String(error) };
  }
  cache.set(url, out);
  return out;
}

// Bounded concurrency so ~200 link checks do not open ~200 connections at once.
// Side effects only; callers record results themselves. An exception from one
// item is recorded as a failed check and does not stop the other workers.
async function forEachLimit(items, limit, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        try {
          await fn(item);
        } catch (error) {
          failures.push(`check for ${String(item)} threw: ${error?.message ?? error}`);
        }
      }
    }),
  );
}

async function page(url) {
  const r = await fetchText(url);
  check(`200 ${url}`, r.status === 200, `status ${r.status}${r.error ? ` (${r.error})` : ''}`);
  return r;
}

// ---- 1. entry surfaces -------------------------------------------------------

for (const site of [DEV, MERCHANT]) {
  const sitemap = await page(`${site}/sitemap.xml`);
  check(`${site} sitemap is XML`, sitemap.body.trimStart().startsWith('<?xml') && sitemap.body.includes('<urlset'));
  check(`${site} sitemap lists /docs pages`, sitemap.body.includes(`${site}/docs`));
  const robots = await page(`${site}/robots.txt`);
  check(`${site} robots declares the sitemap`, /sitemap:\s*\S+sitemap\.xml/i.test(robots.body), robots.body.slice(0, 200));

  const llms = await page(`${site}/llms.txt`);
  check(`${site} llms.txt is text`, (llms.headers.get('content-type') ?? '').startsWith('text/plain'));
  check(`${site} llms.txt has no relative markdown links`, !/\]\(\//.test(llms.body));
  const other = site === DEV ? MERCHANT : DEV;
  check(`${site} llms.txt links the sibling site`, llms.body.includes(other));
  check(`${site} llms.txt links the capability map`, llms.body.includes(`${DEV}/capabilities.json`));
  check(`${site} llms.txt links a domain bundle`, llms.body.includes(`${DEV}/llms/`));

  const notFound = await fetchText(`${site}/this-page-does-not-exist-${Date.now()}`);
  check(`${site} unknown path returns 404`, notFound.status === 404, `status ${notFound.status}`);
  check(`${site} 404 links llms.txt`, notFound.body.includes('/llms.txt'));
  check(`${site} 404 links the sibling site`, notFound.body.includes(other));
}

const map = await page(`${DEV}/capabilities.json`);
let capabilityMap = null;
try {
  capabilityMap = JSON.parse(map.body);
} catch {
  check('capabilities.json parses', false);
}
if (capabilityMap) {
  check('capabilities.json has 8+ capabilities', capabilityMap.capabilities.length >= 8);
  const ids = new Set(capabilityMap.capabilities.map((c) => c.id));
  for (const id of ['testing', 'subscriptions', 'payments-gateways', 'webhooks', 'campaigns', 'storefront-themes', 'admin-api', 'legacy-identifiers']) {
    check(`capabilities.json has ${id}`, ids.has(id));
  }
  const capPage = await page(`${DEV}/docs/capabilities`);
  for (const c of capabilityMap.capabilities) check(`capability page anchors ${c.id}`, capPage.body.includes(`id="${c.id}"`));

  // Every link the map makes must resolve on the live sites.
  const linked = new Set();
  for (const c of capabilityMap.capabilities) {
    for (const u of [...c.operator_docs, ...c.developer_docs]) linked.add(u);
    for (const op of c.api_operations) if (op.url) linked.add(op.url);
    for (const w of c.webhooks) if (w.url) linked.add(w.url);
  }
  let broken = 0;
  await forEachLimit([...linked], 8, async (u) => {
    const r = await fetchText(u);
    if (r.status !== 200) {
      broken += 1;
      failures.push(`map link ${u} returned ${r.status}${r.error ? ` (${r.error})` : ''}`);
    }
  });
  check(`all ${linked.size} capability-map links resolve`, broken === 0);

  for (const b of capabilityMap.bundles) {
    const r = await page(b.url);
    check(`bundle ${b.id} is plain text`, (r.headers.get('content-type') ?? '').startsWith('text/plain'));
    check(`bundle ${b.id} within ${BUNDLE_BUDGET_BYTES} bytes`, r.bytes <= BUNDLE_BUDGET_BYTES, `${r.bytes} bytes`);
    const prose = r.body.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '');
    check(`bundle ${b.id} has no MDX residue`, !/^(import|export)\s|<\/?[A-Z][A-Za-z0-9]*[\s>/]/m.test(prose));
    check(`bundle ${b.id} is not framework serialization`, !r.body.includes('self.__next_f') && !r.body.startsWith('0:'));
    check(`bundle ${b.id} has a Pages section`, r.body.includes('## Pages'));
  }
}

const full = await page(`${DEV}/llms-full.txt`);
check('llms-full.txt is text', (full.headers.get('content-type') ?? '').startsWith('text/plain'));

const search = await fetchText(`${MERCHANT}/api/search`);
check('merchant search index responds', search.status === 200, `status ${search.status}`);
check(`merchant search index within ${SEARCH_INDEX_BUDGET_BYTES} bytes`, search.bytes <= SEARCH_INDEX_BUDGET_BYTES, `${search.bytes} bytes`);
check('merchant search index is cached for an hour', /max-age=3600/.test(search.headers.get('cache-control') ?? ''), search.headers.get('cache-control') ?? 'no cache-control');
check('merchant search index mentions subscriptions', /subscription/i.test(search.body));

// ---- 2. deterministic half of the smoke set --------------------------------

const testing = await page(`${DEV}/docs/testing`);
check('Q2 testing page says there is no separate sandbox', /no separate sandbox/i.test(testing.body));
check('Q2 testing page lists the test card', testing.body.includes('6011111111111117'));
const testOrders = await page(`${MERCHANT}/docs/manage/orders/test-orders`);
check('Q2 merchant test-orders page exists and names test cards', /test (order )?card/i.test(testOrders.body));

const themeKit = await page(`${DEV}/docs/storefront/themes/theme-kit`);
check('Q3 theme kit page names ntk', /\bntk\b/.test(themeKit.body));
const themesOverview = await page(`${DEV}/docs/storefront/themes`);
check('Q3 themes overview links its own Theme Kit page', themesOverview.body.includes('/docs/storefront/themes/theme-kit'));

const webhooks = await page(`${DEV}/docs/webhooks`);
check('Q4 webhooks page explains renewals via transaction.created', webhooks.body.includes('transaction.created') && webhooks.body.includes('billing_cycle'));
check('Q4 webhooks page does not document a subscription.renewed event', !webhooks.body.includes('subscription.renewed'));
const subGuide = await page(`${DEV}/docs/admin-api/guides/subscription-management`);
check('Q4 subscription guide exists', subGuide.status === 200);

const bankcard = await page(`${DEV}/docs/admin-api/guides/payment-methods/bankcard`);
check('Q5 bankcard guide documents payment_gateway selection', bankcard.body.includes('payment_gateway'));
const externalCheckout = await page(`${DEV}/docs/admin-api/guides/external-checkout`);
check('Q5 external checkout guide cross-references gateway selection', externalCheckout.body.includes('payment_gateway'));
await page(`${MERCHANT}/docs/features/payments`);

const adminApi = await page(`${DEV}/docs/admin-api`);
check('Q6 Admin API page explains the 29next legacy name', /formerly 29 ?Next/i.test(adminApi.body));
check('Q6 developer llms.txt carries the legacy identifiers note', /Legacy identifiers/.test((await fetchText(`${DEV}/llms.txt`)).body));
check('Q6 merchant llms.txt carries the legacy identifiers note', /29 ?Next/.test((await fetchText(`${MERCHANT}/llms.txt`)).body));

const nextPayments = await page(`${MERCHANT}/docs/features/payments/gateways/next-payments`);
check('Q7 NEXT Payments page publishes no processing rate', !/\d+(\.\d+)?\s?%\s*(\+|plus)?\s*\$?\d*\.?\d*\s*(per|\/)\s*transaction/i.test(nextPayments.body));

check('Q8 Admin API page names 2024-04-01 as stable', adminApi.body.includes('2024-04-01') && /stable/i.test(adminApi.body));
await page(`${MERCHANT}/changelog`);
const oldRef = await fetchText(`${DEV}/docs/admin-api/reference/?v=2024-04-01`);
check('Q8 changelog\'s old reference URL redirects or resolves', [200, 301, 302, 308].includes(oldRef.status), `status ${oldRef.status}`);

if (capabilityMap) {
  const webhookCap = capabilityMap.capabilities.find((c) => c.id === 'webhooks');
  const count = webhookCap?.webhooks.length ?? 0;
  check('Q9 webhook count is 24 in the map', count === 24, `${count}`);
  check('Q9 home page states the same webhook count as the map', (await page(DEV)).body.includes(`${count} Webhook Events`));
  check('Q9 dispute events exist', webhookCap?.webhooks.some((w) => w.event === 'dispute.created'));
}

const campaigns = await page(`${DEV}/docs/campaigns`);
check('Q10 campaigns page exists', campaigns.status === 200);
await page(`${MERCHANT}/docs/apps/campaigns-app`);
await page(`${DEV}/docs/storefront/checkout-links`);

// ---- report -----------------------------------------------------------------

console.log(`check-live-surfaces: ${passes.length} passed, ${failures.length} failed`);
for (const f of failures) console.error(`  - ${f}`);
process.exit(failures.length > 0 ? 1 : 0);
