import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegionFilter } from '@/components/app2/RegionFilter';

describe('RegionFilter', () => {
  it('renders a dropdown with region options', () => {
    render(<RegionFilter selected="All" onChange={() => {}} />);
    expect(screen.getByTestId('content.charts.region-filter')).toBeInTheDocument();
    expect(screen.getByTestId('content.charts.region-filter')).toHaveValue('All');
  });

  it('calls onChange when a different region is selected', () => {
    const handleChange = vi.fn();
    render(<RegionFilter selected="All" onChange={handleChange} />);
    fireEvent.change(screen.getByTestId('content.charts.region-filter'), { target: { value: 'Downtown' } });
    expect(handleChange).toHaveBeenCalledWith('Downtown');
  });

  it('renders all region options', () => {
    render(<RegionFilter selected="All" onChange={() => {}} />);
    const options = screen.getByTestId('content.charts.region-filter').querySelectorAll('option');
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain('All');
    expect(labels).toContain('Downtown');
    expect(labels).toContain('Suburb');
    expect(labels).toContain('Rural');
  });
});
