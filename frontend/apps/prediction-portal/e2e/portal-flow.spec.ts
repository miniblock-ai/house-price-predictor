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
    ],
    page: 0, size: 20, total_elements: 1, total_pages: 1,
  },
};

test.describe('EPIC-02 Portal Framework E2E', () => {

  test('Landing page displays navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="landing-link-app1"]')).toBeVisible();
    await expect(page.locator('[data-testid="landing-link-app2"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
  });

  test('User can navigate to App 1 via landing page link', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="landing-link-app1"]').click();
    await expect(page).toHaveURL('/app1');
    // New 7-field form: check first and last fields exist
    await expect(page.locator('[data-testid="input-sqft"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-school-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-get-valuation"]')).toBeVisible();
  });

  test('User can navigate between apps via NavBar', async ({ page }) => {
    await page.route('**/api/v1/market/statistics', async (route) => {
      await route.fulfill({ json: MOCK_STATS });
    });
    await page.route('**/api/v1/market/listings*', async (route) => {
      await route.fulfill({ json: MOCK_LISTINGS });
    });

    await page.goto('/app1');
    await page.locator('[data-testid="nav-link-app2"]').click();
    await expect(page).toHaveURL('/app2');
    await expect(page.locator('[data-testid="sidebar.filters"]')).toBeVisible();
    await expect(page.locator('[data-testid="content.stats"]')).toBeVisible();

    await page.locator('[data-testid="nav-link-app1"]').click();
    await expect(page).toHaveURL('/app1');
    await expect(page.locator('[data-testid="btn-get-valuation"]')).toBeVisible();
  });

  test('Error in App 1 does not crash NavBar', async ({ page }) => {
    await page.route('**/api/v1/market/statistics', async (route) => {
      await route.fulfill({ json: MOCK_STATS });
    });
    await page.route('**/api/v1/market/listings*', async (route) => {
      await route.fulfill({ json: MOCK_LISTINGS });
    });

    await page.goto('/app1');
    await expect(page.locator('[role="navigation"]')).toBeVisible();

    await page.locator('[data-testid="nav-link-app2"]').click();
    await expect(page).toHaveURL('/app2');
    await expect(page.locator('[data-testid="sidebar.filters"]')).toBeVisible();
  });
});

test.describe('EPIC-03 Property Value Estimator E2E', () => {

  test('Form has all 7 input fields', async ({ page }) => {
    await page.goto('/app1');
    const fieldIds = [
      'input-sqft', 'input-bedrooms', 'input-bathrooms',
      'input-year-built', 'input-lot-size', 'input-distance', 'input-school-rating',
    ];
    for (const id of fieldIds) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible();
    }
    await expect(page.locator('[data-testid="btn-get-valuation"]')).toBeVisible();
  });

  test('Shows validation error for empty fields', async ({ page }) => {
    await page.goto('/app1');
    await page.locator('[data-testid="btn-get-valuation"]').click();
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('Shows error for out-of-range value', async ({ page }) => {
    await page.goto('/app1');
    await page.locator('[data-testid="input-sqft"]').fill('2000');
    await page.locator('[data-testid="input-bedrooms"]').fill('0'); // invalid
    await page.locator('[data-testid="input-bathrooms"]').fill('2');
    await page.locator('[data-testid="input-year-built"]').fill('2010');
    await page.locator('[data-testid="input-lot-size"]').fill('5000');
    await page.locator('[data-testid="input-distance"]').fill('5');
    await page.locator('[data-testid="input-school-rating"]').fill('8');
    await page.locator('[data-testid="btn-get-valuation"]').click();

    await expect(page.locator('[data-testid="error-validation"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-estimated-value"]')).not.toBeVisible();
  });

  test('Shows error display when API returns error', async ({ page }) => {
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

    await expect(page.locator('[data-testid="error-api"]')).toBeVisible();
  });

  test('Add to Compare button and comparison bar integration', async ({ page }) => {
    await page.goto('/app1');
    await page.evaluate(() => localStorage.removeItem('app1-comparison'));

    // Complete a valuation
    await page.locator('[data-testid="input-sqft"]').fill('2000');
    await page.locator('[data-testid="input-bedrooms"]').fill('3');
    await page.locator('[data-testid="input-bathrooms"]').fill('2');
    await page.locator('[data-testid="input-year-built"]').fill('2010');
    await page.locator('[data-testid="input-lot-size"]').fill('5000');
    await page.locator('[data-testid="input-distance"]').fill('5');
    await page.locator('[data-testid="input-school-rating"]').fill('8');
    await page.locator('[data-testid="btn-get-valuation"]').click();

    await expect(page.locator('[data-testid="result-estimated-value"]')).toBeVisible({ timeout: 8000 });

    // "Add to Compare" button should appear after result
    await expect(page.locator('[data-testid="btn-add-to-compare"]')).toBeVisible();

    // Click to add
    await page.locator('[data-testid="btn-add-to-compare"]').click();

    // Comparison bar should appear at bottom
    await expect(page.locator('[data-testid="comparison-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="comparison-count"]')).toContainText('Compare (1)');
  });
});

test.describe('EPIC-04 Market Analysis E2E', () => {

  test('Mock App 2 displays 4 stat cards with data', async ({ page }) => {
    await page.route('**/api/v1/market/statistics', async (route) => {
      await route.fulfill({ json: MOCK_STATS });
    });
    await page.goto('/app2');
    const cards = page.locator('[data-testid^="content.stats."]');
    await expect(cards).toHaveCount(4);
    for (const card of await cards.all()) {
      await expect(card).toHaveAttribute('data-loading', 'false');
    }
  });

  test('Mock App 2 filter panel visible and interactive', async ({ page }) => {
    await page.route('**/api/v1/market/statistics', async (route) => {
      await route.fulfill({ json: MOCK_STATS });
    });
    await page.goto('/app2');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="content.stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-price-min"]')).toBeVisible();
  });
});
