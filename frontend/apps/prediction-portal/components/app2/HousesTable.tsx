import Link from 'next/link';
import { getListings } from '@/lib/app2/client';
import {
  parseSearchParams,
  getPageNumbers,
  buildFilterHref,
  getNextSort,
  isSortActive,
  buildCurrentParams,
  getDefaultSort,
} from '@/lib/app2/houses-utils';
import type { PropertyListingDto } from '@/lib/app2/types';

const fmtCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const fmtNumber = new Intl.NumberFormat('en-US');

const COLUMNS: {
  key: string;
  label: string;
  align: 'right' | 'center';
  hide: string;
  format?: (v: number) => string;
}[] = [
  { key: 'id', label: '#', align: 'center', hide: '' },
  {
    key: 'price',
    label: 'Price',
    align: 'right',
    hide: '',
    format: (v: number) => fmtCurrency.format(v),
  },
  {
    key: 'square_footage',
    label: 'Sq Ft',
    align: 'right',
    hide: '',
    format: (v: number) => fmtNumber.format(v),
  },
  { key: 'bedrooms', label: 'Beds', align: 'right', hide: '' },
  { key: 'bathrooms', label: 'Baths', align: 'right', hide: '' },
  { key: 'year_built', label: 'Year Built', align: 'right', hide: 'hidden sm:table-cell' },
  {
    key: 'lot_size',
    label: 'Lot Size',
    align: 'right',
    hide: 'hidden lg:table-cell',
    format: (v: number) => fmtNumber.format(v),
  },
  {
    key: 'distance_to_city_center',
    label: 'Distance',
    align: 'right',
    hide: 'hidden lg:table-cell',
  },
  { key: 'school_rating', label: 'School', align: 'right', hide: 'hidden lg:table-cell' },
];

/* ───────── HousesTableSkeleton ───────── */

export function HousesTableSkeleton() {
  return (
    <div className="mx-6 mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3" />
        <div className="h-10 bg-gray-50 rounded animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />
        ))}
        <div className="h-8 bg-gray-50 rounded animate-pulse w-1/2 mx-auto" />
      </div>
    </div>
  );
}

/* ───────── Sortable header (client component) ───────── */

function SortLink({
  field,
  label,
  currentSort,
  currentParams,
  hide,
}: {
  field: string;
  label: string;
  currentSort: string;
  currentParams: URLSearchParams;
  hide: string;
}) {
  const nextDir = getNextSort(currentSort, field);
  const active = isSortActive(currentSort, field);
  const href = buildFilterHref(currentParams, 'sort', `${field},${nextDir}`);

  return (
    <th
      className={`${hide} sticky top-0 z-10 bg-gray-50 px-4 py-3 text-${field === 'id' ? 'center' : 'right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-1 hover:text-primary-500 transition-colors cursor-pointer"
      >
        {label}
        {active && (
          <span className="text-primary-500 text-[10px]">
            {currentSort.endsWith('asc') ? '↑' : '↓'}
          </span>
        )}
      </Link>
    </th>
  );
}

/* ───────── Pagination (client component) ───────── */

function Pagination({
  currentPage,
  totalPages,
  currentParams,
}: {
  currentPage: number;
  totalPages: number;
  currentParams: URLSearchParams;
}) {
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (currentPage > 2) pages.push('...');
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++)
      pages.push(i);
    if (currentPage < totalPages - 3) pages.push('...');
    pages.push(totalPages - 1);
  }

  return (
    <div
      className="px-6 py-3 border-t border-gray-200 flex items-center justify-between"
      data-testid="houses.pagination"
    >
      <span className="text-xs text-gray-500">{totalPages} pages</span>
      <div className="flex items-center gap-1">
        {currentPage > 0 && (
          <Link
            href={buildFilterHref(currentParams, 'page', String(currentPage - 1))}
            className="px-2.5 py-1.5 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        )}
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildFilterHref(currentParams, 'page', String(p))}
              className={`w-8 h-8 flex items-center justify-center text-xs rounded-md transition-colors ${
                p === currentPage
                  ? 'bg-primary text-white font-medium'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p + 1}
            </Link>
          )
        )}
        {currentPage < totalPages - 1 && (
          <Link
            href={buildFilterHref(currentParams, 'page', String(currentPage + 1))}
            className="px-2.5 py-1.5 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ───────── Table row ───────── */

function Row({ row, columns }: { row: PropertyListingDto; columns: typeof COLUMNS }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {columns.map((col) => (
        <td
          key={col.key}
          className={`${col.hide} px-4 py-3 whitespace-nowrap text-sm ${
            col.key === 'id' ? 'text-gray-500 text-center' : 'text-gray-500 text-right'
          }`}
        >
          {col.key === 'id'
            ? row.id
            : col.format
              ? col.format(row[col.key as keyof PropertyListingDto] as number)
              : row[col.key as keyof PropertyListingDto]}
        </td>
      ))}
    </tr>
  );
}

/* ───────── Main table component ───────── */

interface HousesTableProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export async function HousesTable({ searchParams }: HousesTableProps) {
  const filters = parseSearchParams(searchParams);
  const sort = getDefaultSort(searchParams.sort as string | undefined);

  // Build a URLSearchParams for href construction (preserves all filters)
  const currentParams = buildCurrentParams(searchParams);

  let data;
  try {
    data = await getListings(filters);
  } catch {
    return (
      <div className="mx-6 mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-sm text-red-500">Failed to load listings. Please try again.</p>
      </div>
    );
  }

  const currentPage = filters.page ?? 0;

  return (
    <div
      className="mx-6 mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      data-testid="houses.table"
    >
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Property Listings</h3>
        <span className="text-xs text-gray-400">
          {data.total_elements.toLocaleString()} properties
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((col) => (
                <SortLink
                  key={col.key}
                  field={col.key}
                  label={col.label}
                  currentSort={sort}
                  currentParams={currentParams}
                  hide={col.hide}
                />
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.content.map((row) => (
              <Row key={row.id} row={row} columns={COLUMNS} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={data.total_pages}
        currentParams={currentParams}
      />
    </div>
  );
}
