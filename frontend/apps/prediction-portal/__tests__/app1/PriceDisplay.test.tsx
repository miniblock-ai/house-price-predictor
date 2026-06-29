import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceDisplay } from '@/components/app1/PriceDisplay';

describe('PriceDisplay', () => {
  it('renders formatted price when result is provided', () => {
    render(<PriceDisplay price={330000} sqft={2000} bedrooms={3} />);
    expect(screen.getByTestId('price-display')).toHaveTextContent('$330,000');
    expect(screen.getByTestId('price-display')).toHaveTextContent('2000 sqft');
    expect(screen.getByTestId('price-display')).toHaveTextContent('3 beds');
  });

  it('renders nothing when price is null', () => {
    const { container } = render(<PriceDisplay price={null} sqft={0} bedrooms={0} />);
    expect(container.textContent).toBe('');
  });
});
