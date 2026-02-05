/**
 * AppShell controls global layout visibility based on route.
 * Homepage (/) when not logged in: no Topbar, no Sidebar (homepage has its own header/footer).
 * Dashboard and tools: Topbar + Sidebar + Footer.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSession } from '@/lib/auth/local-auth';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import AuthGate from '@/components/auth/AuthGate';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AdBanner from '@/components/ads/AdBanner';

const AUTH_ROUTES = new Set(['/login', '/signup']);
const PUBLIC_PAGE_ROUTES = new Set([
  '/about', '/contact', '/terms', '/privacy', '/disclaimer', '/user-content', '/copyright', '/ads', '/refund',
]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    setHasSession(!!getSession());
  }, [pathname]);

  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const isHomepage = pathname === '/';
  const isPublicPage = PUBLIC_PAGE_ROUTES.has(pathname);
  const showMinimalLayout =
    isAuthRoute ||
    isPublicPage ||
    (isHomepage && hasSession !== true);

  if (showMinimalLayout) {
    return (
      <ThemeProvider>
        <div className="min-h-screen">{children}</div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <AdBanner position="top" className="border-b border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] py-2" />
        <div className="flex flex-1 flex-col md:flex-row min-w-0">
          <Sidebar />
          <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 min-w-0">
            <AuthGate>{children}</AuthGate>
          </main>
        </div>
        <AdBanner position="bottom" className="border-t border-[color:var(--topbar-border)] bg-[color:var(--sidebar-bg)] py-2" />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
