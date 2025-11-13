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
    // Note: Navigation items are Fluent UI Cards with onClick handlers
    // Find the card by looking for the title text and navigating to parent card
    // Cards are rendered as div elements with specific structure
    this.uploadButton = page.locator('text=Data Upload').locator('xpath=ancestor::div[contains(@class, "fui-Card")]').first();
    this.reportsButton = page.locator('text=Comprehensive Reports').locator('xpath=ancestor::div[contains(@class, "fui-Card")]').first();
    this.aiAnalysisButton = page.locator('text=AI Analysis').locator('xpath=ancestor::div[contains(@class, "fui-Card")]').first();
    this.settingsButton = page.locator('text=Settings').locator('xpath=ancestor::div[contains(@class, "fui-Card")]').first();
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
