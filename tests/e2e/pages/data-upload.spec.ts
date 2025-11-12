import { test, expect } from '../../fixtures/base.fixture';

/**
 * Data Upload Page Tests
 * Tests for data upload and file management functionality
 */

test.describe('Data Upload Page', () => {
  test.beforeEach(async ({ dataUploadPage }) => {
    await dataUploadPage.navigate();
  });

  test('should display page heading', async ({ dataUploadPage }) => {
    expect(await dataUploadPage.isPageVisible()).toBe(true);
    await expect(dataUploadPage.pageHeading).toBeVisible();
  });

  test('should load demo data on app startup', async ({ dataUploadPage, page }) => {
    // Wait for demo data to load (it loads automatically)
    await page.waitForTimeout(2000);
    
    // Verify demo data is present
    expect(await dataUploadPage.isDemoDataLoaded()).toBe(true);
    await expect(dataUploadPage.demoDataItem).toBeVisible();
  });

  test('should display file list when files are present', async ({ dataUploadPage, page }) => {
    // Wait for demo data
    await page.waitForTimeout(2000);
    
    // Verify file list is visible
    await expect(dataUploadPage.fileList).toBeVisible();
    
    // Verify at least one file is shown
    const fileCount = await dataUploadPage.getFileCount();
    expect(fileCount).toBeGreaterThan(0);
  });

  test('should display upload zone', async ({ dataUploadPage }) => {
    // Verify upload zone is visible
    await expect(dataUploadPage.uploadZone).toBeVisible();
  });

  test('should have clear all button when files are present', async ({ dataUploadPage, page }) => {
    // Wait for demo data
    await page.waitForTimeout(2000);
    
    // Verify clear all button is present
    await expect(dataUploadPage.clearAllButton).toBeVisible();
  });
});
