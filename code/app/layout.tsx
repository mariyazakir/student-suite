/**
 * Root Layout
 * 
 * Main layout component for the Next.js app.
 * Wraps all pages with global styles and metadata.
 */

import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Resume Builder - AI-Powered ATS Optimization',
  description: 'Build ATS-optimized resumes with AI assistance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" spellCheck="true" dir="ltr">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden" style={{ direction: 'ltr' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
// Student Suite Global Layout: Implemented