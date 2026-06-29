'use client';

import { toast } from 'sonner';
import { Button } from '@project/shared-ui';
import type { PaginatedListingsDto } from '@/lib/app2/types';

interface PropertyListingsExportCSVButtonProps {
  data: PaginatedListingsDto | null;
}

export function PropertyListingsExportCSVButton({ data }: PropertyListingsExportCSVButtonProps) {
  const handleExport = () => {
    if (!data || data.content.length === 0) {
      toast.error('No data to export with current filters.');
      return;
    }

    const headers = [
      'Price',
      'Sq Ft',
      'Bedrooms',
      'Bathrooms',
      'Year',
      'Lot Size',
      'School Rating',
    ];
    const rows = data.content.map((r) =>
      [
        r.price,
        r.square_footage,
        r.bedrooms,
        r.bathrooms,
        r.year_built,
        r.lot_size,
        r.school_rating,
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <span data-testid="content.property-listings.export-csv">
      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={!data || data.content.length === 0}
      >
        Export CSV
      </Button>
    </span>
  );
}
