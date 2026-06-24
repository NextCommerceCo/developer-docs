import fs from 'node:fs';
import path from 'node:path';

const PLAYGROUND_DIR = path.join(process.cwd(), 'content/playground');

export interface ParsedPlaygroundFile {
  meta: Record<string, string>;
  content: string;
}

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^<!--\s*([\s\S]*?)-->/);
  if (!match) return { meta: {}, body: raw.trim() };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (key) meta[key] = value;
  }

  return { meta, body: raw.slice(match[0].length).trim() };
}

export function parsePlaygroundFile(src: string): ParsedPlaygroundFile {
  // Snippet examples live at `<src>.html`; full-site pages at `<src>/index.html`.
  const flat = path.join(PLAYGROUND_DIR, `${src}.html`);
  const nested = path.join(PLAYGROUND_DIR, src, 'index.html');
  const filePath = fs.existsSync(flat) ? flat : nested;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  return { meta, content: body };
}
