<!-- next-commerce-agent-setup version=2 date=2026-09-04 -->

# Start a Campaign Page Kit project with an AI agent

Use this quickstart only when the user wants a new Campaign Page Kit workspace. It is an optional agent-friendly wrapper around the current Campaigns documentation and `campaign-init`; it is not a general Next Commerce development environment, a production architecture decision, or a replacement for the developer's chosen workflow.

If the user wants to understand the platform, work in an existing project, build a storefront theme or app, or use the Admin API, do not scaffold a campaign. Read the [developer index](https://developers.nextcommerce.com/llms.txt?ref=agent-setup) and [platform capability map](https://developers.nextcommerce.com/capabilities.json?ref=agent-setup), identify the relevant documentation, and respond to that task instead.

## Before writing

- Confirm that the user's request calls for a new Campaign Page Kit project. If it is unclear, ask one concise question before installing packages or creating files.
- Inspect the current directory. If it contains an existing project, do not add a second project or replace its configuration. Ask whether to use that project or create a new subdirectory.
- Use the Node.js version required by the current [Campaigns quick start](https://developers.nextcommerce.com/docs/campaigns?ref=agent-setup). Do not impose a stricter version or relax the documented requirement.
- Preserve any template, source, project name, route slug, package manager, and agent-context choice the user has already made. The commands below use the docs' npm path for an empty project; do not replace an existing project's package-manager convention.
- Do not request, print, copy, or invent credentials. A workspace can be scaffolded and built without a Campaign API key.
- Do not call a live store or place an order unless the user has identified the store, authorized the action, and provided suitable test access.

## Use the current Campaign Page Kit workflow

Read the [Campaign Page Kit guide](https://developers.nextcommerce.com/docs/campaigns/page-kit?ref=agent-setup), then inspect the installed CLI contract before constructing a command:

```bash
npm init -y
npm install next-campaign-page-kit
npx campaign-init --help
```

If the user has not supplied a template, route slug, campaign name, and agent-context preference, ask for the missing choices together. Do not silently select a starter template or context file. Use the current template picker or catalog described by the CLI and docs rather than copying a fixed list from this prompt.

For a non-interactive agent run, replace every placeholder below with the developer-confirmed value:

```bash
npx campaign-init --non-interactive --json \
  --template <selected-template> \
  --slug <selected-route-slug> \
  --name "<selected-campaign-name>" \
  --ai-context <claude|codex|cursor|copilot|none>
```

Choose the context value that matches the current tool, or `none` when the tool is unsupported or the developer does not want a generated context file:

| Tool | `--ai-context` value |
| --- | --- |
| Claude Code | `claude` |
| OpenAI Codex | `codex` |
| Cursor | `cursor` |
| GitHub Copilot | `copilot` |
| Other agents | `none` |

`campaign-init` is the authority for scaffold behavior, supported flags, conflict handling, and exit codes. Do not reproduce the scaffold manually if it fails. Preserve its output and follow the troubleshooting guidance in the Campaign Page Kit guide.

The [Next Commerce AI skills guide](https://developers.nextcommerce.com/docs/skills?ref=agent-setup) describes optional reusable skills. Installing `next-campaigns-setup` is not required for this quickstart. Use it only when the developer asks for the fuller guided setup/configuration workflow or another official tool routes the task to it.

## Verify only what was requested

Run the static build:

```bash
npm run build
```

Use the JSON emitted by `campaign-init` and the generated project files to confirm that:

- the selected campaign is registered in `_data/campaigns.json`;
- its source directory exists under `src/`;
- the requested agent context file was created, or no context file was requested;
- the build exits successfully and writes the campaign to `_site/`.

Inspect one generated entry page and briefly describe what the selected starter contains. Treat that as proof of a local scaffold only. Do not claim the project is connected to a store, production-ready, or tested end to end without the corresponding evidence.

If the user explicitly wants to continue, follow the current Campaigns and testing documentation for configuration and test-store work. Otherwise stop after the verified local build; do not turn a quickstart into an unsolicited production setup.

## Report back

Tell the user:

1. Which directory and existing/new project path you used.
2. Which developer-provided template, slug, name, and agent-context value you used.
3. Which official docs and CLI contract you followed.
4. Whether `campaign-init` and the static build passed.
5. What you verified in the generated output.
6. What remains unconfigured or untested, and the next step relevant to the user's stated goal.
