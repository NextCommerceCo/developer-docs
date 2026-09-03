<!-- next-commerce-agent-setup version=1 date=2026-09-03 -->

# Set up a Next Commerce campaign workspace

Complete these steps yourself in the current environment. Do not ask the user to run the commands for you.

## Safety rules

- Inspect the current directory before writing. If it contains an existing project, create a new `next-agent-starter` subdirectory and work there. Never overwrite an existing project or agent configuration file.
- Check `node --version` first. Use Node.js 22 or newer. If Node.js is missing or older, stop and tell the user what is required.
- Do not request, print, copy, or invent credentials. The starter builds without an API key. Add a real Campaign API key only when the user provides one through an approved secret mechanism.
- Do not call a live store or place an order unless the user has identified the store, authorized the action, and provided suitable test access.

## Create the project

In the empty working directory, initialize the package and install Campaign Page Kit:

```bash
npm init -y
npm install next-campaign-page-kit
```

Then use the section for the agent that is running these instructions. Each command is non-interactive. The `skills` command installs only the campaign setup skill into this project. `campaign-init` creates an Apollo one-page campaign and writes the tool-specific context file.

### Claude Code

```bash
npx skills add NextCommerceCo/skills --skill next-campaigns-setup --agent claude-code --yes
npx campaign-init --non-interactive --json --template apollo --slug agent-starter --name "Agent Starter" --ai-context claude
```

### OpenAI Codex

```bash
npx skills add NextCommerceCo/skills --skill next-campaigns-setup --agent codex --yes
npx campaign-init --non-interactive --json --template apollo --slug agent-starter --name "Agent Starter" --ai-context codex
```

### Cursor

```bash
npx skills add NextCommerceCo/skills --skill next-campaigns-setup --agent cursor --yes
npx campaign-init --non-interactive --json --template apollo --slug agent-starter --name "Agent Starter" --ai-context cursor
```

### Other agents

Read the [next-campaigns-setup skill](https://raw.githubusercontent.com/NextCommerceCo/skills/main/next-campaigns-setup/SKILL.md) into your current context, then run:

```bash
npx campaign-init --non-interactive --json --template apollo --slug agent-starter --name "Agent Starter" --ai-context none
```

If your agent supports project rules or skills, save the skill in its documented project-level location. Do not guess a global configuration path.

## Verify the workspace

Run the static build:

```bash
npm run build
```

Confirm that:

- `_data/campaigns.json` contains `agent-starter`.
- `src/agent-starter/` exists.
- The tool-specific context file exists: `CLAUDE.md`, `AGENTS.md`, or `.cursor/rules/campaign-page-kit.mdc`. Other agents may not have a generated file.
- The build exits successfully and writes `_site/`.

Read these sources before making platform claims or changing the starter:

- [Developer index](https://developers.nextcommerce.com/llms.txt?ref=agent-setup)
- [Campaign quick start](https://developers.nextcommerce.com/docs/campaigns?ref=agent-setup)
- [Safe testing](https://developers.nextcommerce.com/docs/testing?ref=agent-setup)
- [Test Gateway details](https://developers.nextcommerce.com/docs/admin-api/guides/testing-guide?ref=agent-setup)
- [Platform capability map](https://developers.nextcommerce.com/capabilities.json?ref=agent-setup)

## Complete the first safe win

Inspect `_site/agent-starter/landing/index.html` and confirm that the generated landing page exists. Briefly describe the campaign flow the starter contains and one sensible next customization for the user's product. This proves that the installed toolchain produced a working campaign without requiring credentials or touching a live store.

If the user has already authorized a specific test store and provided a Campaign API key through an approved secret mechanism, offer to connect the starter and follow the documented Test Gateway flow. Otherwise stop at the successful static build.

## Troubleshooting

- If a target directory or agent configuration file already exists, do not delete or replace it. Choose a new empty subdirectory and report the path.
- If an install fails because of a transient network or registry error, retry that exact command once. Do not substitute an unofficial package or repository.
- If `campaign-init` or the build fails again, preserve the error output and report the failing command. Do not add credentials as a workaround.

## Report back

Tell the user:

1. Which directory you used.
2. Which skill and context file you installed.
3. Whether the static build passed.
4. That the starter has no Campaign API key yet.
5. What you found in the generated landing page.
6. The next safe step: add a Campaign API key through the project's config command, connect the campaign to a store, and use the documented Test Gateway or test cards. Do not claim that a test order was placed unless you actually placed one against the user-authorized store.
