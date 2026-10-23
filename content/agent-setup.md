<!-- next-commerce-agent-setup version=3 date=2026-10-22 -->

# Start or continue a NEXT campaign with an AI agent

Use this procedure when the user supplies a funnel URL, design, existing campaign repository, or saved Map and wants to build, change, preview, or resume a campaign. Keep their build and hosting choices. Campaign Page Kit is the reference path for a new static campaign; an existing application does not need to become a Page Kit project.

For storefront themes, apps, or other platform work, use the [developer index](https://developers.nextcommerce.com/llms.txt?ref=agent-setup) and [capability map](https://developers.nextcommerce.com/capabilities.json?ref=agent-setup) to find the relevant procedure instead.

## Before writing

Inspect the supplied files and current directory. Identify the intended change, the source URL or design, any existing repo, the campaign identity if known, the build command, output directory, hosting method, and any saved brief, spec, Map or evidence. Preserve existing work; do not scaffold over an existing project.

Ask for missing business decisions together, such as target products, offer changes or which source design to follow. Continue source inspection and local planning while those answers or credentials are missing. Do not ask the user to choose internal tool names.

Record installed versions and the source commit of a reused template or repo. Read the installed CLI help before using flags. For work that includes Campaigns OS, follow its [runtime guidance](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/runtime-readiness.md); its supported Node.js range differs from the Page Kit minimum.

Store access, repository publishing, deployment, test orders and analytics sends are separate effects. A source URL or API key does not authorize all of them. Never print credentials or put them in the brief, handoff, committed files or command output. Without store-write authority, keep work local and leave provisioning and payment checks pending.

## Choose the entry point

| Supplied input | First action | Continue with |
| --- | --- | --- |
| Funnel/store URL or design | Read the source and distinguish observed facts from proposed behavior | A build brief, commerce dependency plan and local preview |
| Existing or cloned campaign repo | Read its instructions, build/configuration and retained evidence | Inspect current behavior and change only what the task requires |
| Existing external build | Inspect its own source, build and deployment conventions | The relevant Campaign Cart checks; retain its framework and host |
| Local CampaignSpec, saved Map or Build Packet | Identify the selected campaign and read existing intent/status | The Campaigns OS continuation command for that artifact |

These entries can join the same work at different points. Do not replay provisioning or scaffolding because a new session starts.

## From a source URL to a proposal

Read public HTML or user-provided source without submitting forms or using cart or checkout endpoints. Record source URLs and capture dates. Describe observed products, variants, displayed prices and currency, offer wording, page structure and visible navigation. Mark checkout rules, shipping, subscriptions and post-purchase behavior unknown when the source does not establish them. A displayed price is not proof of a NEXT package or offer.

Save presentation intent in the [Campaign Build Brief](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/campaign-build-brief.md) format, using its [v1 schema](https://github.com/NextCommerceCo/campaigns-os/blob/main/schemas/campaign-build-brief.v1.schema.json): `schema_version: campaigns-os-build-brief/v1`, `brief_mode: guided`, `status: needs_answers`. Keep observations, proposed changes and open questions distinct.

In the project's README or handoff note, record the proposed page journey and the commerce dependencies: catalogue products, variants and prices that must exist on the store; the packages, offers and shipping that must reference them; the page behavior (selection, form steps, payment, offer accept/decline, receipt); and the domains, payment linking and analytics configuration still needed. Do not invent package IDs, campaign keys or a saved Map to make validation pass.

## Inspect an existing or cloned build

Read the repository's brief, spec and generated records before deriving intent from code. Code shows what was implemented, not what the merchant wanted. If Campaign Cart is present, use the [standardization report](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/campaign-standardization-report.md). Run the project's pinned toolkit from the directory that owns it. If there is none, install the reviewed release in a separate empty inspection directory, following the [published-package instructions](https://github.com/NextCommerceCo/campaigns-os#quick-start):

```bash
npm init -y
npm install --save-dev --save-exact @nextcommerce/campaigns-os@<reviewed-version>
npm ls @nextcommerce/campaigns-os --depth=0
npx --no-install campaigns-os --help
npx --no-install campaigns-os standardize --target /path/to/existing-campaign --no-doctor --json
```

`campaigns-os` is the executable of the scoped package; keep `--no-install` so nothing is downloaded implicitly. The report inspects source without modifying the target. It does not migrate the project, prove checkout or certify a launch. If the application is not recognized, record that and inspect its own integration rather than changing frameworks to satisfy the detector.

For a clone, record the source commit and list the bindings that need replacement: campaign and store identity, packages, offers, domains, analytics IDs, URLs and custom business logic. Prior QA applies to the source campaign; new bindings need their own proof.

For a maintenance task, compare the requested change with the existing brief, spec and commerce configuration, and follow the [reconciliation and handoff procedure](https://github.com/NextCommerceCo/campaigns-os/blob/main/docs/build-packet.md) where it applies.

## Build a local preview before connecting commerce

For a new Page Kit workspace, read the [Page Kit guide](https://developers.nextcommerce.com/docs/campaigns/page-kit?ref=agent-setup). In an empty task directory:

```bash
npm init -y
npm install next-campaign-page-kit
npx --no-install campaign-init --help
```

Choose a family from the [template catalog](https://github.com/NextCommerceCo/campaign-cart-starter-templates/blob/main/templates.json). Preserve a template the user already chose; otherwise recommend one for the product, variant and page requirements and record why. Use the user's name and slug, or propose them.

For a non-interactive run, replace the placeholders with the selected values:

```bash
npx --no-install campaign-init --non-interactive --json \
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

The CLI owns scaffolding and conflict handling; preserve its failure output instead of recreating the scaffold by hand. A successful build writes `_site/`.

The starter templates ship with an empty `apiKey`, so a scaffold made without a campaign key carries no live campaign. The Campaign Cart SDK does not boot without a key, so the pages render for visual review with placeholder prices, make no commerce calls and emit no SDK analytics events; the SDK still fetches locale and country rules. Vendor snippets the templates load from `_data/campaigns.json` keys (GTM, pixels and the others in the starter templates' [analytics key table](https://github.com/NextCommerceCo/campaign-cart-starter-templates/blob/main/_shared/analytics/README.md)) do not depend on the SDK key; a fresh scaffold's entry is seeded with those keys empty, and an existing slug keeps whatever it has. Before `npm run dev`, confirm the top-level `apiKey` in `assets/config.js` is empty and the slug's vendor keys are empty. A configured campaign talks to the selected store and needs the authorization steps below. The preview shows the stock template's design and proposed navigation; it is not a rebuild of the source funnel or the connected campaign, and proves nothing about checkout, prices, shipping or tracking.

## Connect the approved implementation when ready

The [next-campaigns-create skill](https://github.com/NextCommerceCo/skills/tree/main/next-campaigns-create) creates, edits, adopts and clones Campaigns App configuration behind its plan-approval gate. It reads existing catalogue products; missing products or prices need the [Admin API](https://developers.nextcommerce.com/docs/admin-api) or dashboard work with its own authority. The Campaign Cart key and the Admin API token are different credentials.

Use [next-campaigns-setup](https://github.com/NextCommerceCo/skills/tree/main/next-campaigns-setup) for Page Kit configuration; the [skills guide](https://developers.nextcommerce.com/docs/skills?ref=agent-setup) covers installation. Existing projects keep their own build procedure. Record Allowed Domains and payment-account linking as dependencies at their dashboard or API boundary.

When real references and intended behavior are known, use the installed Campaigns OS [agent entry](https://github.com/NextCommerceCo/campaigns-os/blob/main/AGENTS.md) and [quick start](https://github.com/NextCommerceCo/campaigns-os#quick-start) to choose local-spec or saved-Map intake, invoking `npx --no-install campaigns-os` from its installation directory. Its `--help` lists `start` for intake and `next` for continuation. Current authoring is CampaignSpec v5: `select` chooses before payment, `checkout_step` collects a form step, and `checkout` takes payment. The [public multi-step examples](https://github.com/NextCommerceCo/campaign-cart-starter-templates/tree/main/docs/fixtures/campaign-specs) show those roles.

Do not save a Map, publish a repo, deploy, submit an order or send analytics as a side effect of this procedure. Record what is authorized, then invoke the matching capability. A doctor pass, an intercepted analytics request and a vendor receipt are different evidence; state which was obtained.

## Leave work another session can continue

Use the repository's README or existing handoff note and link the artifacts that exist rather than creating a second record. Include:

1. The requested outcome, chosen implementation and host, source URLs or clone commit, and unresolved business questions.
2. Brief, spec, Map or Build Packet paths that exist; list absent artifacts as absent. Keep credentials out.
3. Installed tool and skill versions, working directory, build command and output directory.
4. Which commerce bindings are verified, missing or inherited, and which actions remain unauthorized.
5. The checks run, what they prove, outstanding defects, and the next local action or the specific missing input.

A returning session reads that note, checks the current revision and installed versions, and resumes. It does not reset the project or replay completed writes. Let Campaigns OS commands create their own stage records; never hand-write a passing Assembly Report or reuse a source campaign's QA for a clone.

Report in plain language: what can be reviewed now, what is still unconfigured or unproved, and what is needed to continue. Stop at the user's requested boundary.
