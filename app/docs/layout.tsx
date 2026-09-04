import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { AlgoliaDocSearch, AlgoliaDocSearchMobile } from '@/components/search';
import type { ReactNode } from 'react';
import { ChevronsLeftRightEllipsis, Megaphone, ShoppingBag, Puzzle, Webhook, Sparkles, FlaskConical } from 'lucide-react';
import type { SidebarTab } from 'fumadocs-ui/utils/get-sidebar-tabs';

const sectionMeta: Record<string, { icon: ReactNode; description: string; color: string }> = {
  '/docs/admin-api': {
    icon: <ChevronsLeftRightEllipsis size={16} />,
    description: 'Store management API',
    color: 'bg-blue-500/15 text-blue-500',
  },
  '/docs/campaigns': {
    icon: <Megaphone size={16} />,
    description: 'Campaign funnels & checkout',
    color: 'bg-orange-500/15 text-orange-500',
  },
  '/docs/storefront': {
    icon: <ShoppingBag size={16} />,
    description: 'Themes & storefronts',
    color: 'bg-green-500/15 text-green-500',
  },
  '/docs/apps': {
    icon: <Puzzle size={16} />,
    description: 'Build & distribute apps',
    color: 'bg-purple-500/15 text-purple-500',
  },
  '/docs/webhooks': {
    icon: <Webhook size={16} />,
    description: 'Subscribe to events',
    color: 'bg-pink-500/15 text-pink-500',
  },
  '/docs/skills': {
    icon: <Sparkles size={16} />,
    description: 'AI agent skills',
    color: 'bg-yellow-500/15 text-yellow-500',
  },
  '/docs/testing': {
    icon: <FlaskConical size={16} />,
    description: 'Test cards & safe QA',
    color: 'bg-cyan-500/15 text-cyan-500',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.getPageTree()}
      searchToggle={{
        enabled: true,
        components: { lg: <AlgoliaDocSearch />, sm: <AlgoliaDocSearchMobile /> },
      }}
      sidebar={{
        tabs: {
          transform(option: SidebarTab) {
            const url = option.url ?? '';
            if (/\/(?:\d{4}-\d{2}-\d{2}|unstable)\//.test(url)) return null;

            // Drop the urls Set so fumadocs falls back to prefix matching,
            // which correctly activates the section tab for versioned sub-paths
            // like /docs/admin-api/reference/2023-02-10/... that aren't in the tree.
            const { urls: _urls, ...rest } = option;

            const match = Object.entries(sectionMeta).find(([path]) => url.startsWith(path));
            if (match) {
              const [, { icon, description, color }] = match;
              return {
                ...rest,
                icon: (
                  <div className={`size-full rounded-md flex items-center justify-center [&_svg]:size-4 ${color}`}>
                    {icon}
                  </div>
                ),
                description,
              };
            }
            return rest;
          },
        },
      }}
    >
      {children}
    </DocsLayout>
  );
}
