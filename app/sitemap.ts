import { source } from '@/lib/source';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASE_URL = 'https://developers.nextcommerce.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/agent-setup/prompt.md`, priority: 0.8 },
    { url: `${BASE_URL}/evaluate/prompt.md`, priority: 0.8 },
    ...source.getPages().map((page) => ({
      url: `${BASE_URL}${page.url}`,
      lastModified: new Date(),
      priority: 0.7,
    })),
  ];
}
