'use client';

const REGIONS = ['All', 'Downtown', 'Suburb', 'Rural'] as const;

interface RegionFilterProps {
  selected: string;
  onChange: (region: string) => void;
}

export function RegionFilter({ selected, onChange }: RegionFilterProps) {
  return (
    <select
      data-testid="content.charts.region-filter"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-neutral-300 rounded-card px-3 py-2 text-sm focus:outline-2 focus:outline-primary-500"
      aria-label="Filter by region"
    >
      {REGIONS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
