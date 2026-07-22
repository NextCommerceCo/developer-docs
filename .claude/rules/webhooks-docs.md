# Webhooks Documentation

## Overview

Webhook reference docs are generated alongside the Admin API docs. The pipeline takes REST API object schemas from the Admin API OpenAPI specs, wraps them in a webhook envelope structure, and generates per-event reference pages with example payloads.

The hand-written webhook overview page at `content/docs/webhooks/index.mdx` is maintained separately and is NOT generated — it contains the events table, payload structure docs, verification guide, and versioning info.

## Generation Pipeline

### Step 1: Python — Schema Generation (`tools/webhooks.py`)

Called by `tools/update_api_docs.py` during spec download. For each webhook event defined in `tools/config.py`:

1. **Resolves the schema** — Looks up the `schema_ref` (e.g. `#/components/schemas/Order`) from the Admin API spec
2. **Cleans the schema** — Removes `readOnly` flags, recursively resolves `$ref`, `allOf`, `oneOf` references (depth limit: 4)
3. **Generates example payload** — Builds realistic JSON example with format-aware defaults (UUIDs, dates, emails, etc.)
4. **Wraps in envelope** — Creates the full webhook payload structure:

```json
{
  "api_version": "2024-04-01",
  "object": "order",
  "data": { ... resolved object schema ... },
  "event_id": "a7a26ff2-...",
  "event_type": "order.created",
  "webhook": { "id": 1, "store": "example", "events": ["order.created"], "target": "https://example.com/webhook/" }
}
```

5. **Injects into spec** — Adds the webhook to the OpenAPI spec's `webhooks` section, which fumadocs-openapi then renders

### Step 2: Node.js — MDX Generation (`scripts/generate-api-docs.mjs`)

1. **`fixWebhookSchemas()`** — Normalizes any malformed schemas from Python output (adds missing `type: object`, fixes array-style types, generates missing examples)
2. **`webhookBeforeWrite()`** — Filters `generateFiles()` output to keep ONLY webhook files (dot-notation filenames like `cart.abandoned.mdx`)
3. **Generates per-event MDX pages** grouped by tag into `content/docs/webhooks/reference/{tag}/`
4. **Writes `meta.json`** with tag ordering from the spec

## Webhook Event Registry

All 24 events are defined in `tools/config.py` `WEBHOOKS` list. Each entry:

```python
{
    "event": "order.created",       # Dot-notation event name
    "object": "order",              # Object type label
    "schema_ref": "#/components/schemas/Order",  # Admin API schema to resolve
    "tag": "orders",                # Sidebar grouping
    "description": "Triggers when a new order is created.",
}
```

**Events by tag:**
- **apps**: `app.uninstalled`
- **carts**: `cart.abandoned`
- **customers**: `customer.created`, `customer.redacted`, `customer.updated`
- **fulfillment**: `fulfillment.created`, `fulfillment.updated`
- **orders**: `order.created`, `order.updated`
- **payments**: `dispute.created`, `dispute.updated`, `gateway.created`, `gateway.updated`, `transaction.created`, `transaction.updated`
- **products**: `product.created`, `product.updated`, `product.deleted`
- **subscriptions**: `subscription.created`, `subscription.updated`
- **store**: `store.updated`
- **support**: `ticket.created`, `ticket.updated`

### Custom Payloads

Some events don't follow their object's schema. These are defined in `CUSTOM_WEBHOOK_EVENT_PAYLOADS`:

- `product.deleted` — Only includes `{ id: integer }` (no full product data since the product is deleted)
- `customer.redacted` — Includes `{ id, email, phone_number, orders, subscriptions }` (GDPR redaction payload, not the full customer schema)

Set `schema_ref: None` in the webhook config and add a custom payload entry.

## Output Structure

```
content/docs/webhooks/
├── index.mdx                    ← Hand-written overview (NOT generated)
├── meta.json                    ← { root: true, pages: ["index", "reference"] }
└── reference/
    ├── apps/
    │   └── app.uninstalled.mdx
    ├── carts/
    │   └── cart.abandoned.mdx
    ├── orders/
    │   ├── order.created.mdx
    │   └── order.updated.mdx
    ├── payments/
    │   ├── dispute.created.mdx
    │   ├── gateway.created.mdx
    │   └── transaction.created.mdx
    ├── 2023-02-10/              ← Legacy version (root: true)
    ├── unstable/                ← Dev version (root: true)
    └── meta.json
```

## Generated MDX Format

```mdx
---
title: order.created
description: Triggers when a new order is created.
full: true
_openapi:
  method: POST
  webhook: true
---
<APIPage document={"public/api/admin/2024-04-01.yaml"} webhooks={[{"name":"order.created","method":"post"}]} />
```

The `APIPage` component renders a two-column layout: webhook payload schema on the left, example JSON payload on the right.

## Key Conventions

- Webhook filenames use **dot notation** (`order.created.mdx`) vs REST endpoints which use camelCase (`ordersCreate.mdx`) — this is how `isWebhookFile()` distinguishes them during generation
- The webhook overview page (`content/docs/webhooks/index.mdx`) is hand-maintained and includes the events table, payload structure, verification code, and versioning docs — do not overwrite it
- Webhook payload `data` schemas mirror the Admin API's object schemas (serializers), so webhook data matches what you'd get from a GET request on the corresponding REST endpoint
- Webhook response codes: `200` = success, `410` = auto-disable the webhook
- Verification: `X-29Next-Signature` header contains HMAC-SHA256 of the payload signed with the webhook signing secret
- Retry policy: up to 10 retries over several days with exponential backoff; failing webhooks trigger admin email notifications and eventual deactivation

## Adding a New Webhook Event

1. Add the event to `tools/config.py` `WEBHOOKS` list with: event name, object type, schema_ref, tag, description
2. If the event has a non-standard payload, add it to `CUSTOM_WEBHOOK_EVENT_PAYLOADS` and set `schema_ref: None`
3. Run `cd tools && python update_api_docs.py` to regenerate the OpenAPI specs with the new webhook
4. Run `npm run generate-api-docs` to generate the webhook MDX page
5. Update the events table in `content/docs/webhooks/index.mdx` with the new event row

## Versioning

Webhook versions follow Admin API versions. Each version gets its own subdirectory with `root: true`:
- Stable (2024-04-01) → `content/docs/webhooks/reference/` (base directory)
- Legacy (2023-02-10) → `content/docs/webhooks/reference/2023-02-10/`
- Unstable → `content/docs/webhooks/reference/unstable/`

The `api_version` field in webhook payloads matches the Admin API version the webhook was configured with.
