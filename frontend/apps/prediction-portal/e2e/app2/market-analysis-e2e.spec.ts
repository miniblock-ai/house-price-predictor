import { test, expect } from '@playwright/test';

test.describe('EPIC-04 Baseline API — direct endpoint', () => {

  test('E2E-BL-01: Baseline-property API returns 200', async ({ request }) => {
    // Direct API call to verify baseline-property endpoint works
    const resp = await request.get('/api/v1/market/baseline-property');
    expect(resp.status()).toBe(200);

    const body = await resp.json();
    expect(body.code).toBe(200);
    expect(body.data).toHaveProperty('baseline_price');
    expect(body.data).toHaveProperty('baseline_features');
    expect(typeof body.data.baseline_price).toBe('number');
    expect(body.data.baseline_price).toBeGreaterThan(0);
  });

  test('E2E-BL-02: What-If API returns 200 after baseline', async ({ request }) => {
    // Call baseline first (the scenario that was failing)
    const blResp = await request.get('/api/v1/market/baseline-property');
    expect(blResp.status()).toBe(200);

    // Then call What-If — both should work
    const wiResp = await request.post('/api/v1/market/what-if', {
      data: {
        features: [{
          square_footage: 2000,
          bedrooms: 3,
          bathrooms: 2.0,
          year_built: 2000,
          lot_size: 7000,
          distance_to_city_center: 4.0,
          school_rating: 7.5,
        }]
      }
    });
    expect(wiResp.status()).toBe(200);
    const body = await wiResp.json();
    expect(body.code).toBe(200);
    expect(body.data).toHaveProperty('predicted_price');
    expect(body.data).toHaveProperty('baseline_price');
    expect(body.data).toHaveProperty('delta');
  });
});

test.describe('EPIC-04 Market Analysis — End-to-End (real services)', () => {

  test('E2E-01: Dashboard loads with real data', async ({ page }) => {
    await page.goto('/app2');

    // Check page structure
    await expect(page.locator('h1')).toContainText('Market Analysis Dashboard');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Wait for API data to load (4 KPI cards)
    const kpiCards = page.locator('[data-testid^="content.stats."]');
    await expect(kpiCards).toHaveCount(4, { timeout: 8000 });
    for (const card of await kpiCards.all()) {
      await expect(card).toHaveAttribute('data-loading', 'false', { timeout: 5000 });
    }

    // DataTable should render
    await expect(page.locator('[data-testid="content.property-listings.table"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test('E2E-02: Filter changes trigger stats refresh', async ({ page }) => {
    await page.goto('/app2');

    // Wait for initial load
    await page.locator('[data-testid^="content.stats."]').first().waitFor({ state: 'visible', timeout: 8000 });

    // Change filter — track API call
    const statsPromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/market/statistics') && res.status() === 200,
      { timeout: 8000 }
    );

    await page.locator('[data-testid="sidebar.filters.price-min"]').fill('300000');
    await statsPromise;

    // Cards should have updated (data-loading false again)
    const cards = page.locator('[data-testid^="content.stats."]');
    for (const card of await cards.all()) {
      await expect(card).toHaveAttribute('data-loading', 'false', { timeout: 5000 });
    }
  });

  test('E2E-03: DataTable sort toggles on column header click', async ({ page }) => {
    await page.goto('/app2');

    // Wait for table
    await page.locator('[data-testid="content.property-listings.table"]').waitFor({ state: 'visible', timeout: 8000 });

    // Click 'Price' header to sort
    const priceHeader = page.locator('th').filter({ hasText: 'Price' });
    await priceHeader.click();
    await page.waitForTimeout(500);

    // Table should still be visible after sort
    await expect(page.locator('table tbody tr')).toHaveCount(20, { timeout: 5000 });
  });

  test('E2E-04: DataTable pagination works', async ({ page }) => {
    await page.goto('/app2');

    // Wait for table with data
    await page.locator('[data-testid="content.property-listings.table"]').waitFor({ state: 'visible', timeout: 8000 });

    const nextBtn = page.locator('[data-testid="content.property-listings.pagination.next"]');
    const prevBtn = page.locator('[data-testid="content.property-listings.pagination.prev"]');

    // Prev should be disabled on page 1
    await expect(prevBtn).toBeDisabled({ timeout: 5000 });

    // Click next and wait for data refresh
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/market/listings') && res.status() === 200,
        { timeout: 8000 }
      ),
      nextBtn.click(),
    ]);

    // Now prev should be enabled
    await expect(prevBtn).toBeEnabled({ timeout: 5000 });
  });

  test('E2E-05: What-If calculation shows result', async ({ page }) => {
    await page.goto('/app2/what-if');

    // Check page loaded
    await expect(page.locator('[data-testid="content.what-if"]')).toBeVisible();

    // Click calculate
    await page.locator('[data-testid="content.what-if.run"]').click();

    // Wait for result
    await expect(page.locator('[data-testid="content.what-if.result"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="content.what-if.result"]')).toContainText('$');
  });

  test('E2E-06: What-If stepper adjusts value', async ({ page }) => {
    await page.goto('/app2/what-if');

    // Find the Bedrooms adjuster (+ button)
    const plusButtons = page.locator('button[aria-label="Increase Bedrooms"]');
    await expect(plusButtons).toBeVisible();

    // Click + once
    await plusButtons.click();

    // Value should have changed from 3 to 4
    await expect(page.locator('text=4')).toBeVisible();
  });

  test('E2E-07: CSV export triggers download', async ({ page }) => {
    await page.goto('/app2');

    // Wait for data
    await page.locator('[data-testid="content.property-listings.table"]').waitFor({ state: 'visible', timeout: 8000 });

    // Trigger download
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('[data-testid="content.property-listings.export-csv"] button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^market-analysis-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('E2E-08: Sidebar navigation switches pages', async ({ page }) => {
    await page.goto('/app2');

    // Click What-If in sidebar
    await page.locator('[data-testid="sidebar.menu.whatif"]').click();
    await expect(page).toHaveURL('/app2/what-if');
    await expect(page.locator('[data-testid="content.what-if"]')).toBeVisible({ timeout: 5000 });

    // Click Dashboard in sidebar
    await page.locator('[data-testid="sidebar.menu.market"]').click();
    await expect(page).toHaveURL('/app2');
    await expect(page.locator('[data-testid="content.stats"]')).toBeVisible({ timeout: 5000 });
  });

  test('E2E-09: PDF export triggers download', async ({ page }) => {
    await page.goto('/app2');

    // Wait for data
    await page.locator('[data-testid="content.property-listings.table"]').waitFor({ state: 'visible', timeout: 8000 });

    // Trigger PDF download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.locator('[data-testid="content.property-listings.export-pdf"] button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^market-report-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
