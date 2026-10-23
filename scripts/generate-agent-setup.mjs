/**
 * Generates both views of the agent setup instructions from one Markdown file:
 * the raw prompt served at /agent-setup/prompt.md and the human docs page.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const sourcePath = join(ROOT, 'content', 'agent-setup.md');
const evaluationSourcePath = join(ROOT, 'content', 'evaluate-next.md');
const generatedDir = join(ROOT, 'lib', 'generated');
const docsDir = join(ROOT, 'content', 'docs', 'agent-setup');
const source = readFileSync(sourcePath, 'utf8').trimEnd() + '\n';
const evaluationSource = readFileSync(evaluationSourcePath, 'utf8').trimEnd() + '\n';

if (!/^<!-- next-commerce-agent-setup version=\d+ date=\d{4}-\d{2}-\d{2} -->\n/.test(source)) {
  throw new Error('content/agent-setup.md must start with a versioned, dated setup comment');
}
if (/\]\(\//.test(source)) {
  throw new Error('content/agent-setup.md must use absolute links');
}
if (!/^<!-- next-commerce-evaluation-prompt version=\d+ date=\d{4}-\d{2}-\d{2} -->\n/.test(evaluationSource)) {
  throw new Error('content/evaluate-next.md must start with a versioned, dated evaluation comment');
}
if (/\]\(\//.test(evaluationSource)) {
  throw new Error('content/evaluate-next.md must use absolute links');
}

mkdirSync(generatedDir, { recursive: true });
writeFileSync(join(generatedDir, 'agent-setup.json'), JSON.stringify({ prompt: source }, null, 2) + '\n');
writeFileSync(join(generatedDir, 'evaluation-prompt.json'), JSON.stringify({ prompt: evaluationSource }, null, 2) + '\n');

const promptHeading = /^# Start or continue a NEXT campaign with an AI agent$/m;
const humanSource = source.replace(/^<!--[^\n]+-->\n+/, '');
if (!promptHeading.test(humanSource)) {
  throw new Error('content/agent-setup.md must contain the expected setup heading');
}
const humanInstructions = humanSource.replace(promptHeading, '## Instructions your agent receives');
const guide = `---
title: Start or continue a campaign with an agent
description: Start from a funnel URL, existing repository or Map, prepare a local preview, and leave a handoff another agent can continue
---

Give your coding agent this instruction:

\`\`\`text
Read https://developers.nextcommerce.com/agent-setup/prompt.md and help me start or continue this campaign from the URL, repository or Map I provide. Preserve my build and hosting choices. Prepare a local preview and resumable handoff; keep live merchant state untouched.
\`\`\`

The fetched file is plain Markdown at a stable URL. It uses the same source as the instructions below, contains no credentials, and keeps the current CLI and Campaigns docs authoritative. It covers campaign intake, existing builds and continuation. It does not require a new project or store credentials before source inspection and local planning.

${humanInstructions}`;

mkdirSync(docsDir, { recursive: true });
writeFileSync(join(docsDir, 'index.mdx'), guide);
console.log('Generated campaign agent quickstart, human guide, and evaluation prompt from canonical Markdown sources');
