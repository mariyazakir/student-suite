/**
 * Root Layout
 * 
 * Main layout component for the Next.js app.
 * Wraps all pages with global styles and metadata.
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Resume Builder - AI-Powered ATS Optimization',
  description: 'Build ATS-optimized resumes with AI assistance',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover', /* safe area for notched devices */
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" spellCheck="true" dir="ltr">
      <head>
        <meta name="monetag" content="a10f75d607ac8955cd537c2cee690d2c" />
        {/* Monetag Multitag */}
        <script
          src="https://quge5.com/88/tag.min.js"
          data-zone="208689"
          async
          data-cfasync="false"
        />
      </head>
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden" style={{ direction: 'ltr' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
// Student Suite Global Layout: Implemented