import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Data Upload Page Object Model
 * Represents the data upload page
 */
export class DataUploadPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly uploadZone: Locator;
  readonly fileList: Locator;
  readonly demoDataItem: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Define locators for data upload page elements
    this.pageHeading = page.locator('h1', { hasText: /data upload/i });
    this.uploadZone = page.locator('[class*="uploadZone"]');
    this.fileList = page.locator('[class*="fileList"]');
    this.demoDataItem = page.locator('text=demo-data.zip');
    this.clearAllButton = page.getByRole('button', { name: /clear all/i });
  }

  /**
   * Navigate to the data upload page
   */
  async navigate() {
    await this.goto('upload');
  }

  /**
   * Check if page heading is visible
   */
  async isPageVisible(): Promise<boolean> {
    return await this.isVisible(this.pageHeading);
  }

  /**
   * Check if demo data is loaded
   */
  async isDemoDataLoaded(): Promise<boolean> {
    return await this.isVisible(this.demoDataItem);
  }

  /**
   * Get the count of uploaded files
   */
  async getFileCount(): Promise<number> {
    try {
      const items = await this.fileList.locator('[class*="fileItem"]').count();
      return items;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all uploaded files
   */
  async clearAllFiles() {
    if (await this.clearAllButton.isVisible()) {
      await this.clearAllButton.click();
    }
  }
}
