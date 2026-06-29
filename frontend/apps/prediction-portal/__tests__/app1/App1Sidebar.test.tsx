import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarProvider, useSidebar } from '@/lib/app2/SidebarContext';
import { App1Sidebar } from '@/components/app1/App1Sidebar';

// ── Test harness ──────────────────────────────────────
// Simulates NavBar's hamburger button + App1Sidebar inside SidebarProvider
function ToggleButton() {
  const { toggle } = useSidebar();
  return <button data-testid="toggle-sidebar" onClick={toggle}>Toggle</button>;
}

function TestHarness() {
  return (
    <SidebarProvider>
      <ToggleButton />
      <App1Sidebar />
    </SidebarProvider>
  );
}

// ── Tests ─────────────────────────────────────────────

describe('App1Sidebar', () => {

  it('renders navigation links with testids', () => {
    render(<TestHarness />);

    expect(screen.getByTestId('nav-valuator')).toBeInTheDocument();
    expect(screen.getByTestId('nav-compare')).toBeInTheDocument();
  });

  it('has data-testid="sidebar" on the aside element', () => {
    render(<TestHarness />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('is hidden on mobile by default (closed state has -translate-x-full)', () => {
    render(<TestHarness />);

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.className).toContain('-translate-x-full');
  });

  it('shows sidebar when toggled via SidebarContext', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByTestId('toggle-sidebar'));

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.className).toContain('translate-x-0');
    expect(sidebar.className).not.toContain('-translate-x-full');
  });

  it('opens and closes sidebar with sequential toggles', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    // Open
    await user.click(screen.getByTestId('toggle-sidebar'));
    expect(screen.getByTestId('sidebar').className).toContain('translate-x-0');

    // Close
    await user.click(screen.getByTestId('toggle-sidebar'));
    expect(screen.getByTestId('sidebar').className).toContain('-translate-x-full');
  });

  it('shows backdrop overlay when sidebar is open on mobile', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    expect(screen.queryByTestId('sidebar.backdrop')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('toggle-sidebar'));

    expect(screen.getByTestId('sidebar.backdrop')).toBeInTheDocument();
  });

  it('closes sidebar when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByTestId('toggle-sidebar'));
    await user.click(screen.getByTestId('sidebar.backdrop'));

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.className).toContain('-translate-x-full');
  });

  it('closes sidebar when a nav link is clicked', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByTestId('toggle-sidebar'));
    await user.click(screen.getByTestId('nav-valuator'));

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.className).toContain('-translate-x-full');
  });

});
