'use client';

import { DocSearchAI, type DocSearchAIProps } from '@docsearch/react';
// Deep path, not the bare specifier: TypeScript 7 enables
// noUncheckedSideEffectImports by default, and only the explicit .css file
// matches Next's `declare module '*.css'` (next/types/global.d.ts).
import '@docsearch/css/dist/style.css';
import { Search } from 'lucide-react';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
const index = process.env.NEXT_PUBLIC_ALGOLIA_INDEX;

// NEXT_PUBLIC_* values are inlined at build time. They're set in the deploy
// environment but not in a local checkout, and DocSearchAI throws without them.
// Render nothing when unconfigured so `npm run dev` works with no secrets.
const isConfigured = Boolean(appId && apiKey && index);

const dsProps: DocSearchAIProps = {
  appId: appId!,
  indices: [index!],
  apiKey: apiKey!,
  // Agent Studio agent UUID ("Documentation assistant"). The old DocSearch
  // assistant id was not a UUID, so Agent Studio rejected it with a 422.
  askAi: { agentId: 'ec5f9a67-1eca-4b55-a7d3-6b5fa60f396a' },
  // DocSearch defaults this to false, which is the one value that opts out of
  // Algolia's automatic events collection. Set it so view/click events are sent.
  insights: true,
};

/** Full search bar for the desktop sidebar. */
export function AlgoliaDocSearch() {
  if (!isConfigured) return null;
  return <DocSearchAI {...dsProps} />;
}

/** Icon-only search button for the mobile header — clicks the hidden DocSearch button. */
export function AlgoliaDocSearchMobile() {
  if (!isConfigured) return null;
  return (
    <>
      <div className="hidden"><DocSearchAI {...dsProps} /></div>
      <button
        type="button"
        aria-label="Search"
        className="p-2 rounded-md text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors"
        onClick={() => {
          // DocSearch renders a hidden button — click it to open the modal
          const btn = document.querySelector<HTMLButtonElement>('.DocSearch-Button');
          btn?.click();
        }}
      >
        <Search className="size-4.5" />
      </button>
    </>
  );
}
