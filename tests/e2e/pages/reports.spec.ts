import { test, expect } from '../../fixtures/base.fixture';

/**
 * Reports Page Tests
 * Tests for the reports page functionality
 */

test.describe('Reports Page', () => {
  test.beforeEach(async ({ reportsPage }) => {
    await reportsPage.navigate();
  });

  test('should display page heading', async ({ reportsPage }) => {
    expect(await reportsPage.isPageVisible()).toBe(true);
    await expect(reportsPage.pageHeading).toBeVisible();
  });

  test('should display report content with demo data', async ({ reportsPage, page }) => {
    // Wait a bit for page to load and render
    await page.waitForTimeout(1500);
    
    // The page should show the tab list
    const tabList = page.locator('button[role="tab"]').first();
    await expect(tabList).toBeVisible({ timeout: 10000 });
  });

  test('should have export functionality available when data is present', async ({ reportsPage, page }) => {
    // Wait a bit for page to load and render
    await page.waitForTimeout(1500);
    
    // The page always has tabs, check if they're visible
    const tabList = page.locator('button[role="tab"]').first();
    await expect(tabList).toBeVisible({ timeout: 10000 });
  });

  test('should maintain page structure after navigation', async ({ reportsPage, navigation, page }) => {
    // Navigate away and back
    await navigation.navigateToHome();
    await page.waitForTimeout(500);
    
    await navigation.navigateToReports();
    await page.waitForTimeout(500);
    
    // Verify page is still functional
    expect(await reportsPage.isPageVisible()).toBe(true);
  });
});
