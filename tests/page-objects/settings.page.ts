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
    this.pageHeading = page.locator('h1', { hasText: /settings/i });
    this.themeSection = page.locator('text=/theme/i');
    this.lightThemeButton = page.getByRole('radio', { name: /light/i });
    this.darkThemeButton = page.getByRole('radio', { name: /dark/i });
    this.systemThemeButton = page.getByRole('radio', { name: /system/i });
    this.exportFormatSection = page.locator('text=/export format/i');
    this.csvFormatButton = page.getByRole('radio', { name: /csv/i });
    this.xlsxFormatButton = page.getByRole('radio', { name: /xlsx/i });
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
   * Set export format to XLSX
   */
  async setXLSXFormat() {
    await this.xlsxFormatButton.click();
  }
}
