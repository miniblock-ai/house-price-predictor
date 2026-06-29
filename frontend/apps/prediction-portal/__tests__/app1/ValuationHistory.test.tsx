import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValuationHistory, saveToStorage, clearStorage } from '@/components/app1/ValuationHistory';
import { ComparisonProvider } from '@/lib/app1/ComparisonContext';
import type { ValuationResponse } from '@/lib/app1/types';

const MOCK_RESULT: ValuationResponse = {
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

const MOCK_RESULT_2: ValuationResponse = {
  ...MOCK_RESULT,
  predicted_price: 320000,
  input_features: { ...MOCK_RESULT.input_features, square_footage: 1500, bedrooms: 2 },
  timestamp: '2026-06-16T14:00:00Z',
};

function renderWithProvider(ui: React.ReactElement) {
  return render(<ComparisonProvider>{ui}</ComparisonProvider>);
}

describe('ValuationHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveToStorage / clearStorage (utility functions)', () => {
    it('saveToStorage writes to localStorage', () => {
      saveToStorage(MOCK_RESULT);
      const stored = JSON.parse(localStorage.getItem('app1-valuation-history') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].predicted_price).toBe(425000);
    });

    it('saveToStorage prepends new results', () => {
      saveToStorage(MOCK_RESULT_2);
      saveToStorage(MOCK_RESULT);
      const stored = JSON.parse(localStorage.getItem('app1-valuation-history') || '[]');
      expect(stored).toHaveLength(2);
      expect(stored[0].predicted_price).toBe(425000); // most recent first
    });

    it('clearStorage removes all data', () => {
      saveToStorage(MOCK_RESULT);
      clearStorage();
      expect(localStorage.getItem('app1-valuation-history')).toBeNull();
    });
  });

  describe('Component rendering', () => {
    it('shows empty state when no history exists', () => {
      renderWithProvider(<ValuationHistory />);
      expect(screen.getByTestId('history-empty')).toHaveTextContent(/no valuations/i);
    });

    it('renders history items from localStorage', () => {
      saveToStorage(MOCK_RESULT);
      saveToStorage(MOCK_RESULT_2);
      renderWithProvider(<ValuationHistory />);

      const items = screen.getAllByTestId('history-item');
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('$320,000'); // most recent first
      expect(items[1]).toHaveTextContent('$425,000');
    });

    it('calls onSelect when a history item is clicked', async () => {
      const onSelect = vi.fn();
      saveToStorage(MOCK_RESULT);
      const user = userEvent.setup();
      renderWithProvider(<ValuationHistory onSelect={onSelect} />);

      const historyItem = screen.getByTestId('history-item');
      await user.click(historyItem.querySelector('button')!);
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ predicted_price: 425000 }));
    });

    it('clears history and shows empty state', async () => {
      saveToStorage(MOCK_RESULT);
      saveToStorage(MOCK_RESULT_2);
      const onClear = vi.fn();
      const user = userEvent.setup();

      renderWithProvider(<ValuationHistory onClear={onClear} />);
      expect(screen.getAllByTestId('history-item')).toHaveLength(2);

      await user.click(screen.getByTestId('btn-clear-history'));

      expect(screen.getByTestId('history-empty')).toBeInTheDocument();
      expect(onClear).toHaveBeenCalledOnce();
    });
  });
});
