export interface RegionStats {
  region: string;
  avgPrice: number;
  totalListings: number;
  avgSqft: number;
}

const DATA: Record<string, RegionStats> = {
  All: { region: 'All', avgPrice: 350000, totalListings: 42, avgSqft: 1800 },
  Downtown: { region: 'Downtown', avgPrice: 520000, totalListings: 12, avgSqft: 1350 },
  Suburb: { region: 'Suburb', avgPrice: 280000, totalListings: 18, avgSqft: 2200 },
  Rural: { region: 'Rural', avgPrice: 180000, totalListings: 8, avgSqft: 2500 },
};

export function getStats(region: string): Promise<RegionStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(DATA[region] ?? DATA.All);
    }, 500);
  });
}
