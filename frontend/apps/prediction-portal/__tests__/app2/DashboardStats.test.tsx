import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardStats } from '@/components/app2/DashboardStats';

vi.mock('@/lib/app2/client', () => ({
  getStatistics: vi.fn(),
}));

import { getStatistics } from '@/lib/app2/client';

const mockStats = {
  total_listings: 1200,
  average_price: 450000,
  median_price: 420000,
  average_price_per_sqft: 225,
  price_distribution: [{ bucket: '0-300k', count: 200 }],
};

describe('DashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    vi.mocked(getStatistics).mockReturnValue(new Promise(() => {}));
    const { container } = render(<DashboardStats />);
    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBe(4);
  });

  it('renders 4 KPI cards on success', async () => {
    vi.mocked(getStatistics).mockResolvedValue(mockStats);
    render(<DashboardStats />);
    await waitFor(() => {
      const cards = screen.getAllByTestId(/^content\.stats\./);
      expect(cards).toHaveLength(4);
    });
    expect(screen.getByText('Total Listings')).toBeInTheDocument();
    expect(screen.getByText('Average Price')).toBeInTheDocument();
    expect(screen.getByText('Median Price')).toBeInTheDocument();
    expect(screen.getByText('Avg Price / sqft')).toBeInTheDocument();
  });

  it('shows error display on API failure', async () => {
    vi.mocked(getStatistics).mockRejectedValue(new Error('API error'));
    render(<DashboardStats />);
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
    expect(screen.getByText('API error')).toBeInTheDocument();
  });

  it('refetches when segments change', async () => {
    vi.mocked(getStatistics).mockResolvedValue(mockStats);
    const { rerender } = render(<DashboardStats segments={[]} />);
    await waitFor(() => expect(screen.getAllByTestId(/^content\.stats\./)).toHaveLength(4));

    vi.mocked(getStatistics).mockResolvedValue({ ...mockStats, total_listings: 500 });
    rerender(<DashboardStats segments={['price_range:300000-500000']} />);
    await waitFor(() => expect(getStatistics).toHaveBeenCalledWith(['price_range:300000-500000']));
  });

  it('formats currency values correctly', async () => {
    vi.mocked(getStatistics).mockResolvedValue(mockStats);
    render(<DashboardStats />);
    await waitFor(() => {
      expect(screen.getByText('$450,000')).toBeInTheDocument();
      expect(screen.getByText('$420,000')).toBeInTheDocument();
      expect(screen.getByText('$225')).toBeInTheDocument();
    });
  });
});
