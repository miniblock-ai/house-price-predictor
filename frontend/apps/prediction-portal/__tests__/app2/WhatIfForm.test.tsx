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
    expect(screen.getByTestId('content.what-if.loading')).toBeInTheDocument();
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
});
