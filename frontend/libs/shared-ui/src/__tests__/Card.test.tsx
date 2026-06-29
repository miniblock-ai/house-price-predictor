import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../components/Card';

describe('Card', () => {
  it('renders children content', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByTestId('card')).toContainHTML('<p>Card content</p>');
  });

  it('renders title when provided', () => {
    render(<Card title="My Title"><span>body</span></Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('does not render title element when title is not provided', () => {
    render(<Card><span>body</span></Card>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders title as an h2 element', () => {
    render(<Card title="Heading"><span>body</span></Card>);
    const heading = screen.getByText('Heading');
    expect(heading.tagName).toBe('H2');
  });

  it('merges additional className', () => {
    render(<Card className="custom-card"><span>body</span></Card>);
    expect(screen.getByTestId('card')).toHaveClass('custom-card');
  });
});
