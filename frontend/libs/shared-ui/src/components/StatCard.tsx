interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  loading?: boolean;
  testId?: string;
}

export function StatCard({ label, value, trend, trendValue, trendLabel = 'vs last month', loading = false, testId }: StatCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4" data-testid={testId || 'kpi-card'} data-loading={loading}>
      {loading ? (
        <>
          <div className="h-4 bg-neutral-100 rounded w-1/2 mb-2 animate-pulse" />
          <div className="h-8 bg-neutral-100 rounded w-3/4 animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {formattedValue}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' && <span className="text-success text-xs font-medium">▲ +{trendValue}</span>}
            {trend === 'down' && <span className="text-error text-xs font-medium">▼ {trendValue}</span>}
            {trend === 'neutral' && <span className="text-neutral-500 text-xs">{trendValue || '—'}</span>}
            <span className="text-neutral-500 text-xs">{trendLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}
