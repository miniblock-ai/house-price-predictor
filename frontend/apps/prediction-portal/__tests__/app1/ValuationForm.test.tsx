import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValuationForm } from '@/components/app1/ValuationForm';
import { ComparisonProvider } from '@/lib/app1/ComparisonContext';

// Mock the client module
vi.mock('@/lib/app1/client', () => ({
  estimatePrice: vi.fn(),
  ApiClientError: class extends Error {
    constructor(message: string, public code: number, public httpStatus: number) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
}));

import { estimatePrice } from '@/lib/app1/client';

const mockEstimatePrice = estimatePrice as ReturnType<typeof vi.fn>;

const MOCK_RESULT = {
  predicted_price: 425000,
  currency: 'USD',
  input_features: {
    square_footage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 2010,
    lot_size: 5000,
    distance_to_city_center: 5.2,
    school_rating: 8,
  },
  model_version: 'LinearRegression',
  timestamp: '2026-06-15T10:30:00Z',
};

function renderWithProvider(ui: React.ReactElement) {
  return render(<ComparisonProvider>{ui}</ComparisonProvider>);
}

describe('ValuationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders all 7 input fields and submit button', () => {
    renderWithProvider(<ValuationForm />);

    const fieldIds = [
      'input-sqft',
      'input-bedrooms',
      'input-bathrooms',
      'input-year-built',
      'input-lot-size',
      'input-distance',
      'input-school-rating',
    ];

    fieldIds.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });

    expect(screen.getByTestId('btn-get-valuation')).toBeInTheDocument();
  });

  it('shows validation error for empty square footage', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ValuationForm />);

    await user.click(screen.getByTestId('btn-get-valuation'));

    expect(screen.getByTestId('error-validation')).toHaveTextContent('required');
    expect(mockEstimatePrice).not.toHaveBeenCalled();
  });

  it('shows validation error for out-of-range bedrooms', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ValuationForm />);

    await user.type(screen.getByTestId('input-sqft'), '2000');
    await user.type(screen.getByTestId('input-bedrooms'), '0');
    await user.type(screen.getByTestId('input-bathrooms'), '2');
    await user.type(screen.getByTestId('input-year-built'), '2010');
    await user.type(screen.getByTestId('input-lot-size'), '5000');
    await user.type(screen.getByTestId('input-distance'), '5');
    await user.type(screen.getByTestId('input-school-rating'), '8');
    await user.click(screen.getByTestId('btn-get-valuation'));

    expect(screen.getByTestId('error-validation')).toHaveTextContent('Bedrooms must be between 1 and 10');
    expect(mockEstimatePrice).not.toHaveBeenCalled();
  });

  it('calls estimatePrice with valid inputs and displays result', async () => {
    mockEstimatePrice.mockResolvedValueOnce(MOCK_RESULT);

    const user = userEvent.setup();
    renderWithProvider(<ValuationForm />);

    await user.type(screen.getByTestId('input-sqft'), '2000');
    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.type(screen.getByTestId('input-bathrooms'), '2');
    await user.type(screen.getByTestId('input-year-built'), '2010');
    await user.type(screen.getByTestId('input-lot-size'), '5000');
    await user.type(screen.getByTestId('input-distance'), '5');
    await user.type(screen.getByTestId('input-school-rating'), '8');
    await user.click(screen.getByTestId('btn-get-valuation'));

    expect(mockEstimatePrice).toHaveBeenCalledOnce();
    expect(screen.getByTestId('result-estimated-value')).toHaveTextContent('$425,000');
  });

  it('disables button during loading and shows spinner text', async () => {
    let resolvePromise!: (v: unknown) => void;
    mockEstimatePrice.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

    const user = userEvent.setup();
    renderWithProvider(<ValuationForm />);

    await user.type(screen.getByTestId('input-sqft'), '2000');
    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.type(screen.getByTestId('input-bathrooms'), '2');
    await user.type(screen.getByTestId('input-year-built'), '2010');
    await user.type(screen.getByTestId('input-lot-size'), '5000');
    await user.type(screen.getByTestId('input-distance'), '5');
    await user.type(screen.getByTestId('input-school-rating'), '8');
    await user.click(screen.getByTestId('btn-get-valuation'));

    const button = screen.getByTestId('btn-get-valuation');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/calculating/i);

    resolvePromise(MOCK_RESULT);
  });

  it('displays error message when API call fails', async () => {
    mockEstimatePrice.mockRejectedValueOnce(new Error('ML prediction service unreachable'));

    const user = userEvent.setup();
    renderWithProvider(<ValuationForm />);

    await user.type(screen.getByTestId('input-sqft'), '2000');
    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.type(screen.getByTestId('input-bathrooms'), '2');
    await user.type(screen.getByTestId('input-year-built'), '2010');
    await user.type(screen.getByTestId('input-lot-size'), '5000');
    await user.type(screen.getByTestId('input-distance'), '5');
    await user.type(screen.getByTestId('input-school-rating'), '8');
    await user.click(screen.getByTestId('btn-get-valuation'));

    expect(screen.getByTestId('error-api')).toHaveTextContent('unreachable');
    expect(screen.queryByTestId('result-estimated-value')).not.toBeInTheDocument();
  });

  it('clears previous error when form is resubmitted', async () => {
    mockEstimatePrice.mockRejectedValueOnce(new Error('First failure'));

    const user = userEvent.setup();
    renderWithProvider(<ValuationForm />);
    await user.type(screen.getByTestId('input-sqft'), '2000');
    await user.type(screen.getByTestId('input-bedrooms'), '3');
    await user.type(screen.getByTestId('input-bathrooms'), '2');
    await user.type(screen.getByTestId('input-year-built'), '2010');
    await user.type(screen.getByTestId('input-lot-size'), '5000');
    await user.type(screen.getByTestId('input-distance'), '5');
    await user.type(screen.getByTestId('input-school-rating'), '8');
    await user.click(screen.getByTestId('btn-get-valuation'));

    expect(screen.getByTestId('error-api')).toHaveTextContent('First failure');

    mockEstimatePrice.mockResolvedValueOnce(MOCK_RESULT);

    await user.click(screen.getByTestId('btn-get-valuation'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('result-estimated-value')).toHaveTextContent('$425,000');
    });
    expect(screen.queryByTestId('error-api')).not.toBeInTheDocument();
  });
});
