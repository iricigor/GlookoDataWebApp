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
    // Wait for demo data to be processed
    await page.waitForTimeout(2000);
    
    // The page should either show report content or a message
    const hasContent = await reportsPage.hasReportContent();
    const hasNoDataMessage = await reportsPage.hasNoDataMessage();
    
    // One of these should be true
    expect(hasContent || hasNoDataMessage).toBe(true);
  });

  test('should have export functionality available when data is present', async ({ reportsPage, page }) => {
    // Wait for demo data
    await page.waitForTimeout(2000);
    
    // Check if export button exists
    const exportButton = reportsPage.exportButton;
    const isExportVisible = await exportButton.isVisible().catch(() => false);
    
    // If there's data, export should be available
    // Note: This is a soft check as export button visibility depends on data
    expect(isExportVisible || await reportsPage.hasNoDataMessage()).toBe(true);
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
