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
    // Note: The actual heading is "Data Upload" (using Text component, not h1)
    this.pageHeading = page.locator('span').filter({ hasText: 'Data Upload' }).first();
    // Note: The upload zone uses 'dropzone' class, but with CSS-in-JS hashing
    // Use unique text content to identify it
    this.uploadZone = page.locator('text=Drop ZIP files here or click to browse').locator('..');
    // Note: The file list container doesn't have a specific fileList class
    this.fileList = page.locator('table').first();
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
      // Look for table rows (excluding header row)
      const rows = await this.page.locator('table tbody tr').count();
      return rows;
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
