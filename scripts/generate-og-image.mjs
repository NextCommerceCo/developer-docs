/**
 * Renders the site-wide Open Graph card to public/og.png.
 *
 * One card for every page, referenced from the root layout's metadata. Committed
 * to git; re-run by hand only if the branding changes:
 *   node scripts/generate-og-image.mjs
 *
 * Brand: lockup from public/next-white.svg, watermark from next-icon-white.svg,
 * navy #030E1F and blue #3C7DFF from next-dark.svg. Inter is vendored in
 * app/og-assets/ under the SIL OFL because Satori needs real font data per weight.
 */

import { ImageResponse } from 'next/og.js';
import { readFileSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAVY = '#030E1F';
const BLUE = '#3C7DFF';

const svgUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const mark = readFileSync(join(ROOT, 'public/next-icon-white.svg'), 'utf8');
const el = (type, props) => ({ type, props });

const card = el('div', {
  style: {
    width: '1200px', height: '630px', display: 'flex', position: 'relative',
    backgroundColor: NAVY,
    backgroundImage: `linear-gradient(118deg, #0b1d3d 0%, ${NAVY} 48%, #01060f 100%)`,
    fontFamily: 'Inter', overflow: 'hidden',
  },
  children: [
    el('img', {
      src: svgUri(mark.replaceAll('white', '#102246')),
      width: 980, height: 980, style: { position: 'absolute', left: -300, top: -180 },
    }),
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'absolute', left: 560, top: 0, width: 560, height: '630px', textAlign: 'center',
      },
      children: [
        el('img', { src: svgUri(readFileSync(join(ROOT, 'public/next-white.svg'), 'utf8')), width: 300, height: 98 }),
        el('div', {
          style: {
            display: 'flex', marginTop: 34, color: '#ffffff', fontSize: 58, fontWeight: 800,
            lineHeight: 1.12, letterSpacing: '-0.025em',
          },
          children: 'Developer Documentation',
        }),
      ],
    }),
    el('img', {
      src: svgUri(mark.replaceAll('white', BLUE)),
      width: 46, height: 46, style: { position: 'absolute', right: 52, bottom: 46 },
    }),
  ],
});

const res = new ImageResponse(card, {
  width: 1200, height: 630,
  fonts: [{ name: 'Inter', weight: 800, style: 'normal', data: readFileSync(join(ROOT, 'app/og-assets/Inter-ExtraBold.ttf')) }],
});

writeFileSync(join(ROOT, 'public/og.png'), Buffer.from(await res.arrayBuffer()));
console.log('Wrote public/og.png');
