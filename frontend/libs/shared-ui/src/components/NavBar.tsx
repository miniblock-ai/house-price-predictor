'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', testId: 'nav-link-dashboard' },
  { href: '/app1', label: 'Estimator', testId: 'nav-link-app1' },
  { href: '/app2', label: 'Analysis', testId: 'nav-link-app2' },
] as const;

interface NavBarProps {
  /** Optional hamburger menu button rendered before the brand (for mobile sidebar toggle) */
  hamburger?: ReactNode;
}

export function NavBar({ hamburger }: NavBarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      data-testid="navbar"
      className="bg-primary text-white h-16 fixed top-0 z-50 shadow-sm"
      style={{ left: 0, width: '100vw' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hamburger}
          <a href="/" className="flex items-center gap-2" data-testid="navbar.brand">
            {/* House icon SVG */}
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-lg font-semibold tracking-tight">HousePrice Predictor</span>
          </a>
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, testId }) => {
              const active = isActive(href);
              return (
                <a
                  key={href}
                  href={href}
                  data-testid={testId}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'text-white bg-white/20 border-b-2 border-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>
        <div
          data-testid="navbar.avatar"
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium shrink-0"
        >
          JD
        </div>
      </div>
    </nav>
  );
}
