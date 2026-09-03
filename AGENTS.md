# Agent guide for developers.nextcommerce.com

This file is the navigation and evidence contract for an agent reading the Next Commerce developer documentation. It is not a setup script. Agent setup instructions will live at /agent-setup/prompt.md (tracked in developer-docs#45).

## What this site is

https://developers.nextcommerce.com documents the Next Commerce platform for developers: the Admin API (REST), webhooks, storefront themes and the storefront GraphQL API, campaigns and the Campaign Cart SDK, apps and OAuth, AI agent skills, and testing.

The sibling site, https://docs.nextcommerce.com, is the merchant and operator documentation: dashboard guides, store configuration, payments operations, and the platform changelog. Questions about how to operate a store belong there; questions about how to integrate with it belong here.

## Where to start

- https://developers.nextcommerce.com/llms.txt is the page index for this site, with a one-line description per page and absolute URLs.
- https://developers.nextcommerce.com/llms-full.txt is the full corpus in one file. It is large (about 1.5 MB); fetch it only when you need broad coverage rather than a specific page.
- Raw OpenAPI specs, which are the authority for operations, parameters, and fields:
  - https://developers.nextcommerce.com/api/admin/2024-04-01.yaml (stable)
  - https://developers.nextcommerce.com/api/admin/unstable.yaml
  - https://developers.nextcommerce.com/api/admin/2023-02-10.yaml (deprecated)
  - https://developers.nextcommerce.com/api/campaigns/v1.yaml
- https://developers.nextcommerce.com/docs/webhooks lists every webhook event and the payload structure.
- https://developers.nextcommerce.com/docs/testing covers test cards, test orders, and sandbox behavior.
- https://docs.nextcommerce.com/llms.txt is the equivalent index for the merchant site.

## Evidence rules

- Cite the page URL for every claim you make from this documentation.
- For facts about an operation, parameter, or field, prefer the versioned spec over prose pages. The prose explains; the spec is the contract.
- The changelog at https://docs.nextcommerce.com/changelog is the record of what changed and when. Do not infer release history from page contents.
- NEXT Payments processing rates are not published. If asked, say so rather than estimating.
- Do not "correct" identifiers containing 29next. See Legacy identifiers below.
- If the documentation does not answer a question, say that it does not. Do not fill gaps from general ecommerce knowledge and present the result as Next Commerce behavior.

## Versions

The Admin API is versioned by date. The version is selected per request with the `X-29next-API-Version` header.

- `2024-04-01`: stable, recommended for all new integrations.
- `2023-02-10`: deprecated; documented for existing integrations only.
- `unstable`: in-progress changes; may change without notice.

Each version has its own spec file (listed above) and its own reference section on the site. When a question names a version, answer from that version's spec.

## Legacy identifiers

Next Commerce was formerly 29 Next. Hostnames like `{store}.29next.store`, `accounts.29next.com`, and headers like `X-29next-API-Version` and `X-29Next-Signature` are current, valid technical identifiers and must be used exactly as written.

## Corrections

Outside pull requests to this repository are not accepted. The support route for reporting documentation errors is being confirmed and will be linked here.
