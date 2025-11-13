import { test, expect } from '../../fixtures/base.fixture';

/**
 * Home Page Tests
 * Tests for the home/landing page functionality
 */

test.describe('Home Page', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigate();
  });

  test('should display welcome message', async ({ homePage }) => {
    // Verify welcome heading is visible
    await expect(homePage.welcomeHeading).toBeVisible();
    expect(await homePage.isWelcomeVisible()).toBe(true);
  });

  test('should display navigation buttons/cards', async ({ homePage }) => {
    // Verify all navigation buttons are visible
    await expect(homePage.uploadButton).toBeVisible();
    await expect(homePage.reportsButton).toBeVisible();
    await expect(homePage.aiAnalysisButton).toBeVisible();
    await expect(homePage.settingsButton).toBeVisible();
  });

  test('should navigate to Data Upload from home page button', async ({ homePage, page }) => {
    await homePage.goToDataUpload();
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/#upload/);
    await expect(page.locator('span').filter({ hasText: 'Data Upload' })).toBeVisible();
  });

  test('should navigate to Reports from home page button', async ({ homePage, page }) => {
    await homePage.goToReports();
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/#reports/);
    await expect(page.locator('span').filter({ hasText: 'Comprehensive Reports' })).toBeVisible();
  });

  test('should navigate to AI Analysis from home page button', async ({ homePage, page }) => {
    await homePage.goToAIAnalysis();
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/#ai/);
    await expect(page.locator('span').filter({ hasText: 'AI-Powered Analysis' })).toBeVisible();
  });

  test('should navigate to Settings from home page button', async ({ homePage, page }) => {
    await homePage.goToSettings();
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/#settings/);
    await expect(page.locator('span').filter({ hasText: 'Settings' }).first()).toBeVisible();
  });

  test('should display app title correctly', async ({ homePage }) => {
    const title = await homePage.getTitle();
    expect(title).toMatch(/Glooko/i);
  });

  test('should have footer visible', async ({ page }) => {
    // Check for footer presence
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
