import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { siteConfig } from '@/lib/config';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/next-dark.svg" alt={siteConfig.companyName} width={451} height={148} className="h-auto w-24 dark:hidden" />
          <img src="/next-white.svg" alt={siteConfig.companyName} width={451} height={148} className="hidden h-auto w-24 dark:block" />
        </>
      ),
    },
    githubUrl: siteConfig.githubUrl,
  };
}
