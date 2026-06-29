'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@project/shared-ui';
import { exportPdf } from '@/lib/app2/client';
import type { PaginatedListingsDto } from '@/lib/app2/types';

interface PropertyListingsExportPDFButtonProps {
  data: PaginatedListingsDto | null;
  filterParams: Record<string, unknown>;
}

export function PropertyListingsExportPDFButton({
  data,
  filterParams,
}: PropertyListingsExportPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!data || data.content.length === 0) {
      toast.error('No data to export with current filters.');
      return;
    }

    setLoading(true);
    try {
      const blob = await exportPdf(filterParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `market-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span data-testid="content.property-listings.export-pdf">
      <Button
        onClick={handleExport}
        disabled={!data || data.content.length === 0 || loading}
        data-loading={loading}
      >
        {loading ? 'Exporting...' : 'Export PDF'}
      </Button>
    </span>
  );
}
