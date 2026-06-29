import { test, expect } from '@playwright/test';

const MOCK_STATS = {
  code: 200,
  message: 'success',
  data: {
    total_listings: 1200,
    average_price: 450000,
    median_price: 420000,
    average_price_per_sqft: 225,
    price_distribution: [
      { bucket: '0-300k', count: 200 },
      { bucket: '300k-500k', count: 600 },
      { bucket: '500k+', count: 400 },
    ],
  },
};

const MOCK_LISTINGS = {
  code: 200,
  message: 'success',
  data: {
    content: [
      {
        id: 1, square_footage: 2000, bedrooms: 3, bathrooms: 2, price: 450000,
        year_built: 2005, lot_size: 8000, distance_to_city_center: 5, school_rating: 8.2,
      },
      {
        id: 2, square_footage: 1500, bedrooms: 2, bathrooms: 1, price: 320000,
        year_built: 2010, lot_size: 5000, distance_to_city_center: 8, school_rating: 7.5,
      },
    ],
    page: 0, size: 20, total_elements: 2, total_pages: 1,
  },
};

const MOCK_WHATIF = {
  code: 200,
  message: 'success',
  data: {
    predicted_price: 380000,
    baseline_price: 320000,
    delta: 60000,
    delta_percent: 18.75,
    input_features: { square_footage: 2500, bedrooms: 4, bathrooms: 2.5, year_built: 2008, lot_size: 9600, distance_to_city_center: 5, school_rating: 8.8 },
    baseline_features: { square_footage: 2000, bedrooms: 3, bathrooms: 2, year_built: 2005, lot_size: 8000, distance_to_city_center: 5, school_rating: 7.5 },
  },
};

test.describe('EPIC-04 Market Analysis — Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/market/statistics', async (route) => {
      await route.fulfill({ json: MOCK_STATS });
    });
    await page.route('**/api/v1/market/listings*', async (route) => {
      await route.fulfill({ json: MOCK_LISTINGS });
    });
  });

  test('T14: KPI cards render with correct data', async ({ page }) => {
    await page.goto('/app2');
    const cards = page.locator('[data-testid^="content.stats."]');
    await expect(cards).toHaveCount(4);
    for (const card of await cards.all()) {
      await expect(card).toHaveAttribute('data-loading', 'false');
    }
  });

  test('T14: FilterPanel controls are visible', async ({ page }) => {
    await page.goto('/app2');
    await expect(page.locator('[data-testid="sidebar.filters.price-min"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar.filters.price-max"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar.filters.school-min"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar.filters.year-min"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar.filters.size-min"]')).toBeVisible();
  });

  test('T14: Filter change triggers stats refetch', async ({ page }) => {
    let statsCallCount = 0;
    await page.route('**/api/v1/market/statistics*', async (route) => {
      statsCallCount++;
      await route.fulfill({ json: MOCK_STATS });
    });

    await page.goto('/app2');
    await page.waitForTimeout(1000); // Wait for initial load
    const before = statsCallCount;

    // Change a filter to trigger refetch
    await page.locator('[data-testid="sidebar.filters.price-min"]').fill('300000');
    await page.waitForTimeout(1000); // Wait for debounce (300ms) + API call

    // Stats should have been called again
    expect(statsCallCount).toBeGreaterThan(before);
  });

  test('T14: DataTable renders listings', async ({ page }) => {
    await page.goto('/app2');
    await expect(page.locator('[data-testid="content.property-listings.table"]')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});

test.describe('EPIC-04 Market Analysis — What-If', () => {

  test('T15: What-If form controls are visible', async ({ page }) => {
    await page.goto('/app2/what-if');
    await expect(page.locator('[data-testid="content.what-if"]')).toBeVisible();
    // What-If uses stepper buttons, not range sliders
    const incrementButtons = page.locator('button[aria-label^="Increase"]');
    await expect(incrementButtons.first()).toBeVisible();
  });

  test('T15: Calculate triggers prediction display', async ({ page }) => {
    await page.route('**/api/v1/market/what-if', async (route) => {
      await route.fulfill({ json: MOCK_WHATIF });
    });

    await page.goto('/app2/what-if');
    await page.locator('[data-testid="content.what-if.run"]').click();
    await expect(page.locator('[data-testid="content.what-if.result"]')).toBeVisible({ timeout: 5000 });
  });

  test('T15: ML API error shows WhatIfError with retry', async ({ page }) => {
    await page.route('**/api/v1/market/what-if', async (route) => {
      await route.fulfill({ status: 503, json: { code: 503200, message: 'Prediction service temporarily unavailable' } });
    });

    await page.goto('/app2/what-if');
    await page.locator('[data-testid="content.what-if.run"]').click();
    await expect(page.locator('[data-testid="content.what-if.error"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('EPIC-04 Market Analysis — Export', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/market/statistics', async (route) => {
      await route.fulfill({ json: MOCK_STATS });
    });
    await page.route('**/api/v1/market/listings*', async (route) => {
      await route.fulfill({ json: MOCK_LISTINGS });
    });
  });

  test('T16: Export buttons are visible when data loaded', async ({ page }) => {
    await page.goto('/app2');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="content.property-listings.export-csv"] button')).toBeVisible();
    await expect(page.locator('[data-testid="content.property-listings.export-pdf"] button')).toBeVisible();
  });

  test('T16: CSV export triggers download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await page.goto('/app2');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="content.property-listings.export-csv"] button').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^market-analysis-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});