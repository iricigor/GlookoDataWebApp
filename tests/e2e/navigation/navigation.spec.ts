import { test, expect } from '../../fixtures/base.fixture';

/**
 * Navigation Tests
 * Tests for application navigation functionality
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/#home');
  });

  test('should display all navigation links', async ({ navigation }) => {
    // Verify all navigation links are visible
    await expect(navigation.homeLink).toBeVisible();
    await expect(navigation.uploadLink).toBeVisible();
    await expect(navigation.reportsLink).toBeVisible();
    await expect(navigation.aiAnalysisLink).toBeVisible();
    await expect(navigation.settingsLink).toBeVisible();
  });

  test('should navigate to Data Upload page', async ({ navigation, page }) => {
    await navigation.navigateToUpload();
    
    // Verify URL changed
    await expect(page).toHaveURL(/#upload/);
    
    // Verify page content loaded
    await expect(page.locator('h1')).toContainText(/data upload/i);
  });

  test('should navigate to Reports page', async ({ navigation, page }) => {
    await navigation.navigateToReports();
    
    // Verify URL changed
    await expect(page).toHaveURL(/#reports/);
    
    // Verify page content loaded
    await expect(page.locator('h1')).toContainText(/reports/i);
  });

  test('should navigate to AI Analysis page', async ({ navigation, page }) => {
    await navigation.navigateToAIAnalysis();
    
    // Verify URL changed
    await expect(page).toHaveURL(/#ai/);
    
    // Verify page content loaded
    await expect(page.locator('h1')).toContainText(/ai analysis/i);
  });

  test('should navigate to Settings page', async ({ navigation, page }) => {
    await navigation.navigateToSettings();
    
    // Verify URL changed
    await expect(page).toHaveURL(/#settings/);
    
    // Verify page content loaded
    await expect(page.locator('h1')).toContainText(/settings/i);
  });

  test('should navigate back to Home page from any page', async ({ navigation, page }) => {
    // Navigate to settings
    await navigation.navigateToSettings();
    await expect(page).toHaveURL(/#settings/);
    
    // Navigate back to home
    await navigation.navigateToHome();
    await expect(page).toHaveURL(/#home/);
    
    // Verify home page content
    await expect(page.locator('h1')).toContainText(/welcome/i);
  });

  test('should maintain navigation state when navigating between pages', async ({ navigation, page }) => {
    // Navigate through several pages
    await navigation.navigateToUpload();
    await expect(page).toHaveURL(/#upload/);
    
    await navigation.navigateToReports();
    await expect(page).toHaveURL(/#reports/);
    
    await navigation.navigateToSettings();
    await expect(page).toHaveURL(/#settings/);
    
    // Verify navigation is still visible
    expect(await navigation.isNavigationVisible()).toBe(true);
  });

  test('should support direct navigation via hash URL', async ({ page }) => {
    // Navigate directly to reports via hash
    await page.goto('/#reports');
    await expect(page).toHaveURL(/#reports/);
    await expect(page.locator('h1')).toContainText(/reports/i);
    
    // Navigate directly to settings via hash
    await page.goto('/#settings');
    await expect(page).toHaveURL(/#settings/);
    await expect(page.locator('h1')).toContainText(/settings/i);
  });
});
