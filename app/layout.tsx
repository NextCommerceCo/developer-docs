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
  title: {
    template: `%s | Developers | ${siteConfig.companyName}`,
    default: `Developers | ${siteConfig.companyName}`,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body className="flex min-h-screen flex-col font-sans">
        <RootProvider search={{ enabled: false }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
