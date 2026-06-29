'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useComparison } from '@/lib/app1/ComparisonContext';
import type { ValuationResponse } from '@/lib/app1/types';

const STORAGE_KEY = 'app1-valuation-history';

interface ValuationHistoryProps {
  onSelect?: (result: ValuationResponse) => void;
  onClear?: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

export function saveToStorage(result: ValuationResponse): void {
  const stored = getFromStorage();
  stored.unshift(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function getFromStorage(): ValuationResponse[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function ValuationHistory({ onSelect, onClear }: ValuationHistoryProps) {
  const [results, setResults] = useState<ValuationResponse[]>([]);
  const { addItem, isAdded, isMax } = useComparison();

  useEffect(() => {
    setResults(getFromStorage());
  }, []);

  const handleClear = useCallback(() => {
    clearStorage();
    setResults([]);
    onClear?.();
  }, [onClear]);

  if (results.length === 0) {
    return (
      <div data-testid="history-empty" className="text-center py-8 text-neutral-500 text-sm">
        No valuations yet. Start by entering a property above.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">Valuation History</h3>
        <button
          data-testid="btn-clear-history"
          onClick={handleClear}
          className="text-xs text-neutral-400 hover:text-error transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-2">
        {results.map((r, i) => {
          const f = r.input_features;
          const alreadyInCompare = isAdded(r.input_features);
          return (
            <div
              key={`${r.timestamp}-${i}`}
              data-testid="history-item"
              className="bg-white rounded-card border border-neutral-100 p-3 hover:border-primary-200 hover:shadow-sm transition-all"
            >
              <button
                onClick={() => onSelect?.(r)}
                className="w-full text-left cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary-700">
                    {formatPrice(r.predicted_price)}
                  </span>
                  <span className="text-xs text-neutral-400">{formatDate(r.timestamp)}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {f.square_footage.toLocaleString()} sqft · {f.bedrooms}BR · {f.bathrooms}BA
                </p>
              </button>
              <div className="mt-2 pt-2 border-t border-neutral-50 flex justify-end">
                <button
                  onClick={() => {
                    addItem(r);
                    toast.success('Added to comparison');
                  }}
                  disabled={alreadyInCompare || isMax}
                  data-testid="btn-compare-from-history"
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    alreadyInCompare
                      ? 'text-neutral-400 bg-neutral-50 cursor-default'
                      : 'text-primary hover:text-primary-700 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {alreadyInCompare ? 'Added ✓' : 'Compare'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
