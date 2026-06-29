import { test, expect } from '@playwright/test';

/**
 * EPIC-03 Property Value Estimator — End-to-End tests
 *
 * Tests cover:
 * - Single property valuation with form validation
 * - Valuation history management (localStorage)
 * - Side-by-side property comparison
 *
 * Note: Happy-path tests call real value-estimator-api (:8001) and ML API (:8000).
 * Error-handling tests use page.route() mock since real errors are non-deterministic.
 */

const VALID_INPUTS = {
  'input-sqft': '2000',
  'input-bedrooms': '3',
  'input-bathrooms': '2',
  'input-year-built': '2010',
  'input-lot-size': '5000',
  'input-distance': '5',
  'input-school-rating': '8',
};

async function fillValidForm(page: import('@playwright/test').Page) {
  for (const [testId, value] of Object.entries(VALID_INPUTS)) {
    await page.locator(`[data-testid="${testId}"]`).fill(value);
  }
}

test.describe('EPIC-03 Property Value Estimator — E2E', () => {

  test.describe('E2E-01: Form Rendering', () => {

    test('Form has all 7 input fields and submit button', async ({ page }) => {
      await page.goto('/app1', { timeout: 15000 });

      // Check page title
      await expect(page.locator('[data-testid="page-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="page-title"]')).toHaveText('Property Value Estimator');

      // Check all 7 fields exist
      const fieldIds = [
        'input-sqft',
        'input-bedrooms',
        'input-bathrooms',
        'input-year-built',
        'input-lot-size',
        'input-distance',
        'input-school-rating',
      ];

      for (const id of fieldIds) {
        await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible();
      }

      // Check submit button
      await expect(page.locator('[data-testid="btn-get-valuation"]')).toBeVisible();
    });

    test('History section shows empty state initially', async ({ page }) => {
      await page.goto('/app1');

      // Clear any existing history
      await page.evaluate(() => localStorage.removeItem('app1-valuation-history'));
      await page.reload();

      await expect(page.locator('[data-testid="history-empty"]')).toBeVisible();
    });
  });

  test.describe('E2E-02: Single Property Valuation', () => {

    test('Submit with valid inputs calls API and shows result', async ({ page }) => {
      await page.goto('/app1');

      await fillValidForm(page);

      // Submit
      await page.locator('[data-testid="btn-get-valuation"]').click();

      // Verify result — real API call to value-estimator-api → ML API
      await expect(page.locator('[data-testid="valuation-result"]')).toBeVisible({ timeout: 8000 });
      await expect(page.locator('[data-testid="result-estimated-value"]')).toContainText('$');
    });

    test('Button shows loading state during API call', async ({ page }) => {
      await page.goto('/app1');

      await fillValidForm(page);

      const btn = page.locator('[data-testid="btn-get-valuation"]');
      await btn.click();

      // Check loading text
      await expect(btn).toContainText('Calculating');
      await expect(btn).toBeDisabled();

      // Wait for completion
      await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });
      await expect(btn).toContainText('Get Valuation');
      await expect(btn).toBeEnabled();
    });
  });

  test.describe('E2E-03: Form Validation', () => {

    test('Shows validation error for empty fields', async ({ page }) => {
      await page.goto('/app1');

      // Click submit without filling any fields
      await page.locator('[data-testid="btn-get-valuation"]').click();

      // Should show error message
      await expect(page.locator('[data-testid="error-validation"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-validation"]')).toContainText('required');

      // Result should not be visible
      await expect(page.locator('[data-testid="valuation-result"]')).not.toBeVisible();
    });

    test('Shows error for out-of-range bedrooms (0)', async ({ page }) => {
      await page.goto('/app1');

      await page.locator('[data-testid="input-sqft"]').fill('2000');
      await page.locator('[data-testid="input-bedrooms"]').fill('0'); // Invalid
      await page.locator('[data-testid="input-bathrooms"]').fill('2');
      await page.locator('[data-testid="input-year-built"]').fill('2010');
      await page.locator('[data-testid="input-lot-size"]').fill('5000');
      await page.locator('[data-testid="input-distance"]').fill('5');
      await page.locator('[data-testid="input-school-rating"]').fill('8');

      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="error-validation"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-validation"]')).toContainText('between 1 and 10');
    });

    test('Shows error for out-of-range square footage', async ({ page }) => {
      await page.goto('/app1');

      await page.locator('[data-testid="input-sqft"]').fill('100'); // Too small
      await page.locator('[data-testid="input-bedrooms"]').fill('3');
      await page.locator('[data-testid="input-bathrooms"]').fill('2');
      await page.locator('[data-testid="input-year-built"]').fill('2010');
      await page.locator('[data-testid="input-lot-size"]').fill('5000');
      await page.locator('[data-testid="input-distance"]').fill('5');
      await page.locator('[data-testid="input-school-rating"]').fill('8');

      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="error-validation"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-validation"]')).toContainText('500 and 10,000');
    });

    test('Shows multiple validation errors simultaneously', async ({ page }) => {
      await page.goto('/app1');

      // Leave multiple fields empty
      await page.locator('[data-testid="input-sqft"]').fill('2000');
      // bedrooms, bathrooms, etc. left empty

      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="error-validation"]')).toBeVisible();
      // Should contain multiple "required" messages
      const errorText = await page.locator('[data-testid="error-validation"]').textContent();
      expect(errorText).toContain('required');
    });
  });

  test.describe('E2E-04: API Error Handling', () => {

    test('Shows error when API returns 502', async ({ page }) => {
      await page.route('**/api/v1/valuation', async (route) => {
        await route.fulfill({
          status: 502,
          json: { code: 500101, message: 'ML prediction service unreachable' },
        });
      });

      await page.goto('/app1');

      await page.locator('[data-testid="input-sqft"]').fill('2000');
      await page.locator('[data-testid="input-bedrooms"]').fill('3');
      await page.locator('[data-testid="input-bathrooms"]').fill('2');
      await page.locator('[data-testid="input-year-built"]').fill('2010');
      await page.locator('[data-testid="input-lot-size"]').fill('5000');
      await page.locator('[data-testid="input-distance"]').fill('5');
      await page.locator('[data-testid="input-school-rating"]').fill('8');

      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="error-api"]')).toBeVisible({ timeout: 5000 });
    });

    test('Shows error when API returns 500', async ({ page }) => {
      await page.route('**/api/v1/valuation', async (route) => {
        await route.fulfill({
          status: 500,
          json: { code: 500099, message: 'Internal server error' },
        });
      });

      await page.goto('/app1');

      await page.locator('[data-testid="input-sqft"]').fill('2000');
      await page.locator('[data-testid="input-bedrooms"]').fill('3');
      await page.locator('[data-testid="input-bathrooms"]').fill('2');
      await page.locator('[data-testid="input-year-built"]').fill('2010');
      await page.locator('[data-testid="input-lot-size"]').fill('5000');
      await page.locator('[data-testid="input-distance"]').fill('5');
      await page.locator('[data-testid="input-school-rating"]').fill('8');

      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="error-api"]')).toBeVisible({ timeout: 5000 });
    });

    test('Form retains input values after API error', async ({ page }) => {
      await page.route('**/api/v1/valuation', async (route) => {
        await route.fulfill({
          status: 502,
          json: { code: 500101, message: 'ML prediction service unreachable' },
        });
      });

      await page.goto('/app1');

      await page.locator('[data-testid="input-sqft"]').fill('2000');
      await page.locator('[data-testid="input-bedrooms"]').fill('3');
      await page.locator('[data-testid="input-bathrooms"]').fill('2');
      await page.locator('[data-testid="input-year-built"]').fill('2010');
      await page.locator('[data-testid="input-lot-size"]').fill('5000');
      await page.locator('[data-testid="input-distance"]').fill('5');
      await page.locator('[data-testid="input-school-rating"]').fill('8');

      await page.locator('[data-testid="btn-get-valuation"]').click();
      await expect(page.locator('[data-testid="error-api"]')).toBeVisible({ timeout: 5000 });

      // Verify form values are retained
      await expect(page.locator('[data-testid="input-sqft"]')).toHaveValue('2000');
      await expect(page.locator('[data-testid="input-bedrooms"]')).toHaveValue('3');
    });
  });

  test.describe('E2E-05: Valuation History', () => {

    test('History shows record after successful valuation (requires refresh)', async ({ page }) => {
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-valuation-history'));

      await fillValidForm(page);
      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });

      // Refresh to see history (component reads localStorage on mount)
      await page.reload();

      // Check history
      await expect(page.locator('[data-testid="history-item"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="history-item"]')).toContainText('$');
    });

    test('History persists after page refresh', async ({ page }) => {
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-valuation-history'));

      await fillValidForm(page);
      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });

      // Refresh page
      await page.reload();

      // History should still show the record
      await expect(page.locator('[data-testid="history-item"]')).toHaveCount(1);
    });

    test('Clear All button removes all history', async ({ page }) => {
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-valuation-history'));

      await fillValidForm(page);
      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });

      // Refresh to see history
      await page.reload();
      await expect(page.locator('[data-testid="history-item"]')).toHaveCount(1);

      // Clear history
      await page.locator('[data-testid="btn-clear-history"]').click();

      await expect(page.locator('[data-testid="history-empty"]')).toBeVisible();
      await expect(page.locator('[data-testid="history-item"]')).toHaveCount(0);
    });
  });

  test.describe('E2E-06: Property Comparison', () => {

    test('Add to Compare button appears after successful valuation', async ({ page }) => {
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));

      await fillValidForm(page);
      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });

      // "Add to Compare" button should be visible
      await expect(page.locator('[data-testid="btn-add-to-compare"]')).toBeVisible();
    });

    test('Add to Compare adds property and shows comparison bar', async ({ page }) => {
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));

      await fillValidForm(page);
      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });

      // Click "Add to Compare"
      await page.locator('[data-testid="btn-add-to-compare"]').click();

      // Comparison bar should appear with "Compare (1)"
      await expect(page.locator('[data-testid="comparison-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="comparison-count"]')).toContainText('Compare (1)');

      // Button should show "Added ✓"
      await expect(page.locator('[data-testid="btn-add-to-compare"]')).toContainText('Added');
    });

    test('Comparison bar navigates to compare page', async ({ page }) => {
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));

      await fillValidForm(page);
      await page.locator('[data-testid="btn-get-valuation"]').click();

      await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });
      await page.locator('[data-testid="btn-add-to-compare"]').click();

      // Click comparison bar to navigate
      await page.locator('[data-testid="comparison-count"]').click();
      await expect(page).toHaveURL('/app1/compare');
    });

    test('Compare page shows Best Value badge', async ({ page }) => {
      // Seed comparison data with 2 properties
      const compareData = [
        {
          id: 'test-1',
          features: { square_footage: 2500, bedrooms: 4, bathrooms: 3, year_built: 2015, lot_size: 8000, distance_to_city_center: 3, school_rating: 9 },
          predicted_price: 520000,
          label: 'Property #1',
          timestamp: '2026-06-17T10:00:00Z',
        },
        {
          id: 'test-2',
          features: { square_footage: 1800, bedrooms: 3, bathrooms: 2, year_built: 2005, lot_size: 5000, distance_to_city_center: 8, school_rating: 7 },
          predicted_price: 380000,
          label: 'Property #2',
          timestamp: '2026-06-17T10:01:00Z',
        },
      ];

      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));
      await page.evaluate((data) => localStorage.setItem('app1-comparison', JSON.stringify(data)), compareData);
      await page.goto('/app1/compare');

      // 2D table should be visible
      await expect(page.locator('[data-testid="comparison-table-2d"]')).toBeVisible();

      // Best Value column should exist
      await expect(page.locator('[data-testid="comparison-column-best"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="comparison-column"]')).toHaveCount(1); // non-best column

      // Best Value badge should be on first column (highest price)
      await expect(page.locator('[data-testid="best-value-badge"]')).toBeVisible();

      // Table should have rows
      await expect(page.locator('[data-testid="comparison-row"]').first()).toBeVisible();
    });

    test('Compare page remove column works', async ({ page }) => {
      const compareData = [
        {
          id: 'test-1',
          features: { square_footage: 2500, bedrooms: 4, bathrooms: 3, year_built: 2015, lot_size: 8000, distance_to_city_center: 3, school_rating: 9 },
          predicted_price: 520000,
          label: 'Property #1',
          timestamp: '2026-06-17T10:00:00Z',
        },
        {
          id: 'test-2',
          features: { square_footage: 1800, bedrooms: 3, bathrooms: 2, year_built: 2005, lot_size: 5000, distance_to_city_center: 8, school_rating: 7 },
          predicted_price: 380000,
          label: 'Property #2',
          timestamp: '2026-06-17T10:01:00Z',
        },
      ];

      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));
      await page.evaluate((data) => localStorage.setItem('app1-comparison', JSON.stringify(data)), compareData);
      await page.goto('/app1/compare');

      // Should have remove buttons
      await expect(page.locator('[data-testid="btn-remove-column"]')).toHaveCount(2);

      // Remove one
      await page.locator('[data-testid="btn-remove-column"]').first().click();

      // After removal, should show empty state (< 2 items)
      await expect(page.locator('[data-testid="btn-add-property"]')).toBeVisible();
    });

    test('Compare page shows empty state for < 2 items', async ({ page }) => {
      await page.goto('/app1/compare');

      await expect(page.locator('[data-testid="btn-add-property"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-add-property"]')).toContainText('Add Property');
    });

    test('Compare from history adds to comparison', async ({ page }) => {
      // Seed a history entry
      const historyData = [{
        predicted_price: 425000,
        currency: 'USD',
        input_features: { square_footage: 2000, bedrooms: 3, bathrooms: 2, year_built: 2010, lot_size: 5000, distance_to_city_center: 5.2, school_rating: 8 },
        model_version: 'LinearRegression',
        timestamp: '2026-06-17T10:30:00Z',
      }];

      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));
      await page.evaluate((data) => localStorage.setItem('app1-valuation-history', JSON.stringify(data)), historyData);
      await page.reload();

      // History should show
      await expect(page.locator('[data-testid="history-item"]')).toHaveCount(1);

      // Click "Compare" on history item
      await page.locator('[data-testid="btn-compare-from-history"]').click();

      // Comparison bar should appear
      await expect(page.locator('[data-testid="comparison-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="comparison-count"]')).toContainText('Compare (1)');
    });

    test('Comparison bar Clear button empties list and hides bar', async ({ page }) => {
      // Seed 1 item in comparison
      const seedData = [{
        id: 'test-1',
        features: { square_footage: 2000, bedrooms: 3, bathrooms: 2, year_built: 2010, lot_size: 5000, distance_to_city_center: 5, school_rating: 8 },
        predicted_price: 425000,
        label: 'Property #1',
        timestamp: '2026-06-17T10:00:00Z',
      }];
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));
      await page.evaluate((d) => localStorage.setItem('app1-comparison', JSON.stringify(d)), seedData);
      await page.reload();

      // Bar should be visible
      await expect(page.locator('[data-testid="comparison-bar"]')).toBeVisible();

      // Click Clear
      await page.locator('[data-testid="btn-clear-comparison"]').click();

      // Bar should be hidden
      await expect(page.locator('[data-testid="comparison-bar"]')).not.toBeVisible();
    });

    test('Max 3 indicator shows when comparison is full', async ({ page }) => {
      // Seed 3 items in comparison
      const seedData = [
        { id: 't1', features: { square_footage: 2500, bedrooms: 4, bathrooms: 3, year_built: 2015, lot_size: 8000, distance_to_city_center: 3, school_rating: 9 }, predicted_price: 520000, label: 'Property #1', timestamp: '2026-06-17T10:00:00Z' },
        { id: 't2', features: { square_footage: 1800, bedrooms: 3, bathrooms: 2, year_built: 2005, lot_size: 5000, distance_to_city_center: 8, school_rating: 7 }, predicted_price: 380000, label: 'Property #2', timestamp: '2026-06-17T10:01:00Z' },
        { id: 't3', features: { square_footage: 2200, bedrooms: 3, bathrooms: 2, year_built: 2008, lot_size: 6500, distance_to_city_center: 5, school_rating: 8 }, predicted_price: 450000, label: 'Property #3', timestamp: '2026-06-17T10:02:00Z' },
      ];
      await page.goto('/app1');
      await page.evaluate(() => localStorage.removeItem('app1-comparison'));
      await page.evaluate((d) => localStorage.setItem('app1-comparison', JSON.stringify(d)), seedData);
      await page.reload();

      // Comparison bar should show "Compare (3) — Max"
      await expect(page.locator('[data-testid="comparison-count"]')).toContainText('Max');
      await expect(page.locator('[data-testid="comparison-bar"]')).toBeVisible();
    });

    test('Sidebar navigation links work', async ({ page }) => {
      await page.goto('/app1');

      // Click "Compare" in sidebar
      await page.locator('[data-testid="nav-compare"]').click();
      await expect(page).toHaveURL('/app1/compare');

      // Click "Valuator" in sidebar
      await page.locator('[data-testid="nav-valuator"]').click();
      await expect(page).toHaveURL('/app1');
    });
  });

  test.describe('E2E-07: Navigation', () => {

    test('Navigation to app2 and back works correctly', async ({ page }) => {
      await page.route('**/api/v1/market/statistics', async (route) => {
        await route.fulfill({
          json: {
            code: 200,
            message: 'success',
            data: {
              total_listings: 1200,
              average_price: 450000,
              median_price: 420000,
              average_price_per_sqft: 225,
            },
          },
        });
      });

      await page.goto('/app1');

      // Navigate to app2
      await page.locator('[data-testid="nav-link-app2"]').click();
      await expect(page).toHaveURL('/app2');

      // Navigate back to app1
      await page.locator('[data-testid="nav-link-app1"]').click();
      await expect(page).toHaveURL('/app1');

      // Form should be empty (React state resets on navigation)
      await expect(page.locator('[data-testid="input-sqft"]')).toHaveValue('');
      await expect(page.locator('[data-testid="input-bedrooms"]')).toHaveValue('');
    });
  });
});
