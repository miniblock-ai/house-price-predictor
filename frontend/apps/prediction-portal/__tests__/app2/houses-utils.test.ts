import { describe, it, expect } from 'vitest';
import { parseSearchParams, getPageNumbers } from '@/lib/app2/houses-utils';

describe('parseSearchParams', () => {
  it('returns defaults for empty params', () => {
    const result = parseSearchParams({});
    expect(result).toEqual({
      min_price: undefined,
      max_price: undefined,
      min_size_sqft: undefined,
      max_size_sqft: undefined,
      page: 0,
      size: 20,
      sort: 'price,asc',
    });
  });

  it('parses price range from URL params', () => {
    const result = parseSearchParams({ priceMin: '300000', priceMax: '500000' });
    expect(result.min_price).toBe(300000);
    expect(result.max_price).toBe(500000);
  });

  it('parses sqft range', () => {
    const result = parseSearchParams({ sqftMin: '1000', sqftMax: '3000' });
    expect(result.min_size_sqft).toBe(1000);
    expect(result.max_size_sqft).toBe(3000);
  });

  it('parses page and sort', () => {
    const result = parseSearchParams({ page: '2', sort: 'price,desc' });
    expect(result.page).toBe(2);
    expect(result.sort).toBe('price,desc');
  });

  it('returns page 0 and default sort when not provided', () => {
    const result = parseSearchParams({});
    expect(result.page).toBe(0);
    expect(result.sort).toBe('price,asc');
  });

  it('ignores non-numeric values', () => {
    const result = parseSearchParams({ priceMin: 'abc' });
    expect(result.min_price).toBeUndefined();
  });

  it('parses zero as a valid value', () => {
    const result = parseSearchParams({ priceMin: '0' });
    expect(result.min_price).toBe(0);
  });
});

describe('getPageNumbers', () => {
  it('returns all pages when total <= 7', () => {
    expect(getPageNumbers(0, 3)).toEqual([0, 1, 2]);
    expect(getPageNumbers(0, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('shows first pages with ellipsis at end when on page 0', () => {
    const pages = getPageNumbers(0, 25);
    expect(pages).toEqual([0, 1, 2, '...', 24]);
  });

  it('shows pages around current with leading and trailing ellipsis', () => {
    const pages = getPageNumbers(12, 25);
    expect(pages).toEqual([0, '...', 11, 12, 13, '...', 24]);
  });

  it('shows last pages with ellipsis at start when near the end', () => {
    const pages = getPageNumbers(24, 25);
    expect(pages).toEqual([0, '...', 23, 24]);
  });

  it('shows no leading ellipsis when current is near beginning', () => {
    const pages = getPageNumbers(1, 25);
    expect(pages).toEqual([0, 1, 2, '...', 24]);
  });

  it('shows no trailing ellipsis when current is near end', () => {
    const pages = getPageNumbers(22, 25);
    expect(pages).toEqual([0, '...', 21, 22, 23, 24]);
  });

  it('handles single page', () => {
    expect(getPageNumbers(0, 1)).toEqual([0]);
  });

  it('handles two pages', () => {
    expect(getPageNumbers(0, 2)).toEqual([0, 1]);
  });
});
