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

const humanInstructions = source
  .replace(/^<!--[^\n]+-->\n+/, '')
  .replace(/^# Start a Campaign Page Kit project with an AI agent$/m, '## Instructions your agent receives');
const guide = `---
title: Campaign agent quickstart
description: An optional agent-friendly wrapper around the current Campaign Page Kit docs and CLI that preserves the developer's workflow choices
---

Give your coding agent this instruction:

\`\`\`text
Read https://developers.nextcommerce.com/agent-setup/prompt.md and use it to start a new Campaign Page Kit project for this task. Preserve my existing choices. If the template, route slug, or campaign name is missing, ask me before creating files.
\`\`\`

The fetched file is plain Markdown at a stable URL. It uses the same source as the instructions below, contains no credentials, and keeps the current CLI and Campaigns docs authoritative. It is a campaign-specific quickstart, not general setup for every kind of Next Commerce development.

${humanInstructions}`;

mkdirSync(docsDir, { recursive: true });
writeFileSync(join(docsDir, 'index.mdx'), guide);
console.log('Generated campaign agent quickstart, human guide, and evaluation prompt from canonical Markdown sources');
