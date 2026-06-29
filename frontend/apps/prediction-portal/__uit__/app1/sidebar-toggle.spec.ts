import { test, expect } from '@playwright/test';

test.describe('App1 Sidebar Toggle', () => {

  test('sidebar is visible on desktop (lg+) viewport', async ({ page }) => {
    // Desktop viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/app1');

    // Sidebar should be visible on desktop (lg:translate-x-0)
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    // On desktop, the active class is lg:translate-x-0 (overrides -translate-x-full)
    await expect(sidebar).toHaveClass(/lg:translate-x-0/);
  });

  test('sidebar is hidden on mobile by default', async ({ page }) => {
    // Mobile viewport (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app1');

    // Sidebar should be hidden initially on mobile
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible(); // exists in DOM
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('hamburger button toggles sidebar open on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app1');

    const sidebar = page.locator('[data-testid="sidebar"]');
    const hamburger = page.locator('[data-testid="navbar.menu-btn"]');

    // Click hamburger → sidebar opens
    await hamburger.click();
    await expect(sidebar).not.toHaveClass(/-translate-x-full/);

    // Backdrop should appear
    await expect(page.locator('[data-testid="sidebar.backdrop"]')).toBeVisible();
  });

  test('hamburger button toggles sidebar closed on second click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app1');

    const sidebar = page.locator('[data-testid="sidebar"]');
    const hamburger = page.locator('[data-testid="navbar.menu-btn"]');

    // Open
    await hamburger.click();
    await expect(sidebar).not.toHaveClass(/-translate-x-full/);

    // Close
    await hamburger.click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    await expect(page.locator('[data-testid="sidebar.backdrop"]')).not.toBeVisible();
  });

  test('clicking backdrop closes sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app1');

    const sidebar = page.locator('[data-testid="sidebar"]');

    // Open via hamburger
    await page.locator('[data-testid="navbar.menu-btn"]').click();

    // Click backdrop to close
    await page.locator('[data-testid="sidebar.backdrop"]').click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('hamburger button is hidden on desktop (lg+)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/app1');

    // Hamburger should not be visible on desktop
    await expect(page.locator('[data-testid="navbar.menu-btn"]')).not.toBeVisible();
  });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app1');

    await expect(page.locator('[data-testid="navbar.menu-btn"]')).toBeVisible();
  });

  test('clicking a nav link closes the sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app1');

    const sidebar = page.locator('[data-testid="sidebar"]');

    // Open sidebar
    await page.locator('[data-testid="navbar.menu-btn"]').click();

    // Click a nav link — sidebar should close
    await page.locator('[data-testid="nav-compare"]').click();

    // After navigation, sidebar should be hidden on the new page
    await expect(page).toHaveURL('/app1/compare');
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

});
