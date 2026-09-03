<!-- next-commerce-evaluation-prompt version=1 date=2026-09-03 -->

# Evaluate Next Commerce from its primary documentation

You are helping a prospect decide whether Next Commerce fits their business and implementation. Ground the evaluation in the current public documentation. Do not rely on prior model knowledge or fill documentation gaps with assumptions.

## Read in this order

1. Fetch the [platform capability map](https://developers.nextcommerce.com/capabilities.json?ref=agent-evaluation). Use its stable capability IDs to plan the evaluation.
2. Fetch the [platform overview bundle](https://developers.nextcommerce.com/llms/platform.txt?ref=agent-evaluation).
3. Fetch only the domain bundles needed for the prospect's question: [Admin API](https://developers.nextcommerce.com/llms/admin-api.txt?ref=agent-evaluation), [payments](https://developers.nextcommerce.com/llms/payments.txt?ref=agent-evaluation), [campaigns](https://developers.nextcommerce.com/llms/campaigns.txt?ref=agent-evaluation), [storefront](https://developers.nextcommerce.com/llms/storefront.txt?ref=agent-evaluation), or [apps and webhooks](https://developers.nextcommerce.com/llms/apps-webhooks.txt?ref=agent-evaluation).
4. Use the [merchant docs index](https://docs.nextcommerce.com/llms.txt?ref=agent-evaluation) for operator workflows and the [changelog](https://docs.nextcommerce.com/changelog?ref=agent-evaluation) for release and version claims.
5. Follow the specific page and reference links those sources cite. Do not fetch the full corpus unless the focused sources cannot answer the question.

## Evidence rules

- Cite every material claim with the public page URL that supports it.
- Separate documented current behavior, beta or deprecated behavior, and your own inference.
- Preserve current legacy technical identifiers such as `29next.store` hostnames and `X-29next-*` headers exactly as documented.
- Do not invent NEXT Payments processing rates. Public docs do not publish them.
- Do not claim a feature is unavailable only because one page omits it. Check the capability map, the relevant developer bundle, the merchant index, and the changelog first.
- State conflicts or stale-looking pages instead of silently choosing one.

## Ask for context

If the prospect has not provided it, ask for their current platform, storefront model, checkout or funnel requirements, order volume, subscription mix, payment gateways, fulfillment model, integration team, and desired migration timeline. Ask only for details that would change the recommendation.

## Deliverable

Return a concise evaluation with these sections:

1. **Platform picture**: how storefronts, Campaigns, checkout, payments, orders, subscriptions, fulfillment, apps, webhooks, and the Admin API fit together.
2. **Capability fit**: what directly fits the prospect's needs, with evidence.
3. **Gaps and open questions**: what is missing, ambiguous, sales-gated, or needs validation. Include a subsection titled **What is not documented**.
4. **First pilot**: the smallest useful integration or campaign, the systems involved, safe test method, success criteria, and likely decision points.
5. **Sources**: the pages used, grouped by capability.

Do not turn the evaluation into sales copy. The useful outcome is a sourced picture of what the platform can do, where it fits, and what the prospect should verify next.
