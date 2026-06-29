'use client';

import { useFilterContext } from '@/lib/app2/FilterContext';
import { DashboardStats } from './DashboardStats';
import { PropertyListingsTable } from './PropertyListingsTable';
import { PropertyListingsExportCSVButton } from './PropertyListingsExportCSVButton';
import { PropertyListingsExportPDFButton } from './PropertyListingsExportPDFButton';
import { useState } from 'react';
import type { PaginatedListingsDto } from '@/lib/app2/types';

export function DashboardShell() {
  const { debouncedSegments, debouncedListingsParams, currentListingsParams } = useFilterContext();
  const [listingsData, setListingsData] = useState<PaginatedListingsDto | null>(null);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div data-testid="content.stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardStats segments={debouncedSegments} />
        </div>
      </div>

      {/* Data Table with export buttons in header */}
      <PropertyListingsTable
        filterParams={debouncedListingsParams}
        onDataChange={setListingsData}
        headerExtra={
          <>
            <PropertyListingsExportCSVButton data={listingsData} />
            <PropertyListingsExportPDFButton
              data={listingsData}
              filterParams={currentListingsParams as unknown as Record<string, unknown>}
            />
          </>
        }
      />
    </div>
  );
}
