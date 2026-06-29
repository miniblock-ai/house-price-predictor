'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@project/shared-ui';
import { getStats, type RegionStats } from './mock-data';

interface DashboardCardsProps {
  region: string;
}

const SKELETON_CARDS = [
  { label: 'Average Price', value: 0 },
  { label: 'Total Listings', value: 0 },
  { label: 'Average Sq Ft', value: 0 },
] as const;

export function DashboardCards({ region }: DashboardCardsProps) {
  const [stats, setStats] = useState<RegionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStats(region).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [region]);

  const statCards = stats
    ? [
        {
          label: 'Average Price',
          value: stats.avgPrice,
          trend: stats.avgPrice > 350000 ? ('up' as const) : ('down' as const),
        },
        { label: 'Total Listings', value: stats.totalListings },
        { label: 'Average Sq Ft', value: stats.avgSqft },
      ]
    : SKELETON_CARDS;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="content.stats">
      {statCards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </div>
  );
}
