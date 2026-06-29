import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValuatorForm } from '@/components/app1/ValuatorForm';

describe('ValuatorForm', () => {
  it('renders sqft and bedrooms inputs and predict button', () => {
    render(<ValuatorForm />);
    expect(screen.getByTestId('input-sqft')).toBeInTheDocument();
    expect(screen.getByTestId('input-bedrooms')).toBeInTheDocument();
    expect(screen.getByTestId('predict-button')).toBeInTheDocument();
  });

  it('displays predicted price for valid input', async () => {
    const user = userEvent.setup();
    render(<ValuatorForm />);

    await user.type(screen.getByTestId('input-sqft'), '2000');
    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.click(screen.getByTestId('predict-button'));

    // 2000 * 150 + 3 * 10000 = 330000
    expect(screen.getByTestId('price-result')).toHaveTextContent('$330,000');
  });

  it('shows error for negative sqft', async () => {
    const user = userEvent.setup();
    render(<ValuatorForm />);

    await user.type(screen.getByTestId('input-sqft'), '-100');
    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.click(screen.getByTestId('predict-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Square footage must be greater than 0');
    expect(screen.queryByTestId('price-result')).not.toBeInTheDocument();
  });

  it('shows error for bedrooms less than 1', async () => {
    const user = userEvent.setup();
    render(<ValuatorForm />);

    await user.type(screen.getByTestId('input-sqft'), '1500');
    await user.type(screen.getByTestId('input-bedrooms'), '0');
    await user.click(screen.getByTestId('predict-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Bedrooms must be at least 1');
  });

  it('shows error for empty sqft', async () => {
    const user = userEvent.setup();
    render(<ValuatorForm />);

    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.click(screen.getByTestId('predict-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Square footage is required');
  });

  it('hides price when recalculating after clearing input', async () => {
    const user = userEvent.setup();
    render(<ValuatorForm />);

    await user.type(screen.getByTestId('input-sqft'), '2000');
    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.click(screen.getByTestId('predict-button'));

    expect(screen.getByTestId('price-result')).toBeInTheDocument();

    await user.clear(screen.getByTestId('input-sqft'));
    await user.click(screen.getByTestId('predict-button'));

    expect(screen.queryByTestId('price-result')).not.toBeInTheDocument();
  });
});
