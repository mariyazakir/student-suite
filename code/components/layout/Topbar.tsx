/**
 * Topbar
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearSession, getSession } from '@/lib/auth/local-auth';

export default function Topbar() {
  const router = useRouter();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

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
    <header
      className="no-print sticky top-0 z-40 border-b border-[color:var(--topbar-border)] bg-[color:var(--topbar-bg)] px-3 sm:px-4 md:px-6 py-3"
      aria-label="Top navigation bar"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--topbar-hover-bg)] text-xs text-[color:var(--topbar-text)]"
            aria-hidden="true"
          >
            SS
          </div>
          <Link
            href="/"
            className="text-base sm:text-lg font-semibold text-[color:var(--topbar-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)] rounded"
          >
            Student Suite
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {sessionEmail ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-xs text-[color:var(--topbar-muted)] min-w-0">
                <div className="h-7 w-7 rounded-full bg-[color:var(--topbar-hover-bg)]" aria-hidden="true" />
                <span className="truncate max-w-[160px] lg:max-w-[220px]">{sessionEmail}</span>
              </div>
              <Link
                href="/settings"
                className="text-xs sm:text-sm px-2 py-1 rounded-md text-[color:var(--topbar-text)] bg-[color:var(--topbar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setSessionEmail(null);
                  router.replace('/login');
                }}
                className="text-xs sm:text-sm px-2 py-1 rounded-md text-[color:var(--topbar-text)] bg-[color:var(--topbar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs sm:text-sm px-2 py-1 rounded-md text-[color:var(--topbar-text)] bg-[color:var(--topbar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]"
            >
              Login
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
// Student Suite Topbar: Implemented