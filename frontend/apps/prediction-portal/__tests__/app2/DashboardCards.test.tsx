import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DashboardCards } from '@/components/app2/DashboardCards';

afterEach(() => {
  vi.useRealTimers();
});

describe('DashboardCards', () => {
  it('renders 3 StatCards with loading skeleton initially', () => {
    vi.useFakeTimers();
    render(<DashboardCards region="All" />);
    const cards = screen.getAllByTestId('kpi-card');
    expect(cards).toHaveLength(3);
    expect(cards[0].getAttribute('data-loading')).toBe('true');
  });

  it('shows stat data after loading completes', async () => {
    vi.useFakeTimers();
    render(<DashboardCards region="All" />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const cards = screen.getAllByTestId('kpi-card');
    expect(cards[0].getAttribute('data-loading')).toBe('false');
    expect(screen.getByText('350,000')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('1,800')).toBeInTheDocument();
  });

  it('updates cards when region changes', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<DashboardCards region="All" />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('350,000')).toBeInTheDocument();

    rerender(<DashboardCards region="Downtown" />);

    // Should show loading again
    const cards = screen.getAllByTestId('kpi-card');
    expect(cards[0].getAttribute('data-loading')).toBe('true');

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('520,000')).toBeInTheDocument();
  });
});
