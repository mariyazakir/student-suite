/**
 * Shared layout for public policy and info pages.
 * Renders a simple header with back link and consistent content area.
 */
'use client';

import Link from 'next/link';
import AdBanner from '@/components/ads/AdBanner';

export default function PolicyPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--app-bg,#f9fafb)] text-[color:var(--app-text,#111827)]">
      <header className="border-b border-[color:var(--sidebar-border,#e5e7eb)] bg-[color:var(--sidebar-bg,#ffffff)]">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[color:var(--topbar-muted)] hover:text-[color:var(--topbar-text)]"
          >
            ← Back to Home
          </Link>
          <span className="text-lg font-semibold text-[color:var(--topbar-text)]">Student Suite</span>
        </div>
      </header>
      <AdBanner position="top" className="border-b border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] py-2" />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)] mb-6">
          {title}
        </h1>
        <div className="prose prose-sm max-w-none text-[color:var(--topbar-muted)] whitespace-pre-line">
          {children}
        </div>
      </main>
      <AdBanner position="bottom" className="border-t border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] py-2" />
    </div>
  );
}
