import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyListingsExportPDFButton } from '@/components/app2/PropertyListingsExportPDFButton';
import type { PaginatedListingsDto } from '@/lib/app2/types';

vi.mock('@/lib/app2/client', () => ({
  exportPdf: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { exportPdf } from '@/lib/app2/client';
import { toast } from 'sonner';
const mockExportPdf = exportPdf as ReturnType<typeof vi.fn>;
const mockToast = toast as { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

const MOCK_DATA: PaginatedListingsDto = {
  content: [{ id: 1, square_footage: 2000, bedrooms: 3, bathrooms: 2, price: 425000, year_built: 2010, lot_size: 5000, distance_to_city_center: 5.2, school_rating: 8 }],
  page: 0, size: 20, total_elements: 1, total_pages: 1,
};

const MOCK_FILTERS = { min_price: 300000, max_price: 500000 };

const origCreateElement = document.createElement.bind(document);

function mockAnchor() {
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      const a = origCreateElement('a');
      a.click = () => {};
      return a;
    }
    return origCreateElement(tag);
  });
}

function getButton() {
  return screen.getByTestId('content.property-listings.export-pdf').querySelector('button')!;
}

describe('PropertyListingsExportPDFButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders disabled when data is null', () => {
    render(<PropertyListingsExportPDFButton data={null} filterParams={{}} />);
    expect(getButton()).toBeDisabled();
  });

  it('renders disabled when data content is empty', () => {
    render(<PropertyListingsExportPDFButton data={{ ...MOCK_DATA, content: [] }} filterParams={{}} />);
    expect(getButton()).toBeDisabled();
  });

  it('renders enabled when data is provided', () => {
    render(<PropertyListingsExportPDFButton data={MOCK_DATA} filterParams={MOCK_FILTERS} />);
    expect(getButton()).toBeEnabled();
  });

  it('calls exportPdf and triggers download on success', async () => {
    mockExportPdf.mockResolvedValueOnce(new Blob(['pdf'], { type: 'application/pdf' }));
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:pdf'), revokeObjectURL: vi.fn() });
    mockAnchor();

    const user = userEvent.setup();
    render(<PropertyListingsExportPDFButton data={MOCK_DATA} filterParams={MOCK_FILTERS} />);
    await user.click(getButton());

    await waitFor(() => {
      expect(mockExportPdf).toHaveBeenCalledWith(MOCK_FILTERS);
    });
  });

  it('shows loading state during export', async () => {
    mockExportPdf.mockImplementationOnce(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(<PropertyListingsExportPDFButton data={MOCK_DATA} filterParams={{}} />);
    await user.click(getButton());

    await waitFor(() => {
      expect(getButton()).toBeDisabled();
      expect(getButton()).toHaveTextContent('Exporting...');
    });
  });

  it('shows toast error on export failure', async () => {
    mockExportPdf.mockRejectedValueOnce(new Error('API error'));

    const user = userEvent.setup();
    render(<PropertyListingsExportPDFButton data={MOCK_DATA} filterParams={{}} />);
    await user.click(getButton());

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Export failed. Please try again.');
    });
  });

  it('passes filterParams to exportPdf', async () => {
    mockExportPdf.mockResolvedValueOnce(new Blob());
    vi.stubGlobal('URL', { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() });
    mockAnchor();

    const user = userEvent.setup();
    render(<PropertyListingsExportPDFButton data={MOCK_DATA} filterParams={{ property_type: 'Condo', min_price: 300000 }} />);
    await user.click(getButton());

    await waitFor(() => {
      expect(mockExportPdf).toHaveBeenCalledWith({ property_type: 'Condo', min_price: 300000 });
    });
  });
});
