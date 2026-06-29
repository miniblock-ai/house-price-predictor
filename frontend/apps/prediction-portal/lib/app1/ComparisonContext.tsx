'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { ValuationRequest, ValuationResponse } from './types';

/* ───────────── Types ───────────── */

export interface ComparisonItem {
  id: string;
  features: ValuationRequest;
  predicted_price: number;
  label: string;
  timestamp: string;
}

interface ComparisonContextValue {
  items: ComparisonItem[];
  addItem: (result: ValuationResponse) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isMax: boolean;
  count: number;
  isAdded: (features: ValuationRequest) => boolean;
}

/* ───────────── Constants ───────────── */

const STORAGE_KEY = 'app1-comparison';
const MAX_ITEMS = 3;

/* ───────────── Helpers ───────────── */

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function featuresKey(f: ValuationRequest): string {
  return `${f.square_footage}-${f.bedrooms}-${f.bathrooms}-${f.year_built}-${f.lot_size}-${f.distance_to_city_center}-${f.school_rating}`;
}

function loadFromStorage(): ComparisonItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ComparisonItem[];
  } catch {
    return [];
  }
}

function saveToStorage(items: ComparisonItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function sortByPrice(items: ComparisonItem[]): ComparisonItem[] {
  return [...items].sort((a, b) => b.predicted_price - a.predicted_price);
}

/* ───────────── Context ───────────── */

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

/* ───────────── Provider ───────────── */

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    setItems(sortByPrice(stored));
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (hydrated) {
      saveToStorage(items);
    }
  }, [items, hydrated]);

  const addItem = useCallback((result: ValuationResponse) => {
    setItems((prev) => {
      if (prev.length >= MAX_ITEMS) return prev;

      const newItem: ComparisonItem = {
        id: generateId(),
        features: result.input_features,
        predicted_price: result.predicted_price,
        timestamp: result.timestamp,
        label: `Property #${prev.length + 1}`,
      };

      return sortByPrice([...prev, newItem]);
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      // Re-label items after removal
      return next.map((item, i) => ({ ...item, label: `Property #${i + 1}` }));
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const isAdded = useCallback(
    (features: ValuationRequest): boolean => {
      const key = featuresKey(features);
      return items.some((item) => featuresKey(item.features) === key);
    },
    [items],
  );

  return (
    <ComparisonContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearAll,
        isMax: items.length >= MAX_ITEMS,
        count: items.length,
        isAdded,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

/* ───────────── Hook ───────────── */

export function useComparison(): ComparisonContextValue {
  const ctx = useContext(ComparisonContext);
  if (!ctx) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return ctx;
}
