import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Home Page Object Model
 * Represents the home/landing page of the application
 */
export class HomePage extends BasePage {
  // Locators
  readonly welcomeHeading: Locator;
  readonly uploadButton: Locator;
  readonly reportsButton: Locator;
  readonly aiAnalysisButton: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Define locators for home page elements
    this.welcomeHeading = page.locator('h1', { hasText: 'Welcome to GlookoDataWebApp' });
    this.uploadButton = page.getByRole('link', { name: /data upload/i });
    this.reportsButton = page.getByRole('link', { name: /reports/i });
    this.aiAnalysisButton = page.getByRole('link', { name: /ai analysis/i });
    this.settingsButton = page.getByRole('link', { name: /settings/i });
  }

  /**
   * Navigate to the home page
   */
  async navigate() {
    await this.goto('home');
  }

  /**
   * Check if the welcome message is visible
   */
  async isWelcomeVisible(): Promise<boolean> {
    return await this.isVisible(this.welcomeHeading);
  }

  /**
   * Navigate to Data Upload page
   */
  async goToDataUpload() {
    await this.uploadButton.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Reports page
   */
  async goToReports() {
    await this.reportsButton.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to AI Analysis page
   */
  async goToAIAnalysis() {
    await this.aiAnalysisButton.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Settings page
   */
  async goToSettings() {
    await this.settingsButton.click();
    await this.waitForNavigation();
  }
}
