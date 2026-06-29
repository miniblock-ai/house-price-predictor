import { test, expect } from '@playwright/test';

test.describe('EPIC-04 Houses Page — End-to-End (real services)', () => {

  test('E2E-H-01: Houses page loads with table and filters', async ({ page }) => {
    await page.goto('/app2/houses');

    // Page structure
    await expect(page.locator('h1')).toContainText('Houses');
    await expect(page.locator('[data-testid="houses.filters"]')).toBeVisible();

    // Basic filters visible
    await expect(page.locator('[data-testid="houses.filter.price-min"]')).toBeVisible();
    await expect(page.locator('[data-testid="houses.filter.price-max"]')).toBeVisible();
    await expect(page.locator('[data-testid="houses.filter.bedrooms"]')).toBeVisible();

    // Table loads with data (wait for API)
    const table = page.locator('[data-testid="houses.table"]');
    await expect(table).toBeVisible({ timeout: 10000 });
    await expect(table.locator('tbody tr')).toHaveCount(20, { timeout: 10000 });

    // Pagination visible
    await expect(page.locator('[data-testid="houses.pagination"]')).toBeVisible({ timeout: 5000 });
  });

  test('E2E-H-02: Apply price filter updates URL and reloads table', async ({ page }) => {
    await page.goto('/app2/houses');

    // Wait for initial table data
    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

    // Fill price min and click Apply
    await page.locator('[data-testid="houses.filter.price-min"]').fill('200000');
    await page.locator('[data-testid="houses.filter.apply"]').click();

    // URL should update with priceMin param
    await expect(page).toHaveURL(/priceMin=200000/);

    // Table should reload with filtered data
    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 15000 });
  });

  test('E2E-H-03: Bedrooms dropdown with Apply updates URL', async ({ page }) => {
    await page.goto('/app2/houses');

    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

    // Select bedrooms = 3 and click Apply
    await page.locator('[data-testid="houses.filter.bedrooms"]').selectOption('3');
    await page.locator('[data-testid="houses.filter.apply"]').click();

    // URL should have bedrooms=3 and page=0 (0-indexed first page)
    await expect(page).toHaveURL(/bedrooms=3/);
    await expect(page).toHaveURL(/page=0/);
  });

  test('E2E-H-04: Expanded filters show/hide on toggle', async ({ page }) => {
    await page.goto('/app2/houses');

    // Expanded filters hidden by default
    await expect(page.locator('[data-testid="houses.filter.bathrooms"]')).not.toBeVisible();

    // Click "More filters"
    await page.locator('button:has-text("More filters")').click();

    // Expanded filters visible
    await expect(page.locator('[data-testid="houses.filter.bathrooms"]')).toBeVisible();

    // Click "Less filters"
    await page.locator('button:has-text("Less filters")').click();
    await expect(page.locator('[data-testid="houses.filter.bathrooms"]')).not.toBeVisible();
  });

  test('E2E-H-05: Column sort toggles on header click', async ({ page }) => {
    await page.goto('/app2/houses');

    // Wait for table
    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

    // Click "Price" column header via the sort link inside the table
    const priceSortLink = page.locator('[data-testid="houses.table"] thead a:has-text("Price")');
    await priceSortLink.click();

    // URL should contain sort param (URLSearchParams encodes comma as %2C)
    await expect(page).toHaveURL(/sort=price%2C(asc|desc)/);
  });

  test('E2E-H-06: Pagination navigates between pages', async ({ page }) => {
    await page.goto('/app2/houses');

    // Wait for table
    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

    // Click page 2 (0-indexed: page=1)
    const page2Link = page.locator('[data-testid="houses.pagination"] a:has-text("2")');
    await expect(page2Link).toBeVisible({ timeout: 5000 });
    await page2Link.click();

    // URL should have page=1 (0-indexed, displayed as "2")
    await expect(page).toHaveURL(/page=1/);

    // Table should have new data
    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
  });

  test('E2E-H-07: Apply filter then Clear All resets filters', async ({ page }) => {
    await page.goto('/app2/houses');

    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

    // Set a filter and apply
    await page.locator('[data-testid="houses.filter.price-min"]').fill('200000');
    await page.locator('[data-testid="houses.filter.apply"]').click();
    await expect(page).toHaveURL(/priceMin=200000/);

    // Clear All resets local state, then click Apply to commit
    await page.locator('button:has-text("More filters")').click();
    await page.locator('button:has-text("Clear All")').click();
    await page.locator('[data-testid="houses.filter.apply"]').click();

    // URL should not have priceMin
    await expect(page).not.toHaveURL(/priceMin=/);
  });

  test('E2E-H-08: Sidebar has Houses nav link', async ({ page }) => {
    await page.goto('/app2/houses');

    await expect(page.locator('[data-testid="sidebar.menu.houses"]')).toBeVisible();
  });

  test('E2E-H-09: Sort preserves existing filter params', async ({ page }) => {
    // Start with filter params
    await page.goto('/app2/houses?priceMin=200000');
    await page.locator('[data-testid="houses.table"] tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
    await expect(page).toHaveURL(/priceMin=200000/);

    // Click "Price" sort header
    const priceLink = page.locator('[data-testid="houses.table"] thead a').filter({ hasText: 'Price' });
    await priceLink.click();

    // URL must preserve priceMin after sort
    await expect(page).toHaveURL(/priceMin=200000/);
    await expect(page).toHaveURL(/sort=price%2C(asc|desc)/);
  });
});
