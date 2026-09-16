import { RootProvider } from 'fumadocs-ui/provider/next';
import { GoogleTagManager } from '@next/third-parties/google';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { siteConfig } from '@/lib/config';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

// Set only in the production build env, so local dev and previews send nothing.
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export const metadata: Metadata = {
  // Required for Open Graph: without it Next emits relative image URLs, which
  // scrapers reject. Every route inherits the card below.
  metadataBase: new URL('https://developers.nextcommerce.com'),
  title: {
    template: `%s | Developers | ${siteConfig.companyName}`,
    default: `Developers | ${siteConfig.companyName}`,
  },
  openGraph: {
    type: 'website',
    siteName: `Developers | ${siteConfig.companyName}`,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${siteConfig.companyName} developer documentation` }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body className="flex min-h-screen flex-col font-sans">
        {/* data-theme alongside class: fumadocs styles key off `.dark`, but
            @docsearch/css scopes its whole dark theme to [data-theme=dark]. */}
        <RootProvider search={{ enabled: false }} theme={{ attribute: ['class', 'data-theme'] }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
