import { describe, it, expect } from 'vitest';
import { buildFilterHref, parseSearchParams, buildApplyUrl, FILTER_KEYS, FIRST_PAGE_NO, getNextSort, isSortActive, countActiveFilters, getPageNumbers, isNavActive, buildCurrentParams, getDefaultSort } from '../houses-utils';

describe('buildFilterHref', () => {
  it('preserves existing params when adding a new one', () => {
    const params = new URLSearchParams('priceMin=200000&bedrooms=3');
    const href = buildFilterHref(params, 'sort', 'price,asc');
    expect(href).toContain('priceMin=200000');
    expect(href).toContain('bedrooms=3');
    expect(href).toContain('sort=');          // sort is set
    expect(href).toContain('price');          // sort value preserved
  });

  it('overwrites existing param with same key', () => {
    const params = new URLSearchParams('page=2&priceMin=200000');
    const href = buildFilterHref(params, 'page', '1');
    expect(href).toContain('page=1');
    expect(href).not.toContain('page=2');
    expect(href).toContain('priceMin=200000');
  });

  it('handles empty existing params', () => {
    const params = new URLSearchParams('');
    const href = buildFilterHref(params, 'sort', 'price,desc');
    expect(href).toMatch(/^\?sort=/);
  });
  it('returns string starting with ?', () => {
    const params = new URLSearchParams('priceMin=200000');
    const href = buildFilterHref(params, 'sort', 'price,asc');
    expect(href.startsWith('?')).toBe(true);
  });
});

describe('parseSearchParams', () => {
  it('maps school to min_school_rating', () => {
    const result = parseSearchParams({ school: '9' });
    expect(result.min_school_rating).toBe(9);
  });

  it('maps yearFrom/yearTo to year_built_from/to', () => {
    const result = parseSearchParams({ yearFrom: '2000', yearTo: '2020' });
    expect(result.year_built_from).toBe(2000);
    expect(result.year_built_to).toBe(2020);
  });

  it('maps priceMin/priceMax to min_price/max_price (already works)', () => {
    const result = parseSearchParams({ priceMin: '100000', priceMax: '500000' });
    expect(result.min_price).toBe(100000);
    expect(result.max_price).toBe(500000);
  });

  it('ignores undefined params', () => {
    const result = parseSearchParams({});
    expect(result.page).toBe(0);
    expect(result.sort).toBe('price,asc');
  });
});

describe('buildApplyUrl', () => {
  it('resets to first page (0-indexed)', () => {
    const url = buildApplyUrl({ priceMin: '200000' });
    expect(url).toContain('page=' + FIRST_PAGE_NO);
    expect(url).toContain('priceMin=200000');
  });

  it('excludes empty filter values', () => {
    const url = buildApplyUrl({ school: '' });
    expect(url).not.toContain('school=');
    expect(url).toContain('page=' + FIRST_PAGE_NO);
  });

  it('starts clean: only FILTER_KEYS and page', () => {
    const url = buildApplyUrl({ priceMin: '200000', sort: 'price,desc' });
    // sort is NOT in FILTER_KEYS, must not appear
    expect(url).not.toContain('sort=');
    expect(url).toContain('priceMin=200000');
  });

  it('uses FIRST_PAGE_NO constant', () => {
    expect(FIRST_PAGE_NO).toBe('0');
  });
  it('returns string starting with ?', () => {
    const url = buildApplyUrl({ priceMin: '200000' });
    expect(url.startsWith('?')).toBe(true);
  });
});

describe('getNextSort', () => {
  it('toggles asc → desc when same field', () => {
    expect(getNextSort('price,asc', 'price')).toBe('desc');
  });
  it('toggles desc → asc when same field', () => {
    expect(getNextSort('price,desc', 'price')).toBe('asc');
  });
  it('starts asc when different field', () => {
    expect(getNextSort('price,asc', 'bedrooms')).toBe('asc');
  });
  it('starts asc when different field from desc', () => {
    expect(getNextSort('price,desc', 'bedrooms')).toBe('asc');
  });
});

describe('isSortActive', () => {
  it('returns true when field matches', () => {
    expect(isSortActive('price,asc', 'price')).toBe(true);
  });
  it('returns false when field differs', () => {
    expect(isSortActive('price,asc', 'bedrooms')).toBe(false);
  });
});

describe('countActiveFilters', () => {
  it('returns 0 when no filters set', () => {
    expect(countActiveFilters({})).toBe(0);
  });
  it('counts priceMin as active', () => {
    expect(countActiveFilters({ priceMin: '200000' })).toBe(1);
  });
  it('counts priceMin or priceMax as one group', () => {
    expect(countActiveFilters({ priceMin: '200000' })).toBe(1);
    expect(countActiveFilters({ priceMax: '500000' })).toBe(1);
  });
  it('counts multiple active filters', () => {
    expect(countActiveFilters({ priceMin: '200000', bedrooms: '3', school: '9' })).toBe(3);
  });
  it('ignores empty string values', () => {
    expect(countActiveFilters({ priceMin: '', bedrooms: '3' })).toBe(1);
  });
});

describe('getPageNumbers', () => {
  it('returns all pages when totalPages <= 7', () => {
    expect(getPageNumbers(0, 3)).toEqual([0, 1, 2]);
  });
  it('shows start pages with trailing ellipsis for large page count', () => {
    const result = getPageNumbers(0, 25);
    expect(result[0]).toBe(0);
    expect(result).toContain('...');
    expect(result[result.length - 1]).toBe(24);
  });
  it('shows pages around current with ellipsis on both sides', () => {
    const result = getPageNumbers(12, 25);
    expect(result[0]).toBe(0);
    expect(result).toContain('...');
    expect(result[result.length - 1]).toBe(24);
    // Should have pages around 12
    expect(result).toContain(11);
    expect(result).toContain(12);
    expect(result).toContain(13);
  });
  it('shows end pages with leading ellipsis', () => {
    const result = getPageNumbers(23, 25);
    expect(result[0]).toBe(0);
    expect(result).toContain('...');
    expect(result[result.length - 1]).toBe(24);
  });
});

describe('isNavActive', () => {
  it('matches exact path', () => {
    expect(isNavActive('/app2', '/app2')).toBe(true);
  });
  it('matches child path', () => {
    expect(isNavActive('/app2/houses', '/app2/houses')).toBe(true);
  });
  it('parent does not match child', () => {
    expect(isNavActive('/app2/houses', '/app2')).toBe(false);
  });
  it('sibling does not match', () => {
    expect(isNavActive('/app2/houses', '/app2/what-if')).toBe(false);
  });
  it('root does not match everything', () => {
    expect(isNavActive('/app2', '/')).toBe(false);
  });
  it('handles query params in pathname', () => {
    expect(isNavActive('/app2/houses?page=1', '/app2/houses')).toBe(true);
  });
});

describe('buildCurrentParams', () => {
  it('includes string values', () => {
    const result = buildCurrentParams({ priceMin: '200000', bedrooms: '3' });
    expect(result.get('priceMin')).toBe('200000');
    expect(result.get('bedrooms')).toBe('3');
  });
  it('skips array values', () => {
    const result = buildCurrentParams({ key: ['a', 'b'] });
    expect(result.get('key')).toBeNull();
  });
  it('skips undefined values', () => {
    const result = buildCurrentParams({ key: undefined });
    expect(result.get('key')).toBeNull();
  });
  it('returns empty for empty input', () => {
    const result = buildCurrentParams({});
    expect(result.toString()).toBe('');
  });
});

describe('getDefaultSort', () => {
  it('returns sort param when valid', () => {
    expect(getDefaultSort('price,desc')).toBe('price,desc');
  });
  it('returns default when undefined', () => {
    expect(getDefaultSort(undefined)).toBe('price,asc');
  });
  it('returns default when empty string', () => {
    expect(getDefaultSort('')).toBe('price,asc');
  });
});
