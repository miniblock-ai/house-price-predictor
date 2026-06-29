'use client';

import { usePathname } from 'next/navigation';
import { useSidebar } from '@/lib/app2/SidebarContext';
import { useFilterContext } from '@/lib/app2/FilterContext';
import { FilterPanel } from './FilterPanel';
import { isNavActive } from '@/lib/app2/houses-utils';

const NAV_ITEMS = [
  {
    href: '/app2',
    label: 'Market Analysis',
    testId: 'sidebar.menu.market',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
        />
      </svg>
    ),
  },
  {
    href: '/app2/houses',
    label: 'Houses',
    testId: 'sidebar.menu.houses',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: '/app2/what-if',
    label: 'What-If Analysis',
    testId: 'sidebar.menu.whatif',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
] as const;

export function App2Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();
  const { filters, setFilter, resetFilters } = useFilterContext();
  const isDashboard = pathname === '/app2';

  const sidebarClass = open ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      {/* Backdrop — visible only on mobile when menu is open */}
      {open && (
        <div
          data-testid="sidebar.backdrop"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`fixed top-16 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 overflow-y-auto
                    transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:z-auto lg:static lg:overflow-visible lg:transition-none
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
              <svg
                className="w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Page title */}
          <div className="mb-4 pb-3 border-b border-neutral-100">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Market Analysis
            </p>
          </div>

          {/* Nav links */}
          <nav data-testid="sidebar.menu" className="space-y-1" aria-label="App 2 navigation">
            {NAV_ITEMS.map(({ href, label, testId, icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <a
                  key={href}
                  href={href}
                  data-testid={testId}
                  onClick={close}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary border-r-2 border-primary'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  {icon}
                  {label}
                </a>
              );
            })}
          </nav>

          {/* Filters — only on dashboard (border, title, testid handled by FilterPanel internally) */}
          {isDashboard && (
            <FilterPanel filters={filters} onFilterChange={setFilter} onReset={resetFilters} />
          )}
        </div>
      </aside>
    </>
  );
}
