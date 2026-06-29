'use client';

import { useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import {
  FILTER_KEYS,
  FIRST_PAGE_NO,
  buildApplyUrl,
  countActiveFilters,
} from '@/lib/app2/houses-utils';
import type { Filters } from '@/lib/app2/houses-utils';

const EMPTY = '';

function initFromParams(sp: URLSearchParams): Filters {
  const f: Filters = {};
  for (const k of FILTER_KEYS) f[k] = sp.get(k) || EMPTY;
  return f;
}

/* ───────── sub-components ───────── */

function RangeInput({
  label,
  minParam,
  maxParam,
  values,
  onChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  step,
}: {
  label: string;
  minParam: string;
  maxParam: string;
  values: Filters;
  onChange: (key: string, value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={step}
          placeholder={minPlaceholder}
          value={values[minParam] ?? EMPTY}
          onChange={(e) => onChange(minParam, e.target.value)}
          className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          data-testid={`houses.filter.${minParam}`}
        />
        <span className="text-gray-300 text-xs">—</span>
        <input
          type="number"
          step={step}
          placeholder={maxPlaceholder}
          value={values[maxParam] ?? EMPTY}
          onChange={(e) => onChange(maxParam, e.target.value)}
          className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          data-testid={`houses.filter.${maxParam}`}
        />
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  param,
  value,
  options,
  onChange,
}: {
  label: string;
  param: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        data-testid={`houses.filter.${param}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ───────── main panel ───────── */

export function HousesFilterPanel() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const base = initFromParams(new URLSearchParams(searchParams));
  const [filters, setFilters] = useState<Filters>(base);

  const set = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const apply = () => {
    replace(`${pathname}${buildApplyUrl(filters)}`);
  };

  const clearAll = () => {
    setFilters(initFromParams(new URLSearchParams()));
  };

  const read = (key: string) => filters[key] ?? EMPTY;

  const activeCount = countActiveFilters(filters);

  const [showMore, setShowMore] = useState(false);

  return (
    <div
      className="mx-6 mb-4 bg-white rounded-xl shadow-sm border border-gray-200"
      data-testid="houses.filters"
    >
      <div className="p-4 space-y-4">
        {/* ═══ Basic filters ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Price Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={read('priceMin')}
                onChange={(e) => set('priceMin', e.target.value)}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                data-testid="houses.filter.price-min"
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="number"
                placeholder="Max"
                value={read('priceMax')}
                onChange={(e) => set('priceMax', e.target.value)}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                data-testid="houses.filter.price-max"
              />
            </div>
          </div>
          <RangeInput
            label="Sq Ft"
            minParam="sqftMin"
            maxParam="sqftMax"
            values={filters}
            onChange={set}
          />
          <SelectFilter
            label="Bedrooms"
            param="bedrooms"
            value={read('bedrooms')}
            onChange={(v) => set('bedrooms', v)}
            options={[
              { value: '', label: 'Any' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5+' },
            ]}
          />
        </div>

        {/* ═══ More filters toggle ═══ */}
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 transition-transform"
              style={{ transform: showMore ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {showMore ? 'Less filters' : 'More filters'}
            <span className="ml-1 text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          </button>
        </div>

        {/* ═══ Expanded filters ═══ */}
        {showMore && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectFilter
                label="Bathrooms"
                param="bathrooms"
                value={read('bathrooms')}
                onChange={(v) => set('bathrooms', v)}
                options={[
                  { value: '', label: 'Any' },
                  { value: '1', label: '1' },
                  { value: '1.5', label: '1.5' },
                  { value: '2', label: '2' },
                  { value: '2.5', label: '2.5' },
                  { value: '3', label: '3+' },
                ]}
              />
              <RangeInput
                label="Year Built"
                minParam="yearFrom"
                maxParam="yearTo"
                values={filters}
                onChange={set}
                minPlaceholder="From"
                maxPlaceholder="To"
              />
              <RangeInput
                label="Lot Size (sqft)"
                minParam="lotMin"
                maxParam="lotMax"
                values={filters}
                onChange={set}
              />
              <RangeInput
                label="Distance (mi)"
                minParam="distMin"
                maxParam="distMax"
                values={filters}
                onChange={set}
                step="0.1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectFilter
                label="School Rating"
                param="school"
                value={read('school')}
                onChange={(v) => set('school', v)}
                options={[
                  { value: '', label: 'Any' },
                  { value: '5', label: '5+' },
                  { value: '6', label: '6+' },
                  { value: '7', label: '7+' },
                  { value: '8', label: '8+' },
                  { value: '9', label: '9+' },
                  { value: '10', label: '10' },
                ]}
              />
              <div className="flex items-end gap-2">
                <button
                  onClick={clearAll}
                  className="h-8 px-4 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Apply button — always visible ═══ */}
        <div className="flex justify-end pt-1 border-t border-gray-100">
          <button
            onClick={apply}
            className="h-9 px-5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
            data-testid="houses.filter.apply"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
