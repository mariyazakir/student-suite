/**
 * Public homepage for Student Suite.
 * Accessible without login. All CTAs route to /login.
 * Does not import any dashboard or protected components.
 */

'use client';

import Link from 'next/link';
import AdBanner from '@/components/ads/AdBanner';

const tools = [
  { title: 'Resume Builder', description: 'Build ATS-ready resumes with live preview and templates.' },
  { title: 'Notes → PDF', description: 'Convert study notes into clean, shareable PDFs.' },
  { title: 'Assignment Formatter', description: 'Format assignments to academic standards in seconds.' },
  { title: 'PDF Tools', description: 'Merge, compress, and organize your PDFs quickly.' },
  { title: 'Templates', description: 'Browse professional templates for resumes and papers.' },
];

const trustPoints = [
  'Free to use',
  'No watermark',
  'Student-friendly',
  'Works on desktop and mobile',
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--app-bg,#f9fafb)] text-[color:var(--app-text,#111827)]">
      <header className="border-b border-[color:var(--sidebar-border,#e5e7eb)] bg-[color:var(--sidebar-bg,#ffffff)]">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-[color:var(--topbar-text)]">Student Suite</span>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] hover:bg-[color:var(--sidebar-active-bg)]"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--topbar-text)]">
            Student Suite
          </h1>
          <p className="mt-2 text-lg text-[color:var(--topbar-muted)]">
            Free tools for students
          </p>
          <p className="mt-4 text-sm sm:text-base text-[color:var(--topbar-muted)] max-w-xl mx-auto">
            Build resumes, convert notes to PDF, format assignments, and manage PDFs—all in one place.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-text)] hover:opacity-90"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium border border-[color:var(--sidebar-border)] text-[color:var(--topbar-text)] hover:bg-[color:var(--sidebar-hover-bg)]"
            >
              Login
            </Link>
          </div>
        </section>

        {/* Tools preview */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-xl font-semibold text-[color:var(--topbar-text)] mb-4">
            Tools
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <li key={tool.title}>
                <Link
                  href="/login"
                  className="block rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 shadow-sm hover:bg-[color:var(--sidebar-hover-bg)]"
                >
                  <h3 className="font-semibold text-[color:var(--topbar-text)]">{tool.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--topbar-muted)]">{tool.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Trust */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-xl font-semibold text-[color:var(--topbar-text)] mb-4">
            Why Student Suite
          </h2>
          <ul className="space-y-2 text-sm text-[color:var(--topbar-muted)]">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span className="text-[color:var(--topbar-text)]" aria-hidden>•</span>
                {point}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <AdBanner position="bottom" className="border-t border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] py-2" />

      {/* Footer */}
      <footer className="border-t border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)]">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[color:var(--topbar-muted)]">
            <Link href="/about" className="hover:text-[color:var(--topbar-text)]">
              About
            </Link>
            <Link href="/privacy" className="hover:text-[color:var(--topbar-text)]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[color:var(--topbar-text)]">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-[color:var(--topbar-text)]">
              Contact
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[color:var(--topbar-muted)]">
            <Link href="/disclaimer" className="hover:text-[color:var(--topbar-text)]">Disclaimer</Link>
            <Link href="/user-content" className="hover:text-[color:var(--topbar-text)]">User Content</Link>
            <Link href="/copyright" className="hover:text-[color:var(--topbar-text)]">Copyright</Link>
            <Link href="/ads" className="hover:text-[color:var(--topbar-text)]">Ads</Link>
            <Link href="/refund" className="hover:text-[color:var(--topbar-text)]">Refund</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
