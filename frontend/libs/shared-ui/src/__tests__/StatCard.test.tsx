import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../components/StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Avg Price" value="$350,000" />);
    expect(screen.getByText('Avg Price')).toBeInTheDocument();
    expect(screen.getByText('$350,000')).toBeInTheDocument();
  });

  it('renders numeric value with locale formatting', () => {
    render(<StatCard label="Count" value={1234567} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('shows up trend indicator', () => {
    render(<StatCard label="Price" value={100} trend="up" />);
    expect(screen.getByText((content) => content.includes('▲'))).toBeInTheDocument();
  });

  it('shows down trend indicator', () => {
    render(<StatCard label="Price" value={90} trend="down" />);
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(<StatCard label="Price" value={0} loading />);
    const el = container.querySelector('[data-testid="kpi-card"]');
    expect(el?.getAttribute('data-loading')).toBe('true');
  });

  it('does not show loading state when loading is false', () => {
    const { container } = render(<StatCard label="Price" value={100} loading={false} />);
    const el = container.querySelector('[data-testid="kpi-card"]');
    expect(el?.getAttribute('data-loading')).toBe('false');
  });
});
