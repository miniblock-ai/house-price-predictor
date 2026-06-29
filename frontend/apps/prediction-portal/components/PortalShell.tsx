'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from '@project/shared-ui';
import { SidebarProvider, useSidebar } from '@/lib/app2/SidebarContext';
import { Toaster } from 'sonner';

/** Hamburger button — reads sidebar context, only shows on /app2 pages */
function HamburgerBtn() {
  const pathname = usePathname();
  const { open, toggle } = useSidebar();

  // Show on any portal page that has a sidebar (/app1, /app2)
  if (!pathname.startsWith('/app1') && !pathname.startsWith('/app2')) return null;

  return (
    <button
      onClick={toggle}
      data-testid="navbar.menu-btn"
      className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white"
      aria-label="Toggle menu"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
      </svg>
    </button>
  );
}

function PortalShellInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <NavBar hamburger={<HamburgerBtn />} />
      </header>
      <main className="flex-1 pt-16">{children}</main>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PortalShellInner>{children}</PortalShellInner>
    </SidebarProvider>
  );
}
