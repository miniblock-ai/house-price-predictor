'use client';

import { useRouter } from 'next/navigation';
import { useComparison } from '@/lib/app1/ComparisonContext';
import Link from 'next/link';

/* ───────────── Helpers ───────────── */

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-US');

interface RowDef {
  key: string;
  label: string;
  format: (item: ComparisonItem) => string;
}

import type { ComparisonItem } from '@/lib/app1/ComparisonContext';

const ROWS: RowDef[] = [
  {
    key: 'predicted_price',
    label: 'Predicted Price',
    format: (i) => currency.format(i.predicted_price),
  },
  {
    key: 'price_per_sqft',
    label: 'Price / sqft',
    format: (i) => currency.format(i.predicted_price / i.features.square_footage),
  },
  {
    key: 'square_footage',
    label: 'Square Footage',
    format: (i) => `${number.format(i.features.square_footage)} sqft`,
  },
  {
    key: 'bedrooms',
    label: 'Bedrooms',
    format: (i) => String(i.features.bedrooms),
  },
  {
    key: 'bathrooms',
    label: 'Bathrooms',
    format: (i) => String(i.features.bathrooms),
  },
  {
    key: 'year_built',
    label: 'Year Built',
    format: (i) => String(i.features.year_built),
  },
  {
    key: 'lot_size',
    label: 'Lot Size',
    format: (i) => `${number.format(i.features.lot_size)} sqft`,
  },
  {
    key: 'distance_to_city_center',
    label: 'Distance to Center',
    format: (i) => `${i.features.distance_to_city_center.toFixed(1)} mi`,
  },
  {
    key: 'school_rating',
    label: 'School Rating',
    format: (i) => `${i.features.school_rating}/10`,
  },
];

/* ───────────── Component ───────────── */

export default function ComparePage() {
  const { items, count, isMax, removeItem } = useComparison();
  const router = useRouter();

  /* ═══ Empty State ═══ */

  if (items.length < 2) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <nav className="flex items-center text-sm text-neutral-500 mb-4">
          <Link href="/app1" className="hover:text-primary transition-colors">Estimator</Link>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-neutral-900 font-medium">Compare Properties</span>
        </nav>

        <div data-testid="comparison-empty" className="bg-white rounded-xl shadow-sm border border-dashed border-neutral-300 p-8 text-center">
          <svg className="w-10 h-10 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <p className="text-sm text-neutral-500 mb-4">
            Add at least 2 properties to start comparing
          </p>
          <Link
            href="/app1"
            data-testid="btn-add-property"
            className="inline-flex items-center gap-1 text-sm text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
            </svg>
            Add Property
          </Link>
        </div>
      </div>
    );
  }

  /* ═══ Comparison Table ═══ */

  const bestValueIdx = 0; // items are sorted desc by predicted_price

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-neutral-500 mb-4">
        <Link href="/app1" className="hover:text-primary transition-colors">Estimator</Link>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-neutral-900 font-medium">Compare Properties</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Property Comparison</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{count} of {count} properties</p>
        </div>
        <div className="flex items-center gap-2">
          {isMax && (
            <span className="text-xs text-neutral-400 bg-white px-2 py-1 rounded-lg border border-neutral-200">
              Max 3
            </span>
          )}
          <Link
            href="/app1"
            data-testid="btn-add-property"
            className={`inline-flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg transition-colors ${
              isMax
                ? 'bg-neutral-300 cursor-not-allowed pointer-events-none'
                : 'bg-primary hover:bg-primary-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
            </svg>
            Add Property
          </Link>
        </div>
      </div>

      {/* 2D Table */}
      <div className="overflow-x-auto rounded-xl shadow-sm border border-neutral-200 bg-white [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded">
        <table className="w-full text-sm min-w-[500px]" data-testid="comparison-table-2d">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="sticky left-0 z-10 bg-neutral-50 px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider w-28 min-w-[100px]">
                Feature
              </th>
              {items.map((item, idx) => {
                const isBest = idx === bestValueIdx;
                return (
              <th
                  key={item.id}
                  data-testid={isBest ? 'comparison-column-best' : 'comparison-column'}
                  className={`px-4 py-3 text-center min-w-[130px] ${isBest ? 'bg-primary-50/40' : 'bg-neutral-50'}`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      {isBest && (
                        <span
                          data-testid="best-value-badge"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Best Value
                        </span>
                      )}
                      <span className={`text-xs ${isBest ? 'text-neutral-600' : 'text-neutral-500'}`}>
                        {item.label}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {ROWS.map((row, rowIdx) => {
              const isPriceRow = row.key === 'predicted_price';
              const isEven = rowIdx % 2 === 0;
              const bgClass = isPriceRow ? 'bg-primary-50/20' : isEven ? 'bg-white' : 'bg-neutral-50/40';

              return (
                <tr key={row.key} className={bgClass} data-testid="comparison-row">
                  <td className={`sticky left-0 z-10 ${bgClass} px-4 py-${isPriceRow ? '3' : '2.5'} text-sm font-medium text-neutral-700`}>
                    {row.label}
                  </td>
                  {items.map((item, colIdx) => {
                    const isBest = colIdx === bestValueIdx;
                    const cellBg = row.key === 'predicted_price' && isBest ? 'bg-primary-50/30' : isBest ? 'bg-primary-50/20' : '';

                    return (
                      <td
                        key={item.id}
                        className={`px-4 py-${isPriceRow ? '3' : '2.5'} text-center ${cellBg}`}
                      >
                        {isPriceRow ? (
                          <p className="text-lg font-bold text-primary">{row.format(item)}</p>
                        ) : (
                          <span className="text-sm font-semibold text-neutral-900">{row.format(item)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Actions row */}
            <tr className="border-t-2 border-neutral-200">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-neutral-400"></td>
              {items.map((item) => (
                <td
                  key={item.id}
                  className="px-4 py-3 text-center bg-white"
                >
                  <button
                    onClick={() => removeItem(item.id)}
                    data-testid="btn-remove-column"
                    className="text-xs text-neutral-400 hover:text-error transition-colors flex items-center justify-center gap-0.5 mx-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-neutral-400 mt-2 lg:hidden">
        ← Swipe horizontally →
      </p>
    </div>
  );
}
