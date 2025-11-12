import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Reports Page Object Model
 * Represents the reports page
 */
export class ReportsPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly exportButton: Locator;
  readonly noDataMessage: Locator;
  readonly reportContent: Locator;

  constructor(page: Page) {
    super(page);
    
    // Define locators for reports page elements
    this.pageHeading = page.locator('h1', { hasText: /reports/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.noDataMessage = page.locator('text=/no.*file.*selected/i');
    this.reportContent = page.locator('[class*="reportContent"]');
  }

  /**
   * Navigate to the reports page
   */
  async navigate() {
    await this.goto('reports');
  }

  /**
   * Check if page heading is visible
   */
  async isPageVisible(): Promise<boolean> {
    return await this.isVisible(this.pageHeading);
  }

  /**
   * Check if no data message is displayed
   */
  async hasNoDataMessage(): Promise<boolean> {
    return await this.isVisible(this.noDataMessage);
  }

  /**
   * Check if report content is displayed
   */
  async hasReportContent(): Promise<boolean> {
    return await this.isVisible(this.reportContent);
  }

  /**
   * Export report if available
   */
  async exportReport() {
    if (await this.exportButton.isVisible()) {
      await this.exportButton.click();
    }
  }
}
