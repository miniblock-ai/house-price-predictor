import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '@/components/app2/FilterPanel';
import { defaultFilters } from '@/lib/app2/use-filter-params';

vi.mock('@/lib/app2/use-filter-params', () => ({
  useFilterParams: () => ({
    filters: defaultFilters,
    setFilter: vi.fn(),
    resetFilters: vi.fn(),
    toSegments: () => [],
    toListingsParams: () => ({}),
  }),
  FilterState: {},
  defaultFilters: {
    minPrice: '',
    maxPrice: '',
    minSchoolRating: '',
    maxSchoolRating: '',
    yearBuiltFrom: '',
    yearBuiltTo: '',
    minSizeSqft: '',
    maxSizeSqft: '',
  },
}));

describe('FilterPanel', () => {
  const defaultProps = {
    filters: {
      minPrice: '',
      maxPrice: '',
      minSchoolRating: '',
      maxSchoolRating: '',
      yearBuiltFrom: '',
      yearBuiltTo: '',
      minSizeSqft: '',
      maxSizeSqft: '',
    },
    onFilterChange: vi.fn(),
    onReset: vi.fn(),
  };

  it('renders all range inputs', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByTestId('sidebar.filters.price-min')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar.filters.price-max')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar.filters.school-min')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar.filters.school-max')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar.filters.year-min')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar.filters.year-max')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar.filters.size-min')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar.filters.size-max')).toBeInTheDocument();
  });

  it('calls onFilterChange when price min changes', () => {
    const onFilterChange = vi.fn();
    render(<FilterPanel {...defaultProps} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByTestId('sidebar.filters.price-min'), { target: { value: '200000' } });
    expect(onFilterChange).toHaveBeenCalledWith('minPrice', '200000');
  });

  it('shows reset button', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByTestId('sidebar.filters.reset')).toBeInTheDocument();
  });

  it('shows active filters when filters are set', () => {
    const filters = {
      minPrice: '200000',
      maxPrice: '',
      minSchoolRating: '',
      maxSchoolRating: '',
      yearBuiltFrom: '',
      yearBuiltTo: '',
      minSizeSqft: '',
      maxSizeSqft: '',
    };
    render(<FilterPanel {...defaultProps} filters={filters} />);
    expect(screen.getByText(/Price:/)).toBeInTheDocument();
  });

  it('shows clear all button when filters active', () => {
    const filters = { ...defaultProps.filters, minPrice: '200000' };
    render(<FilterPanel {...defaultProps} filters={filters} />);
    expect(screen.getByTestId('sidebar.filters.clear-all')).toBeInTheDocument();
  });

  it('calls onReset when reset is clicked', () => {
    const onReset = vi.fn();
    render(<FilterPanel {...defaultProps} onReset={onReset} />);
    fireEvent.click(screen.getByTestId('sidebar.filters.reset'));
    expect(onReset).toHaveBeenCalled();
  });
});
