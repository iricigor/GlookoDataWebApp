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
    // Note: The actual heading is "Glooko Insights" and uses a Text/span component, not h1
    this.welcomeHeading = page.locator('span').filter({ hasText: 'Glooko Insights' }).first();
    // Note: Navigation items are Cards with onClick handlers
    // Use a simpler approach - find by role or data attribute, or just by text and parent selector
    // Cards are in a grid with cardsGrid class
    this.uploadButton = page.locator('[class*="cardsGrid"]').getByText('Data Upload', { exact: true });
    this.reportsButton = page.locator('[class*="cardsGrid"]').getByText('Comprehensive Reports', { exact: true });
    this.aiAnalysisButton = page.locator('[class*="cardsGrid"]').getByText('AI Analysis', { exact: true });
    this.settingsButton = page.locator('[class*="cardsGrid"]').getByText('Settings', { exact: true });
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
