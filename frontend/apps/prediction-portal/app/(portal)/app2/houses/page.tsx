import { Suspense } from 'react';
import { HousesFilterPanel } from '@/components/app2/HousesFilterPanel';
import { HousesTable, HousesTableSkeleton } from '@/components/app2/HousesTable';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function HousesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <h1 data-testid="content.title" className="text-2xl font-bold text-gray-900">Houses</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and filter property listings</p>
      </div>

      <HousesFilterPanel />

      <Suspense fallback={<HousesTableSkeleton />}>
        <HousesTable searchParams={params} />
      </Suspense>
    </>
  );
}
