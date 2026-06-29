import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyListingsExportCSVButton } from '@/components/app2/PropertyListingsExportCSVButton';
import type { PaginatedListingsDto } from '@/lib/app2/types';

const MOCK_DATA: PaginatedListingsDto = {
  content: [
    { id: 1, square_footage: 2000, bedrooms: 3, bathrooms: 2, price: 425000, year_built: 2010, lot_size: 5000, distance_to_city_center: 5.2, school_rating: 8 },
    { id: 2, square_footage: 1500, bedrooms: 2, bathrooms: 1, price: 320000, year_built: 2005, lot_size: 4000, distance_to_city_center: 8, school_rating: 6 },
  ],
  page: 0, size: 20, total_elements: 2, total_pages: 1,
};

const origCreateElement = document.createElement.bind(document);

function mockAnchorCSV() {
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
  return screen.getByTestId('content.property-listings.export-csv').querySelector('button')!;
}

describe('PropertyListingsExportCSVButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders disabled when data is null', () => {
    render(<PropertyListingsExportCSVButton data={null} />);
    expect(getButton()).toBeDisabled();
  });

  it('renders disabled when data content is empty', () => {
    render(<PropertyListingsExportCSVButton data={{ ...MOCK_DATA, content: [] }} />);
    expect(getButton()).toBeDisabled();
  });

  it('renders enabled when data is provided', () => {
    render(<PropertyListingsExportCSVButton data={MOCK_DATA} />);
    expect(getButton()).toBeEnabled();
  });

  it('triggers download with Blob and <a> click', async () => {
    const url = 'blob:csv-test';
    const createObjectURL = vi.fn(() => url);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    let downloadHref = '';
    let clickCalled = false;
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreateElement('a');
        // Override href setter to capture the value
        Object.defineProperty(a, 'href', {
          set(v: string) { downloadHref = v; },
          get() { return downloadHref; },
          configurable: true,
        });
        a.click = () => { clickCalled = true; };
        return a;
      }
      return origCreateElement(tag);
    });

    const user = userEvent.setup();
    render(<PropertyListingsExportCSVButton data={MOCK_DATA} />);
    await user.click(getButton());

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickCalled).toBe(true);
    expect(downloadHref).toBe(url);
    expect(revokeObjectURL).toHaveBeenCalledWith(url);
  });

  it('generates CSV with correct headers and data', async () => {
    let capturedBlob: Blob | null = null;
    const createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:test';
    });
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') el.click = () => {};
      return el;
    });

    const user = userEvent.setup();
    render(<PropertyListingsExportCSVButton data={MOCK_DATA} />);
    await user.click(getButton());

    const csv = await capturedBlob!.text();
    expect(csv).toContain('Price,Sq Ft,Bedrooms,Bathrooms,Year,Lot Size,School Rating');
    expect(csv).toContain('425000,2000,3,2,2010,5000,8');
    expect(csv).toContain('320000,1500,2,1,2005,4000,6');
  });
});
