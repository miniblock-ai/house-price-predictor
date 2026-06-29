# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: market-analysis-e2e.spec.ts >> EPIC-04 Market Analysis — End-to-End (real services) >> E2E-01: Dashboard loads with real data
- Location: e2e\market-analysis-e2e.spec.ts:5:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[data-testid="kpi-card"]')
Expected: 4
Received: 0
Timeout:  8000ms

Call log:
  - Expect "toHaveCount" with timeout 8000ms
  - waiting for locator('[data-testid="kpi-card"]')
    20 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation "Main navigation" [ref=e3]:
      - generic [ref=e4]:
        - link "HousePrice Predictor" [ref=e5] [cursor=pointer]:
          - /url: /
        - generic [ref=e6]:
          - link "Estimator" [ref=e7] [cursor=pointer]:
            - /url: /app1
          - link "Analysis" [ref=e8] [cursor=pointer]:
            - /url: /app2
  - main [ref=e9]:
    - generic [ref=e10]:
      - complementary [ref=e11]:
        - navigation "App 2 navigation" [ref=e12]:
          - link "Dashboard" [ref=e13] [cursor=pointer]:
            - /url: /app2
          - link "What-If Analysis" [ref=e14] [cursor=pointer]:
            - /url: /app2/what-if
        - generic [ref=e16]:
          - heading "Filters" [level=3] [ref=e17]
          - generic [ref=e18]:
            - generic [ref=e19]:
              - generic [ref=e20]: Property Type
              - combobox "Property Type" [ref=e21]:
                - option "All Types" [selected]
                - option "Single Family"
                - option "Condo"
                - option "Townhouse"
            - generic [ref=e22]:
              - generic [ref=e23]: Price Range ($)
              - generic [ref=e24]:
                - spinbutton [ref=e25]
                - generic [ref=e26]: —
                - spinbutton [ref=e27]
            - generic [ref=e28]:
              - generic [ref=e29]: School Rating
              - generic [ref=e30]:
                - spinbutton [ref=e31]
                - generic [ref=e32]: —
                - spinbutton [ref=e33]
            - generic [ref=e34]:
              - generic [ref=e35]: Year Built
              - generic [ref=e36]:
                - spinbutton [ref=e37]
                - generic [ref=e38]: —
                - spinbutton [ref=e39]
            - generic [ref=e40]:
              - generic [ref=e41]: Size (sqft)
              - generic [ref=e42]:
                - spinbutton [ref=e43]
                - generic [ref=e44]: —
                - spinbutton [ref=e45]
            - button "Reset Filters" [ref=e47]
      - main [ref=e48]:
        - generic [ref=e49]:
          - heading "Market Analysis Dashboard" [level=1] [ref=e50]
          - paragraph [ref=e51]: Explore market trends and property insights
        - generic [ref=e52]:
          - generic [ref=e54]:
            - paragraph [ref=e55]: Failed to fetch
            - button "Try Again" [ref=e56] [cursor=pointer]
          - generic [ref=e57]:
            - paragraph [ref=e58]: Failed to fetch
            - button "Try Again" [ref=e59] [cursor=pointer]
          - generic [ref=e60]:
            - button "Export CSV" [disabled] [ref=e62]
            - button "Export PDF" [disabled] [ref=e64]
  - button "Open Next.js Dev Tools" [ref=e70] [cursor=pointer]:
    - img [ref=e71]
  - alert [ref=e74]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('EPIC-04 Market Analysis — End-to-End (real services)', () => {
  4   | 
  5   |   test('E2E-01: Dashboard loads with real data', async ({ page }) => {
  6   |     await page.goto('/app2');
  7   | 
  8   |     // Check page structure
  9   |     await expect(page.locator('h1')).toContainText('Market Analysis Dashboard');
  10  |     await expect(page.locator('[data-testid="app2-sidebar"]')).toBeVisible();
  11  | 
  12  |     // Wait for API data to load (4 KPI cards)
  13  |     const kpiCards = page.locator('[data-testid="kpi-card"]');
> 14  |     await expect(kpiCards).toHaveCount(4, { timeout: 8000 });
      |                            ^ Error: expect(locator).toHaveCount(expected) failed
  15  |     for (const card of await kpiCards.all()) {
  16  |       await expect(card).toHaveAttribute('data-loading', 'false', { timeout: 5000 });
  17  |     }
  18  | 
  19  |     // DataTable should render
  20  |     await expect(page.locator('[data-testid="market-data-table"]')).toBeVisible({ timeout: 5000 });
  21  |     await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  22  |   });
  23  | 
  24  |   test('E2E-02: Filter changes trigger stats refresh', async ({ page }) => {
  25  |     await page.goto('/app2');
  26  | 
  27  |     // Wait for initial load
  28  |     await page.locator('[data-testid="kpi-card"]').first().waitFor({ state: 'visible', timeout: 8000 });
  29  | 
  30  |     // Change filter — track API call
  31  |     const statsPromise = page.waitForResponse(
  32  |       (res) => res.url().includes('/api/v1/market/statistics') && res.status() === 200,
  33  |       { timeout: 8000 }
  34  |     );
  35  | 
  36  |     await page.locator('[data-testid="filter-property-type"]').selectOption('Condo');
  37  |     await statsPromise;
  38  | 
  39  |     // Cards should have updated (data-loading false again)
  40  |     const cards = page.locator('[data-testid="kpi-card"]');
  41  |     for (const card of await cards.all()) {
  42  |       await expect(card).toHaveAttribute('data-loading', 'false', { timeout: 5000 });
  43  |     }
  44  |   });
  45  | 
  46  |   test('E2E-03: DataTable sort toggles on column header click', async ({ page }) => {
  47  |     await page.goto('/app2');
  48  | 
  49  |     // Wait for table
  50  |     await page.locator('[data-testid="market-data-table"]').waitFor({ state: 'visible', timeout: 8000 });
  51  | 
  52  |     // Click 'Price' header to sort
  53  |     const priceHeader = page.locator('th').filter({ hasText: 'Price' });
  54  |     await priceHeader.click();
  55  |     await page.waitForTimeout(500);
  56  | 
  57  |     // Table should still be visible after sort
  58  |     await expect(page.locator('table tbody tr')).toHaveCount(20, { timeout: 5000 });
  59  |   });
  60  | 
  61  |   test('E2E-04: DataTable pagination works', async ({ page }) => {
  62  |     await page.goto('/app2');
  63  | 
  64  |     // Wait for table
  65  |     await page.locator('[data-testid="market-data-table"]').waitFor({ state: 'visible', timeout: 8000 });
  66  | 
  67  |     const nextBtn = page.locator('[data-testid="pagination-next"]');
  68  |     const prevBtn = page.locator('[data-testid="pagination-prev"]');
  69  | 
  70  |     // Prev should be disabled on page 1
  71  |     await expect(prevBtn).toBeDisabled({ timeout: 5000 });
  72  | 
  73  |     // Click next
  74  |     await nextBtn.click();
  75  |     await page.waitForTimeout(500);
  76  | 
  77  |     // Now prev should be enabled
  78  |     await expect(prevBtn).toBeEnabled({ timeout: 5000 });
  79  |   });
  80  | 
  81  |   test('E2E-05: What-If calculation shows result', async ({ page }) => {
  82  |     await page.goto('/app2/what-if');
  83  | 
  84  |     // Check page loaded
  85  |     await expect(page.locator('[data-testid="what-if-analysis"]')).toBeVisible();
  86  | 
  87  |     // Click calculate
  88  |     await page.locator('[data-testid="btn-run-analysis"]').click();
  89  | 
  90  |     // Wait for result
  91  |     await expect(page.locator('[data-testid="what-if-result"]')).toBeVisible({ timeout: 10000 });
  92  |     await expect(page.locator('[data-testid="what-if-result"]')).toContainText('$');
  93  |   });
  94  | 
  95  |   test('E2E-06: What-If stepper adjusts value', async ({ page }) => {
  96  |     await page.goto('/app2/what-if');
  97  | 
  98  |     // Find the Bedrooms adjuster (+ button)
  99  |     const plusButtons = page.locator('button[aria-label="Increase Bedrooms"]');
  100 |     await expect(plusButtons).toBeVisible();
  101 | 
  102 |     // Click + once
  103 |     await plusButtons.click();
  104 | 
  105 |     // Value should have changed from 3 to 4
  106 |     await expect(page.locator('text=4')).toBeVisible();
  107 |   });
  108 | 
  109 |   test('E2E-07: CSV export triggers download', async ({ page }) => {
  110 |     await page.goto('/app2');
  111 | 
  112 |     // Wait for data
  113 |     await page.locator('[data-testid="market-data-table"]').waitFor({ state: 'visible', timeout: 8000 });
  114 | 
```