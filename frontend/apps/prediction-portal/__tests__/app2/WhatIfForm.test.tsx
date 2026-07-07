import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WhatIfForm } from '@/components/app2/WhatIfForm';

vi.mock('@/lib/app2/client', () => ({
  analyzeWhatIf: vi.fn(),
  getBaselineProperty: vi.fn(),
}));

import { analyzeWhatIf, getBaselineProperty } from '@/lib/app2/client';

const mockBaseline = {
  baseline_price: 240000,
  baseline_features: {
    square_footage: 1650,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 1997,
    lot_size: 7000,
    distance_to_city_center: 4,
    school_rating: 7.7,
  },
};

const mockResult = {
  predicted_price: 380000,
  baseline_price: 240000,
  delta: 140000,
  delta_percent: 58.33,
  input_features: { square_footage: 2500, bedrooms: 4, bathrooms: 2.5, year_built: 2008, lot_size: 9600, distance_to_city_center: 5, school_rating: 8.8 },
  baseline_features: { square_footage: 1650, bedrooms: 3, bathrooms: 2, year_built: 1997, lot_size: 7000, distance_to_city_center: 4, school_rating: 7.7 },
};

describe('WhatIfForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching baseline', () => {
    // Never resolve the baseline promise
    vi.mocked(getBaselineProperty).mockReturnValue(new Promise(() => {}));
    render(<WhatIfForm />);
    expect(screen.getByTestId('content.what-if.loading.baseline')).toBeInTheDocument();
  });

  it('shows error state when baseline fetch fails', async () => {
    vi.mocked(getBaselineProperty).mockRejectedValue(new Error('Backend unavailable'));
    render(<WhatIfForm />);
    await waitFor(() => {
      expect(screen.getByTestId('content.what-if.error')).toBeInTheDocument();
    });
    expect(screen.getByText(/Backend unavailable/)).toBeInTheDocument();
    // Run Analysis button should not be present when baseline fails
    expect(screen.queryByTestId('content.what-if.run')).not.toBeInTheDocument();
  });

  it('renders form with baseline values after loading', async () => {
    vi.mocked(getBaselineProperty).mockResolvedValue(mockBaseline);
    render(<WhatIfForm />);

    await waitFor(() => {
      expect(screen.getByTestId('content.what-if')).toBeInTheDocument();
    });
    expect(screen.getByTestId('content.what-if.run')).toBeInTheDocument();
    expect(screen.getByText('Square Footage')).toBeInTheDocument();
    expect(screen.getByText('Bedrooms')).toBeInTheDocument();
  });

  it('shows placeholder text before calculation', async () => {
    vi.mocked(getBaselineProperty).mockResolvedValue(mockBaseline);
    render(<WhatIfForm />);
    await waitFor(() => {
      expect(screen.getByText(/Adjust parameters/)).toBeInTheDocument();
    });
  });

  it('shows prediction display after successful calculation', async () => {
    vi.mocked(getBaselineProperty).mockResolvedValue(mockBaseline);
    vi.mocked(analyzeWhatIf).mockResolvedValue(mockResult);
    render(<WhatIfForm />);
    await waitFor(() => {
      expect(screen.getByTestId('content.what-if.run')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('content.what-if.run'));
    await waitFor(() => {
      expect(screen.getByTestId('content.what-if.result')).toBeInTheDocument();
    });
  });

  it('shows error display on API failure', async () => {
    vi.mocked(getBaselineProperty).mockResolvedValue(mockBaseline);
    vi.mocked(analyzeWhatIf).mockRejectedValue(new Error('ML API unavailable'));
    render(<WhatIfForm />);
    await waitFor(() => {
      expect(screen.getByTestId('content.what-if.run')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('content.what-if.run'));
    await waitFor(() => {
      expect(screen.getByTestId('content.what-if.error')).toBeInTheDocument();
    });
    expect(screen.getByText('ML API unavailable')).toBeInTheDocument();
  });

  it('has +/- stepper buttons for each field', async () => {
    vi.mocked(getBaselineProperty).mockResolvedValue(mockBaseline);
    render(<WhatIfForm />);
    await waitFor(() => {
      expect(screen.getByTestId('content.what-if')).toBeInTheDocument();
    });
    const minusButtons = screen.getAllByRole('button', { name: /Decrease/ });
    const plusButtons = screen.getAllByRole('button', { name: /Increase/ });
    expect(minusButtons.length).toBeGreaterThanOrEqual(7);
    expect(plusButtons.length).toBeGreaterThanOrEqual(7);
  });

  describe('Baseline reference behavior (E2E-07 / E2E-08)', () => {

    it('E2E-07: left baseline label stays fixed when stepper adjusts the right value', async () => {
      vi.mocked(getBaselineProperty).mockResolvedValue(mockBaseline);
      render(<WhatIfForm />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByTestId('content.what-if.form.square-footage')).toBeInTheDocument();
      });

      // Record left baseline label (fixed reference, uses data-testid from feat/baseline-data-testid)
      const leftLabel = screen.getByTestId('content.what-if.baseline.square-footage');
      const initialLeftText = leftLabel.textContent;

      // Click the "+" stepper multiple times
      const increaseBtn = screen.getByLabelText('Increase Square Footage');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(increaseBtn);
      }

      // Assert: left label unchanged
      expect(leftLabel.textContent).toBe(initialLeftText);

      // Assert: right value changed (higher than baseline)
      const rightValue = screen.getByTestId('content.what-if.form.square-footage');
      expect(rightValue.textContent).not.toBe(initialLeftText);
    });

    it('E2E-08: baseline_price remains the same across consecutive analyses', async () => {
      vi.mocked(getBaselineProperty).mockResolvedValue(mockBaseline);
      vi.mocked(analyzeWhatIf)
        .mockResolvedValueOnce({
          ...mockResult,
          predicted_price: 260000,
          delta: 20000,
          delta_percent: 8.33,
        })
        .mockResolvedValueOnce({
          ...mockResult,
          predicted_price: 270000,
          delta: 30000,
          delta_percent: 12.5,
        });

      render(<WhatIfForm />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByTestId('content.what-if.form.square-footage')).toBeInTheDocument();
      });

      // First run: increase square_footage by 500
      const increaseSqft = screen.getByLabelText('Increase Square Footage');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(increaseSqft);
      }

      // Click Run Analysis
      fireEvent.click(screen.getByTestId('content.what-if.run'));

      // Wait for result and record baseline_price
      await waitFor(() => {
        expect(screen.getByTestId('content.what-if.result.baseline-price')).toBeInTheDocument();
      });
      const firstBaselinePrice = screen.getByTestId('content.what-if.result.baseline-price').textContent;

      // Second run: increase bedrooms by 1
      const increaseBeds = screen.getByLabelText('Increase Bedrooms');
      fireEvent.click(increaseBeds);

      // Click Run Analysis again
      fireEvent.click(screen.getByTestId('content.what-if.run'));

      // Wait for result and verify baseline_price unchanged
      await waitFor(() => {
        expect(screen.getByTestId('content.what-if.result.baseline-price')).toBeInTheDocument();
      });
      const secondBaselinePrice = screen.getByTestId('content.what-if.result.baseline-price').textContent;

      expect(secondBaselinePrice).toBe(firstBaselinePrice);
      expect(analyzeWhatIf).toHaveBeenCalledTimes(2);
    });
  });
});
