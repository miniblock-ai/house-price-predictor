import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavBar } from '../components/NavBar';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('NavBar', () => {
  it('renders three navigation links', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<NavBar />);
    const links = screen.getAllByTestId(/^nav-link-/);
    expect(links).toHaveLength(3);
  });

  it('renders links with correct hrefs', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<NavBar />);
    expect(screen.getByTestId('nav-link-dashboard')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('nav-link-app1')).toHaveAttribute('href', '/app1');
    expect(screen.getByTestId('nav-link-app2')).toHaveAttribute('href', '/app2');
  });

  it('renders link labels', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<NavBar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Estimator')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
  });

  it('applies active class to current route link', () => {
    vi.mocked(usePathname).mockReturnValue('/app1');
    render(<NavBar />);
    const app1Link = screen.getByTestId('nav-link-app1');
    const app2Link = screen.getByTestId('nav-link-app2');
    expect(app1Link.className).toContain('bg-white/20');
    expect(app2Link.className).not.toContain('bg-white/20');
  });

  it('marks Dashboard active on root route', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<NavBar />);
    const dashboardLink = screen.getByTestId('nav-link-dashboard');
    const app1Link = screen.getByTestId('nav-link-app1');
    expect(dashboardLink.className).toContain('bg-white/20');
    expect(app1Link.className).not.toContain('bg-white/20');
  });

  it('renders house icon logo', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<NavBar />);
    const logo = screen.getByTestId('nav-logo');
    expect(logo.querySelector('svg')).toBeInTheDocument();
  });

  it('renders user avatar', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<NavBar />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('has navigation landmark', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<NavBar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
