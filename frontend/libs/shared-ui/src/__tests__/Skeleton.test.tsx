import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../components/Skeleton';

describe('Skeleton', () => {
  it('renders a single skeleton element by default', () => {
    render(<Skeleton />);
    const el = screen.getByTestId('skeleton');
    expect(el).toBeInTheDocument();
  });

  it('applies width and height styles', () => {
    render(<Skeleton width="200px" height="3rem" />);
    const el = screen.getByTestId('skeleton');
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('3rem');
  });

  it('applies pulse animation class', () => {
    render(<Skeleton />);
    const el = screen.getByTestId('skeleton');
    expect(el.className).toContain('animate-pulse');
  });
});
