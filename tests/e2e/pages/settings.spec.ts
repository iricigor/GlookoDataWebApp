import { test, expect } from '../../fixtures/base.fixture';

/**
 * Settings Page Tests
 * Tests for the settings page functionality
 */

test.describe('Settings Page', () => {
  test.beforeEach(async ({ settingsPage }) => {
    await settingsPage.navigate();
  });

  test('should display page heading', async ({ settingsPage }) => {
    expect(await settingsPage.isPageVisible()).toBe(true);
    await expect(settingsPage.pageHeading).toBeVisible();
  });

  test('should display theme settings section', async ({ settingsPage }) => {
    await expect(settingsPage.themeSection).toBeVisible();
  });

  test('should display export format settings section', async ({ settingsPage }) => {
    await expect(settingsPage.exportFormatSection).toBeVisible();
  });

  test('should have theme radio buttons', async ({ settingsPage }) => {
    // Verify theme options are available
    await expect(settingsPage.lightThemeButton).toBeVisible();
    await expect(settingsPage.darkThemeButton).toBeVisible();
    await expect(settingsPage.systemThemeButton).toBeVisible();
  });

  test('should allow changing theme to light mode', async ({ settingsPage, page }) => {
    // Set to light theme
    await settingsPage.setLightTheme();
    
    // Wait for theme to apply
    await page.waitForTimeout(500);
    
    // Verify the radio button is checked
    await expect(settingsPage.lightThemeButton).toBeChecked();
  });

  test('should allow changing theme to dark mode', async ({ settingsPage, page }) => {
    // Set to dark theme
    await settingsPage.setDarkTheme();
    
    // Wait for theme to apply
    await page.waitForTimeout(500);
    
    // Verify the radio button is checked
    await expect(settingsPage.darkThemeButton).toBeChecked();
  });

  test('should have export format radio buttons', async ({ settingsPage }) => {
    // Verify export format options are available
    await expect(settingsPage.csvFormatButton).toBeVisible();
    await expect(settingsPage.xlsxFormatButton).toBeVisible();
  });

  test('should allow changing export format to CSV', async ({ settingsPage }) => {
    // Set to CSV format
    await settingsPage.setCSVFormat();
    
    // Verify the radio button is checked
    await expect(settingsPage.csvFormatButton).toBeChecked();
  });

  test('should allow changing export format to XLSX', async ({ settingsPage }) => {
    // Set to XLSX format
    await settingsPage.setXLSXFormat();
    
    // Verify the radio button is checked
    await expect(settingsPage.xlsxFormatButton).toBeChecked();
  });

  test('should persist settings after navigation', async ({ settingsPage, navigation, page }) => {
    // Set a specific theme
    await settingsPage.setDarkTheme();
    await page.waitForTimeout(500);
    
    // Navigate away
    await navigation.navigateToHome();
    await page.waitForTimeout(500);
    
    // Navigate back
    await navigation.navigateToSettings();
    await page.waitForTimeout(500);
    
    // Verify the setting persisted
    await expect(settingsPage.darkThemeButton).toBeChecked();
  });
});
