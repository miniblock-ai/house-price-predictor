'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/lib/app2/SidebarContext';

const NAV_ITEMS = [
  {
    href: '/app1',
    label: 'Valuator',
    testId: 'nav-valuator',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
      </svg>
    ),
  },
  {
    href: '/app1/compare',
    label: 'Compare',
    testId: 'nav-compare',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    ),
  },
];

export function App1Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();

  const sidebarClass = open ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      {/* Backdrop — visible only on mobile when sidebar is open */}
      {open && (
        <div
          data-testid="sidebar.backdrop"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={close}
        />
      )}

      <aside
        data-testid="sidebar"
        className={`fixed top-16 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 overflow-y-auto
                    transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:z-auto lg:static lg:overflow-visible
                    ${sidebarClass}`}
      >
        <div className="p-4">
          {/* Mobile close button */}
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <span className="text-sm font-semibold text-neutral-500">Menu</span>
            <button
              onClick={close}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 pb-3 border-b border-neutral-100">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Value Estimator</p>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.testId}
                  onClick={close}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary border-r-2 border-primary'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
