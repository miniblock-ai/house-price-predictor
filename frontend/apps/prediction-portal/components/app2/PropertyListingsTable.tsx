'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Skeleton, ErrorDisplay } from '@project/shared-ui';
import { getListings } from '@/lib/app2/client';
import type {
  PaginatedListingsDto,
  PropertyListingDto,
  ListingsFilterParams,
} from '@/lib/app2/types';

type SortField = keyof Pick<
  PropertyListingDto,
  | 'price'
  | 'square_footage'
  | 'bedrooms'
  | 'bathrooms'
  | 'year_built'
  | 'lot_size'
  | 'school_rating'
>;
type SortDir = 'asc' | 'desc';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-US');

interface ColumnDef {
  key: SortField;
  label: string;
  hideOnMobile?: boolean;
  format?: (v: number) => string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'price', label: 'Price', format: (v) => currency.format(v) },
  { key: 'square_footage', label: 'Sq Ft', format: (v) => number.format(v) },
  { key: 'bedrooms', label: 'Beds' },
  { key: 'bathrooms', label: 'Baths' },
  { key: 'year_built', label: 'Year', hideOnMobile: true },
  { key: 'lot_size', label: 'Lot Size', hideOnMobile: true, format: (v) => number.format(v) },
  { key: 'school_rating', label: 'School Rating', hideOnMobile: true },
];

interface PropertyListingsTableProps {
  filterParams: ListingsFilterParams;
  onDataChange?: (data: PaginatedListingsDto | null) => void;
  /** Optional elements rendered in the table header bar (e.g. export buttons) */
  headerExtra?: React.ReactNode;
}

export function PropertyListingsTable({
  filterParams,
  onDataChange,
  headerExtra,
}: PropertyListingsTableProps) {
  const [data, setData] = useState<PaginatedListingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const mountedRef = useRef(true);

  const fetchListings = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: ListingsFilterParams = {
      ...filterParams,
      page,
      size: pageSize,
      sort: `${sortField},${sortDir}`,
    };
    getListings(params)
      .then((res) => {
        if (mountedRef.current) {
          setData(res);
          onDataChange?.(res);
        }
      })
      .catch((e) => {
        if (mountedRef.current) setError(e instanceof Error ? e.message : 'Unknown error');
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [filterParams, page, sortField, sortDir, onDataChange]);

  useEffect(() => {
    mountedRef.current = true;
    setPage(0);
    return () => {
      mountedRef.current = false;
    };
  }, [filterParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchListings} />;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-3">
          <Skeleton height="2.5rem" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="2rem" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <div
        data-testid="content.property-listings.table"
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center"
      >
        <p className="text-sm text-neutral-400">No listings found.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="content.property-listings.table"
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header bar — matching prototype layout */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-neutral-900">Property Listings</h3>
        {headerExtra && <div className="flex gap-2">{headerExtra}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-slate-50">
              {COLUMNS.map((col) => (
                <SortableHeader
                  key={col.key}
                  label={col.label}
                  active={sortField === col.key}
                  dir={sortField === col.key ? sortDir : undefined}
                  hideOnMobile={col.hideOnMobile}
                  onClick={() => handleSort(col.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {data.content.map((row) => (
              <tr
                key={row.id}
                className="border-b border-neutral-50 hover:bg-slate-50 transition-colors"
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-neutral-700 ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                  >
                    {col.format ? col.format(row[col.key]) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        data-testid="content.property-listings.pagination"
        className="flex items-center justify-between px-6 py-3 border-t border-gray-200"
      >
        <span className="text-xs text-neutral-500">
          Page {page + 1} of {Math.max(1, data.total_pages)}
        </span>
        <div className="flex gap-2">
          <button
            data-testid="content.property-listings.pagination.prev"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors text-neutral-700"
          >
            Prev
          </button>
          <button
            data-testid="content.property-listings.pagination.next"
            disabled={page >= data.total_pages - 1}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors text-neutral-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  active: boolean;
  dir?: SortDir;
  hideOnMobile?: boolean;
  onClick: () => void;
}

function SortableHeader({ label, active, dir, hideOnMobile, onClick }: SortableHeaderProps) {
  return (
    <th
      className={`sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer select-none hover:text-primary-500 transition-colors ${hideOnMobile ? 'hidden sm:table-cell' : ''}`}
      onClick={onClick}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && <span className="text-primary-500">{dir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );
}
