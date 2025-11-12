import { test, expect } from '../../fixtures/base.fixture';
import { DEMO_FILE_NAME } from '../../utils/constants';

/**
 * Critical Path Smoke Tests
 * These tests verify the most critical user journeys
 */

test.describe('Critical Paths - Smoke Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Verify the app loads
    await expect(page).toHaveTitle(/Glooko/i);
  });

  test('should have navigation accessible from home page', async ({ homePage, navigation }) => {
    // Navigate to home page
    await homePage.navigate();
    
    // Verify welcome message is visible
    await expect(homePage.welcomeHeading).toBeVisible();
    
    // Verify navigation is present
    expect(await navigation.isNavigationVisible()).toBe(true);
  });

  test('should load demo data on startup', async ({ dataUploadPage }) => {
    // Navigate to data upload page
    await dataUploadPage.navigate();
    
    // Wait for demo data to load
    await dataUploadPage.page.waitForTimeout(2000);
    
    // Verify demo data is loaded
    expect(await dataUploadPage.isDemoDataLoaded()).toBe(true);
  });

  test('should navigate between all main pages', async ({ navigation, page }) => {
    // Start at home
    await page.goto('/#home');
    await expect(page).toHaveURL(/#home/);
    
    // Navigate to upload
    await navigation.navigateToUpload();
    await expect(page).toHaveURL(/#upload/);
    
    // Navigate to reports
    await navigation.navigateToReports();
    await expect(page).toHaveURL(/#reports/);
    
    // Navigate to AI Analysis
    await navigation.navigateToAIAnalysis();
    await expect(page).toHaveURL(/#ai/);
    
    // Navigate to settings
    await navigation.navigateToSettings();
    await expect(page).toHaveURL(/#settings/);
    
    // Navigate back to home
    await navigation.navigateToHome();
    await expect(page).toHaveURL(/#home/);
  });

  test('should display reports with demo data', async ({ reportsPage, page }) => {
    // Navigate to reports page
    await reportsPage.navigate();
    
    // Wait for demo data to be processed
    await page.waitForTimeout(2000);
    
    // Verify reports page is visible
    expect(await reportsPage.isPageVisible()).toBe(true);
  });
});
