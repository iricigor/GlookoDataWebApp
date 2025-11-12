import { test as base } from '@playwright/test';
import {
  HomePage,
  DataUploadPage,
  ReportsPage,
  SettingsPage,
  NavigationComponent,
} from '../page-objects';

/**
 * Extended test fixtures with page objects
 * Makes page objects available in all tests
 */
type TestFixtures = {
  homePage: HomePage;
  dataUploadPage: DataUploadPage;
  reportsPage: ReportsPage;
  settingsPage: SettingsPage;
  navigation: NavigationComponent;
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<TestFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  dataUploadPage: async ({ page }, use) => {
    const dataUploadPage = new DataUploadPage(page);
    await use(dataUploadPage);
  },

  reportsPage: async ({ page }, use) => {
    const reportsPage = new ReportsPage(page);
    await use(reportsPage);
  },

  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await use(settingsPage);
  },

  navigation: async ({ page }, use) => {
    const navigation = new NavigationComponent(page);
    await use(navigation);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect } from '@playwright/test';
