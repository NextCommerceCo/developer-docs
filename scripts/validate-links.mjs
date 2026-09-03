import path from 'node:path';
import GithubSlugger from 'github-slugger';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { getSlugs } from 'fumadocs-core/source';
import { printErrors, readFiles, scanURLs, validateFiles } from 'next-validate-link';

/**
 * Validates every internal link under content/docs, including fragments.
 *
 * Run after the reference generators (`npm run generate`); the generated
 * Admin API, webhook, GraphQL, and Campaigns API pages are link targets, and
 * without them this reports dozens of false "missing page" errors. The
 * `validate-links` npm script regenerates first so the sequence is the same
 * locally and in CI.
 *
 * Fragments: rehype-slug gives every rendered heading (h1 to h6) an id, but the
 * table of contents only records the levels it shows, so a link to an h4 used to
 * fail as `invalid-fragment` (content/docs/apps/guides/fulfillment-service.mdx:150
 * was the standing example). The valid fragments for a page are therefore the
 * union of the TOC entries and every heading in the source, slugged the same way.
 */

function headingHashes(content) {
  const slugger = new GithubSlugger();
  const hashes = [];
  let inFence = false;
  for (const line of content.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const custom = m[1].match(/\[#([^\]]+)\]\s*$/);
    if (custom) {
      hashes.push(custom[1]);
      continue;
    }
    const text = m[1].replace(/`([^`]*)`/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
    hashes.push(slugger.slug(text));
  }
  return hashes;
}

async function checkLinks() {
  const docsFiles = await readFiles('content/docs/**/*.{md,mdx}');

  const scanned = await scanURLs({
    populate: {
      'docs/[[...slug]]': docsFiles.map((file) => ({
        value: getSlugs(path.relative('content/docs', file.path)),
        hashes: [
          ...new Set([
            ...getTableOfContents(file.content).map((item) => item.url.slice(1)),
            ...headingHashes(file.content),
          ]),
        ],
      })),
    },
  });

  printErrors(
    await validateFiles(docsFiles, { scanned }),
    true,
  );
}

void checkLinks();
