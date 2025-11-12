import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 * Provides common functionality for all page objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific page using hash routing
   */
  async goto(hash: string = '') {
    const url = hash ? `/#${hash}` : '/';
    await this.page.goto(url, { waitUntil: 'load' });
  }

  /**
   * Wait for navigation to complete
   * For hash-based routing in React apps, wait for React to render
   */
  async waitForNavigation() {
    // For hash navigation, wait for React to render the new content
    // This is still much faster than networkidle
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the current page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for a specific amount of time (use sparingly)
   */
  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }
}
