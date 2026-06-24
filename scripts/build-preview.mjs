/**
 * Builds static preview pages for playground content.
 * Run before `next dev` / `next build` — wired into the "dev" and "build" npm scripts.
 *
 * Two kinds of category folder under content/playground/ are handled:
 *
 * 1. SNIPPET folders — contain only flat `.html` body fragments
 *      Input:  content/playground/<category>/<file>.html
 *      Output: public/preview/<slug(category)>/<file>.html
 *    Each file starts with a `<!-- key: value -->` front-matter block; only
 *    `layout` matters here (title/description/order are consumed by lib/playground
 *    at runtime). The body is wrapped in a self-contained HTML document that:
 *      - loads the SDK from jsDelivr (or a custom sdkHost)
 *      - sets window.nextConfig from defaults, overridable via URL params
 *      - supports `?code=<lz-string>` to swap the example body at runtime (used
 *        by the playground "Share" link and live edits)
 *    Layout handling mirrors lib/playground/utils.ts wrapLayout/buildIframeHtml:
 *      - `center`    — wraps body in .playground-wrapper with flex centering
 *      - `full_page` — writes userHtml verbatim (no wrapper, no config script)
 *      - anything else (incl. missing/`full`) — no wrapper div, no layout styles
 *
 * 2. FULL-SITE folders — contain subdirectories and/or non-`.html` assets
 *      Input:  content/playground/<category>/**  (full HTML documents + assets)
 *      Output: public/preview/<slug(category)>/** (structure preserved, base rebased)
 *    These are complete multi-page sites (own SDK loader, config.js, css/js/images).
 *    The whole tree is copied verbatim into public/preview/<slug>/ — folder
 *    structure and `<page>/index.html` files are preserved (not flattened). The
 *    site's hardcoded absolute base (e.g. `/olympus-multi-variant/...`) is
 *    rewritten to `/preview/<slug>/...` in text assets; inter-page links
 *    `/<base>/<page>/` are pointed at the explicit `…/<page>/index.html` so they
 *    resolve under `next dev` (which serves public/ files at their exact path
 *    only — a bare directory URL 404s). The source base is derived from the most
 *    common first path segment of the site's absolute asset refs, falling back
 *    to slug(category).
 *
 * NOTE: Default config values below must stay in sync with
 * lib/playground/constants.ts → DEFAULT_CONFIG.
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
  existsSync,
} from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLAYGROUND_DIR = join(ROOT, 'content/playground');
const PUBLIC_DIR = join(ROOT, 'public');
const OUTPUT_DIR = join(PUBLIC_DIR, 'preview');

const DEFAULTS = {
  sdkHost: '',
  sdkVersion: 'latest',
  debugger: false,
};

const LAYOUT_STYLES = {
  center:
    'display: flex; align-items: center; justify-content: center; min-height: 100vh;',
};

// ── Utilities ───────────────────────────────────────────────────────────────

function slugCategory(category) {
  return category
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-/]/g, '');
}

/**
 * A category folder is a full multi-page site (copied verbatim) when its
 * top-level contains any subdirectory or any non-`.html` asset. A folder of
 * only flat `.html` fragments is a snippet folder (wrapped in a preview doc).
 */
function isFullSite(catDir) {
  return readdirSync(catDir, { withFileTypes: true }).some(
    (d) => d.isDirectory() || !d.name.endsWith('.html'),
  );
}

/** Recursively collect file paths under `dir` matching `pred`. */
function collectFiles(dir, pred) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full, pred));
    else if (pred(full)) out.push(full);
  }
  return out;
}

/**
 * Derive a site's output base path from the most common first path segment of
 * its own absolute asset refs (e.g. `/olympus-multi-variant/config.js` →
 * `olympus-multi-variant`). Protocol-relative (`//`) and external (`https://`)
 * refs are ignored. Falls back to `fallback` when no absolute ref is found.
 */
function deriveBasePath(siteDir, fallback) {
  const htmlFiles = collectFiles(siteDir, (f) => f.endsWith('.html'));
  const counts = new Map();
  // matches href="/seg/..." or src='/seg/...' but not "//host" (protocol-relative)
  const refRe = /(?:href|src)\s*=\s*["'](\/[^/"'][^"']*)["']/gi;

  for (const file of htmlFiles) {
    const raw = readFileSync(file, 'utf-8');
    let m;
    while ((m = refRe.exec(raw)) !== null) {
      const seg = m[1].split('/')[1];
      if (seg) counts.set(seg, (counts.get(seg) ?? 0) + 1);
    }
  }

  let best = fallback;
  let bestCount = 0;
  for (const [seg, n] of counts) {
    if (n > bestCount) {
      best = seg;
      bestCount = n;
    }
  }
  return best;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^<!--\s*([\s\S]*?)-->/);
  if (!match) return { meta: {}, code: raw.trim() };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (key) meta[key] = value;
  }
  return { meta, code: raw.slice(match[0].length).trim() };
}

function wrapLayout(html, layout) {
  const style = LAYOUT_STYLES[layout];
  if (!style) return html;
  return `<div class="playground-wrapper" style="${style}">${html}</div>`;
}

function renderPreview(userHtml, layout) {
  if (layout === 'full_page') return userHtml;

  const defaults = JSON.stringify(DEFAULTS);

  return `<!DOCTYPE html>
<html lang="en" style="background: transparent !important;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark">
  <style>body { background: transparent !important; margin: 0; }</style>
  <script src="https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js"></script>
  <script>
    (function () {
      var params = new URLSearchParams(window.location.search);
      var defaults = ${defaults};
      var pick = function (k) { return params.has(k) ? params.get(k) : defaults[k]; };

      var sdkHost = pick('sdkHost');
      var debugFlag = params.get('debug') === 'true';
      var cfg = {
        sdkHost: sdkHost || '',
        debug: debugFlag || !!sdkHost,
        debugger: params.has('debugger') ? params.get('debugger') === 'true' : !!defaults.debugger,
      };
      window.nextConfig = cfg;

      var sdkVersion = pick('sdkVersion');
      var sdkUrl = sdkHost
        ? sdkHost.replace(/\\/$/, '') + '/loader.js'
        : (!sdkVersion || sdkVersion === 'latest')
          ? 'https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@latest/dist/loader.js'
          : 'https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v' + sdkVersion + '/dist/loader.js';

      // If ?code=... is supplied, LZString-decompress it and swap into the
      // playground wrapper (falls back to document.body when no wrapper).
      function applyCodeOverride() {
        var encoded = params.get('code');
        if (!encoded || !window.LZString) return;
        var decoded = window.LZString.decompressFromEncodedURIComponent(encoded);
        if (!decoded) return;
        var host = document.querySelector('.playground-wrapper') || document.body;
        host.innerHTML = decoded;
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyCodeOverride);
      } else {
        applyCodeOverride();
      }

      var s = document.createElement('script');
      s.type = 'module';
      s.src = sdkUrl;
      document.head.appendChild(s);
    })();
  </script>
</head>
<body data-next-sdk-loading="true">
  ${wrapLayout(userHtml, layout)}
</body>
</html>`;
}

// ── Build ───────────────────────────────────────────────────────────────────

function build() {
  if (!existsSync(PLAYGROUND_DIR)) {
    console.warn(`[build-preview] ${PLAYGROUND_DIR} not found — skipping.`);
    return;
  }

  if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const categories = readdirSync(PLAYGROUND_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'flows')
    .map((d) => d.name);

  let pageCount = 0;
  let siteCount = 0;
  for (const category of categories) {
    const catDir = join(PLAYGROUND_DIR, category);

    if (isFullSite(catDir)) {
      siteCount += buildSite(catDir, category);
    } else {
      pageCount += buildSnippets(catDir, category);
    }
  }

  console.log(
    `[build-preview] wrote ${pageCount} preview page(s) to public/preview/` +
      (siteCount ? ` and copied ${siteCount} full-site folder(s)` : ''),
  );
}

/** Wrap each flat `.html` fragment in a preview document. */
function buildSnippets(catDir, category) {
  const outDir = join(OUTPUT_DIR, slugCategory(category));
  mkdirSync(outDir, { recursive: true });

  let count = 0;
  const files = readdirSync(catDir).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const raw = readFileSync(join(catDir, file), 'utf-8');
    const { meta, code } = parseFrontmatter(raw);
    const html = renderPreview(code, meta.layout ?? '');
    writeFileSync(join(outDir, file), html);
    count++;
  }
  return count;
}

/** Top-level subdirs that contain an index.html — the navigable pages of a site. */
function findSitePages(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && existsSync(join(dir, d.name, 'index.html')),
    )
    .map((d) => d.name);
}

/**
 * Copy a full multi-page site verbatim into public/preview/<slug>/, preserving
 * its folder structure (including `<page>/index.html` pages), and rewrite the
 * site's hardcoded absolute base (e.g. `/olympus-multi-variant/`) to the preview
 * path. Inter-page links `/<base>/<page>/` are pointed at the explicit
 * `…/<page>/index.html`, because `next dev` (and `trailingSlash: false`) serves
 * public/ files only at their exact path — a directory URL 404s. Asset refs are
 * rebased as-is. Returns 1 (folder count) for the summary.
 */
function buildSite(catDir, category) {
  const slug = slugCategory(category);
  const outDir = join(OUTPUT_DIR, slug);
  const srcBase = deriveBasePath(catDir, slug); // e.g. "olympus-multi-variant"
  const fromPrefix = `/${srcBase}`;
  const toPrefix = `/preview/${slug}`;

  cpSync(catDir, outDir, { recursive: true });

  const pages = findSitePages(outDir);
  const textFiles = collectFiles(outDir, (f) => /\.(html?|css|js)$/i.test(f));
  for (const file of textFiles) {
    const raw = readFileSync(file, 'utf-8');
    let out = raw;
    // 1. inter-page links `/<base>/<page>/` → `/preview/<slug>/<page>/index.html`
    for (const page of pages) {
      out = out
        .split(`${fromPrefix}/${page}/`)
        .join(`${toPrefix}/${page}/index.html`);
    }
    // 2. everything else `/<base>/...` → `/preview/<slug>/...` (assets)
    out = out.split(fromPrefix).join(toPrefix);
    if (out !== raw) writeFileSync(file, out);
  }

  console.log(
    `[build-preview] copied "${category}" → public${toPrefix}/ ` +
      `(rebased ${fromPrefix}/ → ${toPrefix}/, ${pages.length} page(s) linked to index.html)`,
  );
  return 1;
}

build();
