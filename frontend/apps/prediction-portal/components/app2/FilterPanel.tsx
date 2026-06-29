'use client';

import { Button } from '@project/shared-ui';
import type { FilterState } from '@/lib/app2/use-filter-params';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onApply?: () => void;
  onReset?: () => void;
}

interface RangeInputProps {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  minTestId: string;
  maxTestId: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

function RangeInput({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minTestId,
  maxTestId,
  minPlaceholder,
  maxPlaceholder,
}: RangeInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          data-testid={minTestId}
          placeholder={minPlaceholder || 'Min'}
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          className="w-full h-9 rounded-lg border border-neutral-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
        <span className="text-neutral-300">—</span>
        <input
          type="number"
          data-testid={maxTestId}
          placeholder={maxPlaceholder || 'Max'}
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          className="w-full h-9 rounded-lg border border-neutral-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>
    </div>
  );
}

function getActiveFilters(filters: FilterState): string[] {
  const chips: string[] = [];
  if (filters.minPrice || filters.maxPrice)
    chips.push(`Price: $${filters.minPrice || '0'}–$${filters.maxPrice || '∞'}`);
  if (filters.minSchoolRating || filters.maxSchoolRating)
    chips.push(`School: ${filters.minSchoolRating || '0'}–${filters.maxSchoolRating || '10'}`);
  if (filters.yearBuiltFrom || filters.yearBuiltTo)
    chips.push(`Year: ${filters.yearBuiltFrom || '1800'}–${filters.yearBuiltTo || '2030'}`);
  if (filters.minSizeSqft || filters.maxSizeSqft)
    chips.push(`Size: ${filters.minSizeSqft || '0'}–${filters.maxSizeSqft || '∞'} sqft`);
  return chips;
}

export function FilterPanel({ filters, onFilterChange, onApply, onReset }: FilterPanelProps) {
  const activeFilters = getActiveFilters(filters);

  return (
    <div data-testid="sidebar.filters" className="mt-6 pt-4 border-t border-gray-100">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filters</h3>
      <div className="space-y-4">
        {/* Price Range */}
        <RangeInput
          label="Price Range ($)"
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
          onMinChange={(v) => onFilterChange('minPrice', v)}
          onMaxChange={(v) => onFilterChange('maxPrice', v)}
          minTestId="sidebar.filters.price-min"
          maxTestId="sidebar.filters.price-max"
        />

        {/* School Rating */}
        <RangeInput
          label="School Rating"
          minValue={filters.minSchoolRating}
          maxValue={filters.maxSchoolRating}
          onMinChange={(v) => onFilterChange('minSchoolRating', v)}
          onMaxChange={(v) => onFilterChange('maxSchoolRating', v)}
          minTestId="sidebar.filters.school-min"
          maxTestId="sidebar.filters.school-max"
          minPlaceholder="0"
          maxPlaceholder="10"
        />

        {/* Year Built */}
        <RangeInput
          label="Year Built"
          minValue={filters.yearBuiltFrom}
          maxValue={filters.yearBuiltTo}
          onMinChange={(v) => onFilterChange('yearBuiltFrom', v)}
          onMaxChange={(v) => onFilterChange('yearBuiltTo', v)}
          minTestId="sidebar.filters.year-min"
          maxTestId="sidebar.filters.year-max"
          minPlaceholder="1800"
          maxPlaceholder="2030"
        />

        {/* Size Range (sqft) */}
        <RangeInput
          label="Size (sqft)"
          minValue={filters.minSizeSqft}
          maxValue={filters.maxSizeSqft}
          onMinChange={(v) => onFilterChange('minSizeSqft', v)}
          onMaxChange={(v) => onFilterChange('maxSizeSqft', v)}
          minTestId="sidebar.filters.size-min"
          maxTestId="sidebar.filters.size-max"
        />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {onApply && (
            <Button data-testid="sidebar.filters.apply" onClick={onApply}>
              Apply Filters
            </Button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-primary-500 hover:text-primary-700 transition-colors self-start"
              data-testid="sidebar.filters.reset"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="pt-2 border-t border-neutral-100">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Active Filters
            </p>
            <div className="flex flex-wrap gap-1">
              {activeFilters.map((chip) => (
                <span
                  key={chip}
                  className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full"
                >
                  {chip}
                </span>
              ))}
            </div>
            <button
              onClick={onReset}
              className="text-xs text-neutral-400 hover:text-neutral-600 mt-2 transition-colors"
              data-testid="sidebar.filters.clear-all"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
