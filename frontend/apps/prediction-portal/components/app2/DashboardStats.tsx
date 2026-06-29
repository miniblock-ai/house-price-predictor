'use client';

import { useEffect, useState, useRef } from 'react';
import { StatCard, Skeleton, ErrorDisplay } from '@project/shared-ui';
import { getStatistics } from '@/lib/app2/client';
import type { MarketStatisticsDto } from '@/lib/app2/types';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-US');

interface DashboardStatsProps {
  segments?: string[];
}

export function DashboardStats({ segments }: DashboardStatsProps) {
  const [stats, setStats] = useState<MarketStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = (currentSegments?: string[]) => {
    setLoading(true);
    setError(null);
    getStatistics(currentSegments)
      .then((data) => {
        if (mountedRef.current) setStats(data);
      })
      .catch((e: Error) => {
        if (mountedRef.current) setError(e.message);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchStats(segments);
    return () => {
      mountedRef.current = false;
    };
  }, [segments]);

  if (error) {
    return <ErrorDisplay message={error} onRetry={() => fetchStats(segments)} />;
  }

  return (
    <div className="contents">
      {loading ? (
        <>
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
        </>
      ) : (
        <>
          <StatCard
            label="Total Listings"
            value={number.format(stats!.total_listings)}
            testId="content.stats.total-listings"
          />
          <StatCard
            label="Average Price"
            value={currency.format(stats!.average_price)}
            testId="content.stats.avg-price"
          />
          <StatCard
            label="Median Price"
            value={currency.format(stats!.median_price)}
            testId="content.stats.median-price"
          />
          <StatCard
            label="Avg Price / sqft"
            value={currency.format(stats!.average_price_per_sqft)}
            testId="content.stats.price-per-sqft"
          />
        </>
      )}
    </div>
  );
}
