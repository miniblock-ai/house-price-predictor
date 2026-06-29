/**
 * Parse URL search params into API-ready filter params for the houses page.
 */
export function parseSearchParams(params: Record<string, string | string[] | undefined>) {
  const toNum = (k: string) => {
    const v = params[k];
    if (v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  return {
    min_price: toNum('priceMin'),
    max_price: toNum('priceMax'),
    min_school_rating: toNum('school'),
    min_size_sqft: toNum('sqftMin'),
    max_size_sqft: toNum('sqftMax'),
    year_built_from: toNum('yearFrom'),
    year_built_to: toNum('yearTo'),
    page: toNum('page') ?? 0,
    size: 20,
    sort: (params.sort as string) || 'price,asc',
  };
}

/* ───────── Apply URL builder (shared with component) ───────── */

export const FILTER_KEYS = [
  'priceMin',
  'priceMax',
  'sqftMin',
  'sqftMax',
  'bedrooms',
  'bathrooms',
  'yearFrom',
  'yearTo',
  'lotMin',
  'lotMax',
  'distMin',
  'distMax',
  'school',
] as const;

/** Page numbers are 0-indexed in the URL. FIRST_PAGE_NO = 0 means displayed page 1. */
export const FIRST_PAGE_NO = '0';

export type Filters = Record<string, string>;

/**
 * Build the URL query string that `apply()` pushes.
 * Only includes non-empty FILTER_KEYS + page reset.
 */
export function buildApplyUrl(filters: Filters): `?${string}` {
  const params = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = filters[k];
    if (v) params.set(k, v);
  }
  params.set('page', FIRST_PAGE_NO);
  return `?${params.toString()}`;
}

/* ───────── Sort helpers ───────── */

/**
 * Given current sort state and a field, return the next sort direction.
 * Same field toggles asc↔desc; different field starts asc.
 */
export function getNextSort(currentSort: string, field: string): string {
  const [currentField, currentDir] = currentSort.split(',');
  const isActive = currentField === field;
  return isActive && currentDir === 'asc' ? 'desc' : 'asc';
}

/** Returns true when *field* is the currently sorted column. */
export function isSortActive(currentSort: string, field: string): boolean {
  const [currentField] = currentSort.split(',');
  return currentField === field;
}

/* ───────── Filter helpers ───────── */

const FILTER_GROUPS: string[][] = [
  ['priceMin', 'priceMax'],
  ['sqftMin', 'sqftMax'],
  ['bedrooms'],
  ['bathrooms'],
  ['yearFrom', 'yearTo'],
  ['lotMin', 'lotMax'],
  ['distMin', 'distMax'],
  ['school'],
];

/** Count how many filter groups have at least one non-empty value. */
export function countActiveFilters(filters: Filters): number {
  return FILTER_GROUPS.filter((group) => group.some((k) => filters[k])).length;
}

/**
 * Build a query-string href that preserves all existing params
 * while setting/overwriting a single key-value pair.
 * Example:
 *   buildFilterHref('?priceMin=200000', 'sort', 'price,asc')
 *   → "?priceMin=200000&sort=price,asc"
 */
export function buildFilterHref(
  currentParams: URLSearchParams,
  key: string,
  value: string
): `?${string}` {
  const params = new URLSearchParams(currentParams.toString());
  params.set(key, value);
  return `?${params.toString()}`;
}

/**
 * Generate pagination page numbers with ellipsis.
 * Returns an array of page indices (0-based) or '...' for gaps.
 *
 * Examples:
 *   getPageNumbers(0, 25) → [0, 1, 2, '...', 24]          (25 pages, on page 1)
 *   getPageNumbers(5, 25) → [0, '...', 4, 5, 6, '...', 24] (25 pages, on page 6)
 *   getPageNumbers(0, 3)  → [0, 1, 2]                       (3 pages)
 */
export function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: (number | '...')[] = [0];

  if (currentPage <= 3) {
    // Near start: show pages 1,2 and add trailing ellipsis if needed
    for (let i = 1; i <= Math.min(2, totalPages - 2); i++) pages.push(i);
    if (currentPage + 3 < totalPages - 1) pages.push('...');
  } else {
    // Not near start: add leading ellipsis and pages around current
    pages.push('...');
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage + 2 < totalPages - 1) pages.push('...');
  }

  pages.push(totalPages - 1);
  return pages;
}

/* ───────── Nav helpers ───────── */

/**
 * Check if a navigation link should be highlighted for the current pathname.
 * Parent paths (e.g. /app2) use exact match to avoid matching child paths.
 * Other paths use prefix match to support sub-routes.
 */
export function isNavActive(pathname: string, href: string): boolean {
  // Strip query params for matching
  const path = pathname.split('?')[0];
  if (href === '/app2') return path === '/app2';
  return path === href || path.startsWith(href + '/');
}

/* ───────── SearchParams helpers ───────── */

/**
 * Build URLSearchParams from Next.js searchParams, filtering out array/undefined values.
 */
export function buildCurrentParams(
  searchParams: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') params.set(k, v);
  }
  return params;
}

/** Return the sort param or default to 'price,asc'. */
export function getDefaultSort(sort: string | undefined): string {
  return sort || 'price,asc';
}
