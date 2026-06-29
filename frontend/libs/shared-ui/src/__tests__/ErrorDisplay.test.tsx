import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from '../components/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders error message', () => {
    render(<ErrorDisplay message="Something went wrong" />);
    expect(screen.getByTestId('error-display')).toHaveTextContent('Something went wrong');
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorDisplay message="Error" onRetry={() => {}} />);
    expect(screen.getByTestId('error-display')).toHaveTextContent('Try Again');
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorDisplay message="Error" />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={handleRetry} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
