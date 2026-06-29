import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/Button';

describe('Button', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByTestId('button')).toHaveTextContent('Click me');
  });

  it('renders as a button element by default', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByTestId('button').tagName).toBe('BUTTON');
  });

  it('renders with primary variant by default', () => {
    render(<Button>Primary</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('data-variant', 'primary');
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('data-variant', 'secondary');
  });

  it('renders as a link when href is provided', () => {
    render(<Button href="/app1">Go to App1</Button>);
    const element = screen.getByTestId('button');
    expect(element.tagName).toBe('A');
    expect(element).toHaveAttribute('href', '/app1');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled attribute and prevents click', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    expect(screen.getByTestId('button')).toBeDisabled();
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('merges additional className prop', () => {
    render(<Button className="extra-class">Styled</Button>);
    expect(screen.getByTestId('button')).toHaveClass('extra-class');
  });
});
