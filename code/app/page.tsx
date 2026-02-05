/**
 * Root route (/): public homepage when not logged in, dashboard when logged in.
 */

'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth/local-auth';
import HomePage from '@/components/landing/HomePage';
import { DashboardContent } from '@/components/landing/DashboardContent';

export default function RootPage() {
  const [session, setSession] = useState<ReturnType<typeof getSession> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getSession());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-sm text-[color:var(--topbar-muted)]">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <HomePage />;
  }

  return <DashboardContent />;
}
