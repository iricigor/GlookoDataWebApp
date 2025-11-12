import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Settings Page Object Model
 * Represents the settings page
 */
export class SettingsPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly themeSection: Locator;
  readonly lightThemeButton: Locator;
  readonly darkThemeButton: Locator;
  readonly systemThemeButton: Locator;
  readonly exportFormatSection: Locator;
  readonly csvFormatButton: Locator;
  readonly xlsxFormatButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Define locators for settings page elements
    // Note: The actual heading is "Settings" (using Text component, not h1)
    this.pageHeading = page.locator('span').filter({ hasText: 'Settings' }).first();
    // Note: Title3 elements with specific text - use text content directly
    this.themeSection = page.getByText('Theme', { exact: true });
    this.lightThemeButton = page.getByRole('radio', { name: /^light$/i });
    this.darkThemeButton = page.getByRole('radio', { name: /^dark$/i });
    this.systemThemeButton = page.getByRole('radio', { name: /system/i });
    this.exportFormatSection = page.getByText('Export Format', { exact: true });
    // Note: Actual formats are CSV and TSV, not XLSX
    this.csvFormatButton = page.getByRole('radio', { name: /csv.*comma/i });
    this.xlsxFormatButton = page.getByRole('radio', { name: /tsv.*tab/i });
  }

  /**
   * Navigate to the settings page
   */
  async navigate() {
    await this.goto('settings');
  }

  /**
   * Check if page heading is visible
   */
  async isPageVisible(): Promise<boolean> {
    return await this.isVisible(this.pageHeading);
  }

  /**
   * Set theme to light mode
   */
  async setLightTheme() {
    await this.lightThemeButton.click();
    await this.wait(500); // Wait for theme to apply
  }

  /**
   * Set theme to dark mode
   */
  async setDarkTheme() {
    await this.darkThemeButton.click();
    await this.wait(500); // Wait for theme to apply
  }

  /**
   * Set theme to system default
   */
  async setSystemTheme() {
    await this.systemThemeButton.click();
    await this.wait(500); // Wait for theme to apply
  }

  /**
   * Set export format to CSV
   */
  async setCSVFormat() {
    await this.csvFormatButton.click();
  }

  /**
   * Set export format to TSV (Tab-Separated Values)
   * Note: The method is named setXLSXFormat for backwards compatibility with tests,
   * but it actually sets the TSV format since XLSX is not available in the UI
   */
  async setXLSXFormat() {
    await this.xlsxFormatButton.click();
  }
}
