import LZString from 'lz-string';
import type { Config } from './types';
import { LAYOUT_STYLES, DEFAULT_CONFIG } from './constants';

function slugCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-/]/g, '');
}

/**
 * Build the URL of the static preview page for an example, with non-default
 * config values and optional edited code encoded as query params.
 *
 * Mirrors scripts/build-preview.mjs — the generated HTML reads these params at runtime.
 */
export function buildPreviewUrl(
  exampleId: string,
  exampleCode: string,
  userHtml: string,
  config: Config,
  fullPage = false,
): string {
  const slashIdx = exampleId.indexOf('/');
  const category = slashIdx === -1 ? '' : exampleId.slice(0, slashIdx);
  const name = slashIdx === -1 ? exampleId : exampleId.slice(slashIdx + 1);

  // Full-site pages are served verbatim from their copied directory
  // (build-preview.mjs preserves `<page>/index.html`). Link to the explicit
  // index.html — `next dev` serves public/ files at their exact path only, so a
  // bare directory URL 404s. Config/code overrides don't apply to a verbatim
  // document, so there are no query params to attach.
  if (fullPage) {
    return `/preview/${slugCategory(category)}/${name}/index.html`;
  }

  const path = category
    ? `/preview/${slugCategory(category)}/${name}.html`
    : `/preview/${name}.html`;

  const params = new URLSearchParams();
  if (userHtml !== exampleCode) params.set('code', encodeCode(userHtml));
  if (config.sdkHost) params.set('sdkHost', config.sdkHost);
  if (config.sdkVersion && config.sdkVersion !== DEFAULT_CONFIG.sdkVersion)
    params.set('sdkVersion', config.sdkVersion);
  if (config.debugger) params.set('debugger', 'true');
  if (config.debug) params.set('debug', 'true');

  // Also mirror the playground's own ?debug=true URL param (backward compat).
  if (!config.debug && typeof window !== 'undefined') {
    const playgroundParams = new URLSearchParams(window.location.search);
    if (playgroundParams.get('debug') === 'true') params.set('debug', 'true');
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function normalizeApiHost(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  try {
    const withProto = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const url = new URL(withProto);
    return `${url.protocol}//${url.host}/`;
  } catch {
    return trimmed;
  }
}

export function sdkHostLabel(sdkHost: string): string {
  try {
    return new URL(sdkHost).hostname;
  } catch {
    return sdkHost;
  }
}

export function encodeCode(code: string): string {
  return LZString.compressToEncodedURIComponent(code);
}

export function decodeCode(encoded: string): string | null {
  return LZString.decompressFromEncodedURIComponent(encoded);
}

export function pushPresetParam(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('preset', id);
  url.searchParams.delete('code');
  window.history.pushState({}, '', url.toString());
}

export function wrapLayout(html: string, layout: string): string {
  const style = LAYOUT_STYLES[layout];
  if (!style) return html;
  return `<div class="playground-wrapper" style="${style}">${html}</div>`;
}

export function buildIframeHtml(userHtml: string, config: Config, layout = ''): string {
  if (layout === 'full_page') {
    return userHtml;
  }

  const sdkUrl = config.sdkHost
    ? `${config.sdkHost.replace(/\/$/, '')}/loader.js`
    : config.sdkVersion === 'latest' || !config.sdkVersion
      ? 'https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@latest/dist/loader.js'
      : `https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v${config.sdkVersion}/dist/loader.js`;

  const nextConfig = {
    sdkHost: config.sdkHost,
    debug: config.debug || !!config.sdkHost,
    debugger: config.debugger,
  };

  return `<!DOCTYPE html>
<html lang="en" style="background: transparent !important;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark">
  <style>
    body { background: transparent !important; margin: 0; }
  </style>
  <script>
    window.nextConfig = ${JSON.stringify(nextConfig, null, 2)};
  <\/script>
  <script type="module" src="${sdkUrl}"><\/script>
</head>
<body data-next-sdk-loading="true">
  ${wrapLayout(userHtml, layout)}
</body>
</html>`;
}
