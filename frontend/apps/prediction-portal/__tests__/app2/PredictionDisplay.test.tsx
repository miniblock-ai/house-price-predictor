import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PredictionDisplay } from '@/components/app2/PredictionDisplay';

const mockResult = {
  predicted_price: 380000,
  baseline_price: 320000,
  delta: 60000,
  delta_percent: 18.75,
  input_features: { square_footage: 2500, bedrooms: 4, bathrooms: 2.5, year_built: 2008, lot_size: 9600, distance_to_city_center: 5, school_rating: 8.8 },
  baseline_features: { square_footage: 2000, bedrooms: 3, bathrooms: 2, year_built: 2005, lot_size: 8000, distance_to_city_center: 5, school_rating: 7.5 },
};

describe('PredictionDisplay', () => {
  it('renders predicted price', () => {
    render(<PredictionDisplay result={mockResult} />);
    expect(screen.getByTestId('content.what-if.result')).toBeInTheDocument();
    expect(screen.getByText('$380,000')).toBeInTheDocument();
  });

  it('shows positive delta with up arrow', () => {
    render(<PredictionDisplay result={mockResult} />);
    expect(screen.getByText((content) => content.includes('▲'))).toBeInTheDocument();
    expect(screen.getByText('+$60,000')).toBeInTheDocument();
  });

  it('shows negative delta with down arrow', () => {
    const negativeResult = { ...mockResult, delta: -25000, delta_percent: -7.81 };
    render(<PredictionDisplay result={negativeResult} />);
    expect(screen.getByText((content) => content.includes('▼'))).toBeInTheDocument();
    expect(screen.getByText('-$25,000')).toBeInTheDocument();
  });

  it('shows baseline price', () => {
    render(<PredictionDisplay result={mockResult} />);
    expect(screen.getByText('$320,000')).toBeInTheDocument();
  });
});

describe('WhatIfError', () => {
  it('renders error message with retry button', async () => {
    const { WhatIfError } = await import('@/components/app2/WhatIfError');
    const onRetry = () => {};
    render(<WhatIfError message="ML API unavailable" onRetry={onRetry} />);
    expect(screen.getByTestId('content.what-if.error')).toBeInTheDocument();
    expect(screen.getByText('ML API unavailable')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
