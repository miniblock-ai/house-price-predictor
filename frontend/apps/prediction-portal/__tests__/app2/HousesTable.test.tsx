import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HousesTableSkeleton } from '@/components/app2/HousesTable';

describe('HousesTableSkeleton', () => {
  it('renders loading placeholder divs', () => {
    const { container } = render(<HousesTableSkeleton />);
    // Should render multiple animated pulse divs
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });

  it('has the correct container classes', () => {
    const { container } = render(<HousesTableSkeleton />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('bg-white');
    expect(outer?.className).toContain('rounded-xl');
    expect(outer?.className).toContain('shadow-sm');
  });
});
