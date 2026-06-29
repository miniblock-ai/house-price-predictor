import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PropertyListingsTable } from '@/components/app2/PropertyListingsTable';

vi.mock('@/lib/app2/client', () => ({
  getListings: vi.fn(),
}));

import { getListings } from '@/lib/app2/client';

const mockListings = {
  content: [
    { id: 1, square_footage: 2000, bedrooms: 3, bathrooms: 2, price: 450000, year_built: 2005, lot_size: 8000, distance_to_city_center: 5, school_rating: 8.2 },
    { id: 2, square_footage: 1500, bedrooms: 2, bathrooms: 1, price: 320000, year_built: 2010, lot_size: 5000, distance_to_city_center: 8, school_rating: 7.5 },
  ],
  page: 0, size: 20, total_elements: 2, total_pages: 1,
};

describe(PropertyListingsTable, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    vi.mocked(getListings).mockReturnValue(new Promise(() => {}));
    const { container } = render(<PropertyListingsTable filterParams={{}} />);
    expect(container.querySelectorAll('[data-testid="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders table with data on success', async () => {
    vi.mocked(getListings).mockResolvedValue(mockListings);
    render(<PropertyListingsTable filterParams={{}} />);
    await waitFor(() => {
      expect(screen.getByTestId('content.property-listings.table')).toBeInTheDocument();
    });
    expect(screen.getByText('$450,000')).toBeInTheDocument();
    expect(screen.getByText('$320,000')).toBeInTheDocument();
  });

  it('shows empty state when no listings', async () => {
    vi.mocked(getListings).mockResolvedValue({ content: [], page: 0, size: 20, total_elements: 0, total_pages: 0 });
    render(<PropertyListingsTable filterParams={{}} />);
    await waitFor(() => {
      expect(screen.getByText('No listings found.')).toBeInTheDocument();
    });
  });

  it('shows error display on API failure', async () => {
    vi.mocked(getListings).mockRejectedValue(new Error('Failed to fetch'));
    render(<PropertyListingsTable filterParams={{}} />);
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('renders pagination controls', async () => {
    vi.mocked(getListings).mockResolvedValue({
      content: [mockListings.content[0]], page: 0, size: 1, total_elements: 3, total_pages: 3,
    });
    render(<PropertyListingsTable filterParams={{}} />);
    await waitFor(() => {
      expect(screen.getByTestId('content.property-listings.pagination.prev')).toBeInTheDocument();
      expect(screen.getByTestId('content.property-listings.pagination.next')).toBeInTheDocument();
    });
  });

  it('disables prev button on first page', async () => {
    vi.mocked(getListings).mockResolvedValue(mockListings);
    render(<PropertyListingsTable filterParams={{}} />);
    await waitFor(() => {
      expect(screen.getByTestId('content.property-listings.pagination.prev')).toBeDisabled();
    });
  });

  it('renders all expected columns', async () => {
    vi.mocked(getListings).mockResolvedValue(mockListings);
    render(<PropertyListingsTable filterParams={{}} />);
    await waitFor(() => {
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Sq Ft')).toBeInTheDocument();
      expect(screen.getByText('Beds')).toBeInTheDocument();
      expect(screen.getByText('Baths')).toBeInTheDocument();
    });
  });

  it('calls onDataChange with fetched data', async () => {
    vi.mocked(getListings).mockResolvedValue(mockListings);
    const onDataChange = vi.fn();
    render(<PropertyListingsTable filterParams={{}} onDataChange={onDataChange} />);
    await waitFor(() => {
      expect(onDataChange).toHaveBeenCalledWith(mockListings);
    });
  });

  it('has sticky table header on mobile', async () => {
    vi.mocked(getListings).mockResolvedValue(mockListings);
    render(<PropertyListingsTable filterParams={{}} />);
    await waitFor(() => {
      expect(screen.getByTestId('content.property-listings.table')).toBeInTheDocument();
    });
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((th) => {
      expect(th.className).toContain('sticky');
      expect(th.className).toContain('top-0');
    });
  });
});
