'use client';

import { useState, useCallback } from 'react';
import type { ListingsFilterParams } from './types';

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  minSchoolRating: string;
  maxSchoolRating: string;
  yearBuiltFrom: string;
  yearBuiltTo: string;
  minSizeSqft: string;
  maxSizeSqft: string;
}

const defaultFilters: FilterState = {
  minPrice: '',
  maxPrice: '',
  minSchoolRating: '',
  maxSchoolRating: '',
  yearBuiltFrom: '',
  yearBuiltTo: '',
  minSizeSqft: '',
  maxSizeSqft: '',
};

export function useFilterParams() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  /** Convert filter state to segment array for /statistics endpoint */
  const toSegments = useCallback((): string[] => {
    const segments: string[] = [];
    if (filters.minPrice || filters.maxPrice) {
      segments.push(`price_range:${filters.minPrice || '0'}-${filters.maxPrice || '9999999'}`);
    }
    if (filters.minSchoolRating || filters.maxSchoolRating) {
      segments.push(
        `school_rating:${filters.minSchoolRating || '0'}-${filters.maxSchoolRating || '10'}`
      );
    }
    if (filters.yearBuiltFrom || filters.yearBuiltTo) {
      segments.push(
        `year_built:${filters.yearBuiltFrom || '1800'}-${filters.yearBuiltTo || '2030'}`
      );
    }
    if (filters.minSizeSqft || filters.maxSizeSqft) {
      segments.push(`size_range:${filters.minSizeSqft || '0'}-${filters.maxSizeSqft || '999999'}`);
    }
    return segments;
  }, [filters]);

  /** Convert filter state to ListingsFilterParams for /listings endpoint */
  const toListingsParams = useCallback((): ListingsFilterParams => {
    return {
      min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
      max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      min_school_rating: filters.minSchoolRating ? Number(filters.minSchoolRating) : undefined,
      max_school_rating: filters.maxSchoolRating ? Number(filters.maxSchoolRating) : undefined,
      year_built_from: filters.yearBuiltFrom ? Number(filters.yearBuiltFrom) : undefined,
      year_built_to: filters.yearBuiltTo ? Number(filters.yearBuiltTo) : undefined,
      min_size_sqft: filters.minSizeSqft ? Number(filters.minSizeSqft) : undefined,
      max_size_sqft: filters.maxSizeSqft ? Number(filters.maxSizeSqft) : undefined,
    };
  }, [filters]);

  return { filters, setFilter, resetFilters, toSegments, toListingsParams };
}
