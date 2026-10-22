<!-- next-commerce-agent-setup version=3 date=2026-10-22 -->

# Start or continue a NEXT campaign with an AI agent

Use this procedure when the user supplies a funnel URL, design, existing campaign repository, or saved Map and wants to build, change, preview, or resume a campaign. Keep their build and hosting choices. Campaign Page Kit is the reference path for a new static campaign; an existing application does not need to become a Page Kit project.

For storefront themes, apps, or other platform work, use the [developer index](https://developers.nextcommerce.com/llms.txt?ref=agent-setup) and [capability map](https://developers.nextcommerce.com/capabilities.json?ref=agent-setup) to find the relevant procedure instead.

## Before writing

Inspect the supplied files and current directory. Identify the intended change, source URL/design, existing repo, campaign identity if known, build command, output directory, hosting method, and any saved brief, spec, Map or evidence. Preserve existing work and user choices; do not scaffold over an existing project.

Ask together for missing business decisions that affect the result, such as target products, offer changes or which source design to follow. Continue source inspection and local planning while those answers or credentials are missing. Do not ask the user to choose internal tool names.

Record actual installed versions and the source commit of a reused template/repo. For work that includes Campaigns OS, use its [runtime preparation guidance](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/runtime-readiness.md); Node.js 22 is a common supported choice. The Page Kit-only minimum and the Campaigns OS supported runtime range are different. Read the installed CLI help and package documentation before using flags. If an installed documentation link is missing, use the corresponding public repository file at that package's release tag and record the mismatch.

Store access, repository publishing, deployment, test orders, and analytics sends are separate effects. A source URL or API key does not authorize all of them. Use existing authority from the user's request; never print credentials or put them in the brief, handoff, committed files or command output. With no store-write authority, keep work local and leave provisioning and payment checks pending.

## Choose the entry point

| Supplied input | First action | Continue with |
| --- | --- | --- |
| Funnel/store URL or design | Read the source and distinguish observed facts from proposed behavior | A build brief, commerce dependency plan and local concept preview |
| Existing or cloned campaign repo | Read its instructions, build/configuration and retained evidence | Inspect current behavior and change only what the task requires |
| Existing external build | Inspect its own source, build and deployment conventions | The relevant Campaign Cart checks; retain its framework and host |
| Local CampaignSpec, saved Map or Build Packet | Identify the selected campaign and read existing intent/status | The supported Campaigns OS continuation command for that artifact |

These entries can join the same work at different points. Do not replay provisioning or scaffolding merely because a new session starts.

## From a source URL to a proposal

Read public HTML or user-provided source without submitting forms or using cart/checkout endpoints. Record source URLs and capture dates. Describe observed products, variants, displayed prices/currency, offer wording, page structure and visible navigation. Mark checkout rules, shipping, subscriptions and post-purchase behavior unknown when the source does not establish them. A source site's displayed price is not proof of a NEXT package or offer configuration.

Save presentation intent in the existing [Campaign Build Brief](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/campaign-build-brief.md) format, using its [v1 schema](https://github.com/NextCommerceCo/campaigns-os/blob/main/schemas/campaign-build-brief.v1.schema.json). Start with `schema_version: campaigns-os-build-brief/v1`, `brief_mode: guided`, and `status: needs_answers`. Keep source observations, proposed changes and unresolved questions distinct; use `_meta` for provenance. Do not label unapproved business choices complete.

In the project's existing README or handoff note, record the proposed page journey and commerce dependencies:

- Catalogue products, variants, base prices and currencies that must exist on the target store.
- Campaign packages, quantity selections, offers/codes and shipping that must reference that catalogue.
- Page behavior: selection, information/shipping steps, payment, offer acceptance/decline and receipt.
- Required domains, payment linking and analytics configuration, with their current evidence or unknown status.

Do not invent package IDs, campaign keys or a saved Map to make validation pass. Without real commerce bindings, retain the brief and dependency plan; a complete operational CampaignSpec comes later. Importing visual source does not automatically migrate checkout behavior.

## Inspect an existing or cloned build

Read the repository's current brief, spec and generated records before deriving new intent from code. Code establishes implemented behavior; it does not establish what the merchant wanted. If Campaign Cart is present, use the existing [standardization report](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/campaign-standardization-report.md) after preparing the toolkit:

```bash
campaigns-os standardize --target /path/to/existing-campaign --no-doctor --json
```

This inspects source without modifying the target. Retain its report and exact command outside generated stage records. A report does not migrate the project, prove checkout, or certify a launch. If the application is not recognized, record that limit and inspect its own integration; do not change frameworks to satisfy the detector.

For a clone, record the source commit and list bindings that need replacement: campaign/store identity, packages, offers, domains, analytics IDs, URLs and custom business logic. Inspect names and locations without exposing secret values. Do not execute inherited scripts or open a connected clone before those effects are understood. Prior QA applies to the source campaign; the new bindings and changed behavior need their own proof.

For a maintenance task, compare the requested business change with the existing brief/spec, authoritative commerce and implementation. Follow the [existing reconciliation and handoff procedure](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/build-packet.md) where it applies. Preserve the builder's deployment method and unchanged work.

## Build a local preview before connecting commerce

For a new Page Kit workspace, read the [Page Kit guide](https://developers.nextcommerce.com/docs/campaigns/page-kit?ref=agent-setup). In an empty task directory:

```bash
npm init -y
npm install next-campaign-page-kit
npx campaign-init --help
```

Use the current [template catalog](https://github.com/NextCommerceCo/campaign-cart-starter-templates/blob/main/templates.json) and its selection guidance. Preserve a chosen template; otherwise recommend one for the product/variant and page requirements. Record the choice and why. Use the user's supplied name/slug, or propose them while continuing source work.

For a non-interactive run, replace the placeholders with the selected values:

```bash
npx campaign-init --non-interactive --json \
  --template <selected-template> \
  --slug <selected-route-slug> \
  --name "<selected-campaign-name>" \
  --ai-context <claude|codex|cursor|copilot|none>
npm run build
```

| Tool | `--ai-context` value |
| --- | --- |
| Claude Code | `claude` |
| OpenAI Codex | `codex` |
| Cursor | `cursor` |
| GitHub Copilot | `copilot` |
| Other agents | `none` |

The CLI owns scaffolding and conflict handling. Preserve failure output instead of recreating the scaffold by hand. A successful build writes `_site/`; it does not prove that opening those pages is safe or that commerce works.

**Do not open an unconfigured scaffold just because init accepted no key.** Page Kit 0.3.0 can retain the template's demo key and enabled analytics. Inspect the installed version's behavior and generated output. Use a documented static-preview mode only when that installed version actually provides it, and verify it disables scripts, forms, frames and external requests before browser inspection. A pending PR is not a released capability.

If that protection is unavailable, leave the scaffold unopened. Make a separate local visual concept in a directory containing only authored static HTML, local CSS and local assets. Include no SDK/config scripts, forms, frames, event handlers, remote assets or payment navigation. Put this policy first in each page's `<head>`, and label every page **Commerce unconfigured — visual concept only**:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; form-action 'none'; base-uri 'none'; frame-src 'none'; object-src 'none'">
```

Serve only that concept directory on loopback. Inspect its source before opening, then check rendered output and network activity at desktop and mobile widths. Record visual defects and limitations. This concept can communicate design and proposed navigation; it is not the connected campaign or payment QA. Do not remove runtime wiring from an existing campaign to make this separate preview.

## Connect the approved implementation when ready

The public [next-campaigns-create skill](https://github.com/NextCommerceCo/skills/tree/main/next-campaigns-create) owns campaign creation, edit, adopt/diff/update and campaign cloning through its existing plan/approval boundaries. It reads existing catalogue products and creates campaign configuration; it does not create catalogue products or CampaignSpec. Missing products/prices require the appropriate [Admin API product procedure](https://developers.nextcommerce.com/docs/admin-api) or dashboard work with its own access and authority. The Campaign Cart key and Admin API token are different credentials.

Use [next-campaigns-setup](https://github.com/NextCommerceCo/skills/tree/main/next-campaigns-setup) for Page Kit configuration. The [AI skills guide](https://developers.nextcommerce.com/docs/skills?ref=agent-setup) explains installation and version checks. Existing projects keep their own build procedure. Record Allowed Domains and payment-account linking as dependencies at their actual dashboard/API boundary.

When real references and intended behavior are known, use the installed Campaigns OS [agent entry](https://github.com/NextCommerceCo/campaigns-os/blob/main/AGENTS.md) to choose local-spec or saved-Map intake. Current authoring uses CampaignSpec v5: `select` chooses before payment, `checkout_step` collects a form step, and `checkout` takes payment. v4.2/v4.3 read compatibility does not make those old versions the authoring target. The [public multi-step examples](https://github.com/NextCommerceCo/campaign-cart-starter-templates/tree/main/docs/fixtures/campaign-specs) illustrate the roles; use the installed toolkit's routing projection rather than treating every example hint as an implemented runtime guarantee.

Keep any saved-Map requirement that applies to the user's delivery process. Do not save a Map, publish a repo, deploy, submit an order or send analytics as a side effect of this local-preview procedure. Record what is authorized, then invoke the appropriate existing capability. A doctor/static pass, intercepted analytics request and vendor receipt are different evidence. State which was actually obtained.

## Leave work another session can continue

Use the repository's existing README or handoff note. Link the existing artifacts rather than creating a second lifecycle record. Include:

1. The user's requested outcome, chosen implementation/host, source URLs or clone commit, and unresolved business questions.
2. Brief/spec/Map/Build Packet paths or IDs that really exist; list absent artifacts as absent. Keep credentials out of the note.
3. Installed tool/skill versions, working directory, build command and output directory; identify the separate concept preview when used.
4. Which commerce bindings are verified, missing or inherited, and which actions remain unauthorized.
5. Exact checks and output paths, what those checks prove, outstanding defects, and the next executable local action or specific missing input.

A returning session reads that note and the linked artifacts, checks the current revision and installed versions, and resumes the next action. It does not reset the project or replay completed writes. Let Campaigns OS commands create their own stage/evidence records; never hand-write a passing Assembly Report or reuse a source campaign's QA as acceptance for a clone.

Report the result in plain language: what can be reviewed now, what is still unconfigured or unproved, and what is needed to continue. Stop at the user's requested boundary.
