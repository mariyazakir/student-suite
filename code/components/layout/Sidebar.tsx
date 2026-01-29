/**
 * Sidebar Navigation
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSession } from '@/lib/auth/local-auth';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Resume Builder', href: '/tools/resume-builder', icon: 'resume' },
  { label: 'Notes → PDF', href: '/tools/notes-to-pdf', icon: 'notes' },
  { label: 'Assignment Formatter', href: '/tools/assignment-formatter', icon: 'assignment' },
  { label: 'PDF Tools', href: '/pdf-tools', icon: 'pdf' },
  { label: 'Templates', href: '/templates', icon: 'templates' },
];

const bottomItems: Array<{ label: string; href: string; icon: keyof typeof icons }> = [];

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor" />
    </svg>
  ),
  resume: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6V3zm9 1.5V7h2.5L15 4.5zM8 10h8v1.5H8V10zm0 4h8v1.5H8V14zm0 4h5v1.5H8V18z" fill="currentColor" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M4 4h16v14H7l-3 3V4zm3 4h10v1.5H7V8zm0 4h10v1.5H7V12z" fill="currentColor" />
    </svg>
  ),
  assignment: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M7 3h10v2h3v16H4V5h3V3zm0 4h10V5H7v2zm1.5 5h7v1.5h-7V12zm0 4h7v1.5h-7V16z" fill="currentColor" />
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6V3zm9 1.5V7h2.5L15 4.5zM8 12h2.5v1.5H8V12zm0 3h4.5v1.5H8V15zm0-6h8v1.5H8V9z" fill="currentColor" />
    </svg>
  ),
  templates: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9 7v-9h7v9h-7z" fill="currentColor" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const isToolRoute = pathname.startsWith('/tools') || pathname.startsWith('/templates');

  useEffect(() => {
    const updateSession = () => {
      const session = getSession();
      setSessionEmail(session?.email || null);
    };

    updateSession();
    window.addEventListener('storage', updateSession);
    return () => window.removeEventListener('storage', updateSession);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`no-print w-full border-b md:border-b-0 md:border-r border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] ${
        isToolRoute ? 'md:w-16 lg:w-16' : 'md:w-60 lg:w-64'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3 md:hidden">
        <span className="text-sm font-semibold text-[color:var(--sidebar-text)]">Menu</span>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-md px-2 py-1 text-xs text-[color:var(--sidebar-text)] bg-[color:var(--sidebar-hover-bg)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
          aria-expanded={isOpen}
          aria-controls="sidebar-nav"
        >
          {isOpen ? 'Close' : 'Open'}
        </button>
      </div>

      <div
        id="sidebar-nav"
        className={`px-2 pb-3 md:pb-4 flex flex-col min-h-0 md:min-h-[calc(100vh-3.5rem)] overflow-y-auto ${
          isOpen ? 'block' : 'hidden'
        } md:flex`}
      >
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)] ${
                    isActive
                      ? 'bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-text)]'
                      : 'text-[color:var(--sidebar-text)] hover:bg-[color:var(--sidebar-hover-bg)]'
                  }`}
                >
                  <span className="text-[color:inherit]">{icons[item.icon as keyof typeof icons]}</span>
                  <span className={`${isToolRoute ? 'sr-only' : 'max-[420px]:sr-only'}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto pt-4">
          <ul className="space-y-1">
            {bottomItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)] ${
                      isActive
                        ? 'bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-text)]'
                        : 'text-[color:var(--sidebar-text)] hover:bg-[color:var(--sidebar-hover-bg)]'
                    }`}
                  >
                    <span className="text-[color:inherit]">{icons[item.icon as keyof typeof icons]}</span>
                    <span className={`${isToolRoute ? 'sr-only' : 'max-[420px]:sr-only'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {sessionEmail && !isToolRoute && (
            <div className="mt-3 rounded-lg border border-[color:var(--sidebar-border)] px-3 py-2 text-xs text-[color:var(--sidebar-text)]">
              <div className="font-medium">Signed in</div>
              <div className="text-[color:var(--sidebar-muted)]">{sessionEmail}</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
// Student Suite Sidebar: Implemented