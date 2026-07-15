import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { siteConfig } from '@/lib/config';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/next-dark.svg" alt={siteConfig.companyName} width={79} height={26} className="dark:hidden" />
          <img src="/next-white.svg" alt={siteConfig.companyName} width={79} height={26} className="hidden dark:block" />
        </>
      ),
    },
    githubUrl: siteConfig.githubUrl,
  };
}
