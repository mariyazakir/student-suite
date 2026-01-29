/**
 * AppShell controls global layout visibility based on route.
 */

'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import AuthGate from '@/components/auth/AuthGate';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const AUTH_ROUTES = new Set(['/login', '/signup']);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  if (isAuthRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex flex-1 flex-col md:flex-row min-w-0">
          <Sidebar />
          <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 min-w-0">
            <AuthGate>{children}</AuthGate>
          </main>
        </div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
