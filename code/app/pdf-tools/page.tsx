/**
 * PDF Tools Home
 */

import Link from 'next/link';

const tools = [
  {
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one file.',
    href: '/pdf-tools/merge',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M6 3h9l3 3v3h-2V7h-3V4H8v16h5v2H6V3zm7 7h7v11H9v-9h4v-2zm-2 4h7v-2h-7v2zm0 4h7v-2h-7v2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Split PDF',
    description: 'Extract pages or split PDFs by range.',
    href: '/pdf-tools/split',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M4 4h7v16H4V4zm9 0h7v16h-7V4zm-6 7h2v2H7v-2zm9 0h2v2h-2v-2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Compress PDF',
    description: 'Reduce PDF file size without losing quality.',
    href: '/pdf-tools/compress',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6V3zm7 8h2v2h-2v-2zm-4 0h2v2H9v-2zm2 4h2v2h-2v-2zM8 9h8v1.5H8V9z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Images → PDF',
    description: 'Convert images into a single PDF.',
    href: '/pdf-tools/images-to-pdf',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M4 4h12v12H4V4zm2 8l2-2 3 3 2-2 3 3v2H6v-4zM18 7h2v10h-2V7zm-2 10v2H6v-2h10z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'PDF → Images',
    description: 'Export PDF pages as images.',
    href: '/pdf-tools/pdf-to-images',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6V3zm2 6h8v1.5H8V9zm0 4h5v1.5H8V13zm8 2h2v4h-2v-4zM4 7H2v10h2V7z" fill="currentColor" />
      </svg>
    ),
  },
];

export default function PdfToolsPage() {
  return (
    <div className="no-print">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
          PDF Tools
        </h1>
        <p className="text-sm text-[color:var(--topbar-muted)] mt-2">
          Merge, compress, and organize your PDFs quickly.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool) => (
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
              <Link
                href={tool.href}
                className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label={`Open ${tool.title}`}
              >
                Open
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
