/**
 * Auth Gate - protects routes in Phase 1 auth.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/local-auth';

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/disclaimer',
  '/user-content',
  '/copyright',
  '/ads',
  '/refund',
]);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_ROUTES.has(pathname)) {
      setReady(true);
      return;
    }

    const session = getSession();
    if (!session) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-sm text-[color:var(--topbar-muted)]">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
// Student Suite Auth Phase 1: Implemented
