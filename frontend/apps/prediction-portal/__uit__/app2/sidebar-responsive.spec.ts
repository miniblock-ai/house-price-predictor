import { test, expect } from '@playwright/test';

test.describe('App2 Sidebar Responsive', () => {

  test('sidebar collapses on narrow viewport and toggles via hamburger button', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app2');

    // Sidebar should be translated off-screen on mobile
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toHaveClass(/-translate-x-full/);

    // Hamburger button should be visible
    const menuBtn = page.locator('[data-testid="navbar.menu-btn"]');
    await expect(menuBtn).toBeVisible();

    // Click hamburger to open sidebar
    await menuBtn.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // Backdrop should be visible
    const backdrop = page.locator('[data-testid="sidebar.backdrop"]');
    await expect(backdrop).toBeVisible();

    // Click backdrop to close sidebar
    await backdrop.click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('sidebar is always visible on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/app2');

    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Hamburger should be hidden on desktop
    const menuBtn = page.locator('[data-testid="navbar.menu-btn"]');
    await expect(menuBtn).not.toBeVisible();
  });
});
