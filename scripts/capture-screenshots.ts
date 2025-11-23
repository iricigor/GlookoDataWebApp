import { chromium, Browser, Page } from '@playwright/test';
import * as path from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/tmp/screenshots';

interface ViewportSize {
  width: number;
  height: number;
}

const DESKTOP_VIEWPORT: ViewportSize = { width: 1920, height: 1080 };
const MOBILE_VIEWPORT: ViewportSize = { width: 375, height: 812 };

// Wait for animations and network to settle
async function waitForStability(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Additional wait for animations
}

// Set theme mode
async function setTheme(page: Page, theme: 'light' | 'dark') {
  // Navigate to settings
  await page.goto(`${BASE_URL}/#settings`);
  await waitForStability(page);
  
  // Click on General tab (should be default, but make sure)
  await page.getByRole('tab', { name: 'General' }).click();
  await page.waitForTimeout(500);
  
  // Find and click the theme radio button
  const themeLabel = theme === 'light' ? 'Light' : 'Dark';
  await page.getByLabel(themeLabel, { exact: true }).click();
  await page.waitForTimeout(1000); // Wait for theme to apply
}

// Take a screenshot
async function takeScreenshot(page: Page, name: string, subdir: string) {
  const filepath = path.join(SCREENSHOT_DIR, subdir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`✓ Captured: ${subdir}/${name}.png`);
}

// Accept cookie consent
async function acceptCookies(page: Page) {
  // Look for the cookie consent dialog with "Got it" button
  try {
    const acceptButton = page.getByRole('button', { name: 'Got it' });
    const isVisible = await acceptButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isVisible) {
      await acceptButton.click();
      await page.waitForTimeout(1000); // Wait for cookie to be set and banner to disappear
      console.log('  ✓ Accepted cookies');
      return true;
    }
  } catch (e) {
    console.log('  ⚠ Cookie banner not found or already dismissed');
  }
  return false;
}

// Capture screenshots for a specific mode
async function captureMode(browser: Browser, mode: 'light' | 'dark' | 'mobile') {
  const viewport = mode === 'mobile' ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT;
  const theme = mode === 'mobile' ? 'dark' : mode;
  const subdir = mode;
  
  console.log(`\n📸 Capturing ${mode} mode screenshots...`);
  
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: mode === 'mobile' ? 2 : 1,
  });
  
  const page = await context.newPage();
  
  // Set theme
  await setTheme(page, theme);
  
  // 1. Home Page - WITH cookie banner
  console.log('\nHome page (with cookie banner)...');
  await page.goto(`${BASE_URL}/#home`);
  await waitForStability(page);
  await takeScreenshot(page, '01-home-with-cookies', subdir);
  
  // Accept cookies
  await acceptCookies(page);
  
  // 2. Home Page - WITHOUT cookie banner
  console.log('Home page (without cookie banner)...');
  await page.goto(`${BASE_URL}/#home`);
  await waitForStability(page);
  await takeScreenshot(page, '02-home', subdir);
  
  // 3. Data Upload Page
  console.log('\nData Upload page...');
  await page.goto(`${BASE_URL}/#upload`);
  await waitForStability(page);
  await takeScreenshot(page, '03-upload-with-file', subdir);
  
  // 4. Reports Page - All tabs
  console.log('\nReports page...');
  await page.goto(`${BASE_URL}/#reports`);
  await waitForStability(page);
  
  // Reports - File Info
  await page.getByRole('tab', { name: 'File Info' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '04-reports-file-info', subdir);
  
  // Reports - Time in Range
  await page.getByRole('tab', { name: 'Time in Range' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '05-reports-time-in-range', subdir);
  
  // Reports - AGP Data
  await page.getByRole('tab', { name: 'AGP Data' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '06-reports-agp-data', subdir);
  
  // Reports - Detailed CGM
  await page.getByRole('tab', { name: 'Detailed CGM' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '07-reports-detailed-cgm', subdir);
  
  // Reports - Detailed Insulin
  await page.getByRole('tab', { name: 'Detailed Insulin' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '08-reports-detailed-insulin', subdir);
  
  // 5. AI Analysis Page - All tabs
  console.log('\nAI Analysis page...');
  await page.goto(`${BASE_URL}/#ai`);
  await waitForStability(page);
  await page.waitForTimeout(2000); // Extra wait for any dynamic content
  
  // Take screenshots of AI Analysis tabs
  // The page should show vertical tabs on the left
  // AI - File Info (default tab)
  await takeScreenshot(page, '09-ai-file-info', subdir);
  
  // AI - Time in Range
  try {
    await page.getByText('Time in Range', { exact: true }).click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '10-ai-time-in-range', subdir);
  } catch (e) {
    console.log('  ⚠ Skipping Time in Range tab (not found or not clickable)');
  }
  
  // AI - Glucose & Insulin
  try {
    await page.getByText('Glucose & Insulin', { exact: true }).click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '11-ai-glucose-insulin', subdir);
  } catch (e) {
    console.log('  ⚠ Skipping Glucose & Insulin tab (not found or not clickable)');
  }
  
  // AI - Meal Timing
  try {
    await page.getByText('Meal Timing', { exact: true }).click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '12-ai-meal-timing', subdir);
  } catch (e) {
    console.log('  ⚠ Skipping Meal Timing tab (not found or not clickable)');
  }
  
  // AI - Pump Settings
  try {
    await page.getByText('Pump Settings', { exact: true }).click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '13-ai-pump-settings', subdir);
  } catch (e) {
    console.log('  ⚠ Skipping Pump Settings tab (not found or not clickable)');
  }
  
  // 6. Settings Page - All tabs
  console.log('\nSettings page...');
  await page.goto(`${BASE_URL}/#settings`);
  await waitForStability(page);
  
  // Settings - General (try to click, if already selected just capture)
  try {
    await page.getByRole('tab', { name: 'General' }).click({ timeout: 3000 });
    await page.waitForTimeout(500);
  } catch (e) {
    // Tab might already be selected
    await page.waitForTimeout(500);
  }
  await takeScreenshot(page, '14-settings-general', subdir);
  
  // Settings - Data & AI
  try {
    // Try different possible names for the tab
    const dataAiTab = page.locator('button[role="tab"]').filter({ hasText: /Data.*AI/ });
    await dataAiTab.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '15-settings-data-ai', subdir);
  } catch (e) {
    console.log('  ⚠ Skipping Data & AI tab (not found or not clickable)');
  }
  
  // Settings - About
  try {
    await page.getByRole('tab', { name: 'About' }).click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '16-settings-about', subdir);
  } catch (e) {
    console.log('  ⚠ Skipping About tab (not found or not clickable)');
  }
  
  await context.close();
  console.log(`✅ ${mode} mode complete!`);
}

async function main() {
  console.log('🎬 Starting screenshot capture...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${SCREENSHOT_DIR}`);
  
  const browser = await chromium.launch({
    headless: true,
  });
  
  try {
    // Capture all three modes
    await captureMode(browser, 'light');
    await captureMode(browser, 'dark');
    await captureMode(browser, 'mobile');
    
    console.log('\n✨ All screenshots captured successfully!');
    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

main();
