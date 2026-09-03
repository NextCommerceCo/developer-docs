# Agent guide for developers.nextcommerce.com

This file is the navigation and evidence contract for an agent reading the Next Commerce developer documentation. It is not a setup script. Agent setup instructions will live at /agent-setup/prompt.md (tracked in developer-docs#45).

## What this site is

https://developers.nextcommerce.com documents the Next Commerce platform for developers: the Admin API (REST), webhooks, storefront themes and the storefront GraphQL API, campaigns and the Campaign Cart SDK, apps and OAuth, AI agent skills, and testing.

The sibling site, https://docs.nextcommerce.com, is the merchant and operator documentation: dashboard guides, store configuration, payments operations, and the platform changelog. Questions about how to operate a store belong there; questions about how to integrate with it belong here.

## Where to start

- https://developers.nextcommerce.com/llms.txt is the page index for this site, with a one-line description per page and absolute URLs. It also lists the domain bundles.
- https://developers.nextcommerce.com/capabilities.json is the platform capability map: one record per capability with a stable id, the merchant and developer pages that document it, its Admin API operations, webhook events, skills, status, and the date its links were last verified. The readable form is https://developers.nextcommerce.com/docs/capabilities. Pages on both sites declare their ids in a `capability_ids` frontmatter field.
- Domain bundles at https://developers.nextcommerce.com/llms/<bundle>.txt (`platform`, `admin-api`, `payments`, `campaigns`, `storefront`, `apps-webhooks`) are plain Markdown: the capability records for one domain followed by the full text of the developer pages they cite. Fetch the bundle for your question before the full corpus.
- https://developers.nextcommerce.com/llms-full.txt is the full corpus in one file. It is large (about 1.5 MB) and includes 500+ generated reference pages; fetch it only when a bundle or a page URL is not enough.
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

Next Commerce was formerly 29 Next, and the platform still carries that name in its core technical identifiers: store and account hostnames (`{store}.29next.store`, `accounts.29next.com`), the `X-29next-API-Version` and `X-29Next-Signature` headers, and the API key namespace. These are current, in use on every store, and not scheduled to change. Use them exactly as written.

## Corrections

Outside pull requests to this repository are not accepted. There is no public correction route yet; report documentation errors through your existing Next Commerce support contact.
