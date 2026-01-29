/**
 * Student Suite Dashboard
 */

import Link from 'next/link';

const tools = [
  {
    title: 'Resume Builder',
    description: 'Build ATS-ready resumes with live preview and templates.',
    href: '/tools/resume-builder',
    cta: 'Open',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6V3zm9 1.5V7h2.5L15 4.5zM8 10h8v1.5H8V10zm0 4h8v1.5H8V14zm0 4h5v1.5H8V18z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Notes → PDF',
    description: 'Convert study notes into clean, shareable PDFs.',
    href: '/tools/notes-to-pdf',
    cta: 'Open',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M4 4h16v14H7l-3 3V4zm3 4h10v1.5H7V8zm0 4h10v1.5H7V12z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Assignment Formatter',
    description: 'Format assignments to academic standards in seconds.',
    href: '/tools/assignment-formatter',
    cta: 'Open',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M7 3h10v2h3v16H4V5h3V3zm0 4h10V5H7v2zm1.5 5h7v1.5h-7V12zm0 4h7v1.5h-7V16z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'PDF Tools',
    description: 'Merge, compress, and organize your PDFs quickly.',
    href: '/pdf-tools',
    cta: 'Open',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6V3zm9 1.5V7h2.5L15 4.5zM8 12h2.5v1.5H8V12zm0 3h4.5v1.5H8V15zm0-6h8v1.5H8V9z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Templates',
    description: 'Browse professional templates for resumes and papers.',
    href: '/templates',
    cta: 'Open',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9 7v-9h7v9h-7z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Coming Soon',
    description: 'More student tools are on the way.',
    href: '#',
    cta: 'Coming Soon',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5h4v2h-6V7h2z" fill="currentColor" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="no-print">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
          Student Suite Dashboard
        </h1>
        <p className="text-sm text-[color:var(--topbar-muted)] mt-2">
          Choose a tool to get started.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const card = (
            <article
              key={tool.title}
              className="group rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 shadow-sm transition hover:bg-[color:var(--sidebar-hover-bg)] focus-within:ring-2 focus-within:ring-[color:var(--sidebar-focus)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--sidebar-hover-bg)] text-[color:var(--sidebar-text)]">
                  {tool.icon}
                </div>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[color:var(--topbar-text)]">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--topbar-muted)]">{tool.description}</p>
              <div className="mt-4">
                <span
                  className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)]"
                  aria-label={`${tool.title} ${tool.cta}`}
                >
                  {tool.cta}
                </span>
              </div>
            </article>
          );

          if (tool.href === '#') {
            return card;
          }

          return (
            <Link
              key={tool.title}
              href={tool.href}
              className="focus:outline-none focus:ring-0"
            >
              {card}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
// Student Suite Dashboard: Implemented