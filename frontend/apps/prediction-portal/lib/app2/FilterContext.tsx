'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFilterParams } from './use-filter-params';
import type { FilterState } from './use-filter-params';
import type { ListingsFilterParams } from './types';

interface FilterContextValue {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  debouncedSegments: string[];
  debouncedListingsParams: ListingsFilterParams;
  currentListingsParams: ListingsFilterParams;
}

const FilterContext = createContext<FilterContextValue | null>(null);

const DEBOUNCE_MS = 300;

export function FilterProvider({ children }: { children: ReactNode }) {
  const { filters, setFilter, resetFilters, toSegments, toListingsParams } = useFilterParams();
  const [debouncedSegments, setDebouncedSegments] = useState<string[]>([]);
  const [debouncedListingsParams, setDebouncedListingsParams] = useState<ListingsFilterParams>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSegments(toSegments());
      setDebouncedListingsParams(toListingsParams());
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [filters, toSegments, toListingsParams]);

  const currentListingsParams = useMemo(() => toListingsParams(), [filters, toListingsParams]);

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, debouncedSegments, debouncedListingsParams, currentListingsParams }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within FilterProvider');
  return ctx;
}
