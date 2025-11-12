import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Navigation Component Object Model
 * Represents the navigation bar present on all pages
 */
export class NavigationComponent extends BasePage {
  // Locators for navigation items
  readonly homeLink: Locator;
  readonly uploadLink: Locator;
  readonly reportsLink: Locator;
  readonly aiAnalysisLink: Locator;
  readonly settingsLink: Locator;

  constructor(page: Page) {
    super(page);
    
    // Define navigation locators - Navigation uses buttons, not links
    this.homeLink = page.getByRole('button', { name: /home/i });
    this.uploadLink = page.getByRole('button', { name: /data upload/i });
    this.reportsLink = page.getByRole('button', { name: /reports/i });
    this.aiAnalysisLink = page.getByRole('button', { name: /ai analysis/i });
    this.settingsLink = page.getByRole('button', { name: /settings/i });
  }

  /**
   * Navigate to Home page
   */
  async navigateToHome() {
    await this.homeLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Data Upload page
   */
  async navigateToUpload() {
    await this.uploadLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Reports page
   */
  async navigateToReports() {
    await this.reportsLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to AI Analysis page
   */
  async navigateToAIAnalysis() {
    await this.aiAnalysisLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Settings page
   */
  async navigateToSettings() {
    await this.settingsLink.click();
    await this.waitForNavigation();
  }

  /**
   * Verify navigation is visible
   */
  async isNavigationVisible(): Promise<boolean> {
    return await this.isVisible(this.homeLink);
  }
}
