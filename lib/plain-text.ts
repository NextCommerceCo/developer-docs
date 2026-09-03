/**
 * Turns fumadocs' processed Markdown (which still carries the MDX components the
 * site renders) into plain Markdown an agent can read without a JSX parser.
 *
 * Only the components used under content/docs are handled; the post-build check
 * (scripts/check-agent-surfaces.mjs) fails if a bundle still contains a tag or an
 * import line, so a new component shows up as a build failure, not as noise.
 */

function unquote(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/^["'{]+|["'}]+$/g, '').trim();
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}=("[^"]*"|'[^']*'|\\{[^}]*\\})`));
  return m ? unquote(m[1]) : undefined;
}

const CALLOUT_LABEL: Record<string, string> = {
  info: 'Note',
  idea: 'Tip',
  warn: 'Warning',
  warning: 'Warning',
  error: 'Caution',
  success: 'Note',
};

export function toPlainMarkdown(input: string): string {
  let text = input;

  // ESM import/export lines that MDX allows at the top level.
  text = text.replace(/^(import|export)\s[^\n]*\n?/gm, '');
  // JSX comments.
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // <Callout type="warn" title="X"> ... </Callout>  ->  blockquote with a label.
  text = text.replace(/<Callout\b([^>]*)>([\s\S]*?)<\/Callout>/g, (_m, attrs: string, body: string) => {
    const type = attr(attrs, 'type') ?? 'info';
    const title = attr(attrs, 'title');
    const label = title ? `${CALLOUT_LABEL[type] ?? 'Note'} (${title})` : CALLOUT_LABEL[type] ?? 'Note';
    const lines = body.trim().split('\n');
    return `> **${label}:** ${lines[0]}${lines.slice(1).map((l) => `\n> ${l}`).join('')}\n`;
  });

  // <Tabs items={['A','B']}> <Tab value="A"> ... </Tab> </Tabs>  ->  bold tab names.
  text = text.replace(/<Tab\b([^>]*)>/g, (_m, attrs: string) => {
    const value = attr(attrs, 'value') ?? attr(attrs, 'label');
    return value ? `\n**${value}**\n` : '\n';
  });
  text = text.replace(/<\/?Tabs\b[^>]*>/g, '\n');
  text = text.replace(/<\/Tab>/g, '\n');

  // <Cards><Card title="X" href="/y">desc</Card></Cards>  ->  link list.
  text = text.replace(/<Card\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Card>)/g, (_m, attrs: string, body?: string) => {
    const title = attr(attrs, 'title') ?? 'Link';
    const href = attr(attrs, 'href');
    const desc = (body ?? '').trim().replace(/\s+/g, ' ');
    const link = href ? `[${title}](${href})` : title;
    return `- ${link}${desc ? `: ${desc}` : ''}\n`;
  });
  text = text.replace(/<\/?Cards\b[^>]*>/g, '\n');

  // <Mermaid chart="..." />  ->  a mermaid code fence; the diagram source is readable prose.
  text = text.replace(/<Mermaid\b[^>]*?chart=(?:"([\s\S]*?)"|\{`([\s\S]*?)`\})[^>]*\/?>(?:<\/Mermaid>)?/g, (_m, dq?: string, bt?: string) => {
    const chart = (dq ?? bt ?? '').trim();
    return chart ? `\n\`\`\`mermaid\n${chart}\n\`\`\`\n` : '';
  });

  // <Steps><Step>...</Step></Steps>  ->  the steps' own headings and prose.
  text = text.replace(/<\/?Steps?\b[^>]*>/g, '\n');

  // Any remaining capitalised component (diagrams, playgrounds, grids) carries no
  // prose: drop the tag and its children.
  text = text.replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g, '');
  text = text.replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/g, '');

  // Blank-line hygiene.
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim() + '\n';
}
