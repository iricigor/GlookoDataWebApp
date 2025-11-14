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
  
  // 1. Home Page
  console.log('\nHome page...');
  await page.goto(`${BASE_URL}/#home`);
  await waitForStability(page);
  await takeScreenshot(page, '01-home', subdir);
  
  // 2. Data Upload Page
  console.log('\nData Upload page...');
  await page.goto(`${BASE_URL}/#upload`);
  await waitForStability(page);
  await takeScreenshot(page, '02-upload-with-file', subdir);
  
  // 3. Reports Page - All tabs
  console.log('\nReports page...');
  await page.goto(`${BASE_URL}/#reports`);
  await waitForStability(page);
  
  // Reports - File Info
  await page.getByRole('tab', { name: 'File Info' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '03-reports-file-info', subdir);
  
  // Reports - Time in Range
  await page.getByRole('tab', { name: 'Time in Range' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '04-reports-time-in-range', subdir);
  
  // Reports - AGP Data
  await page.getByRole('tab', { name: 'AGP Data' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '05-reports-agp-data', subdir);
  
  // Reports - Detailed CGM
  await page.getByRole('tab', { name: 'Detailed CGM' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '06-reports-detailed-cgm', subdir);
  
  // Reports - Detailed Insulin
  await page.getByRole('tab', { name: 'Detailed Insulin' }).click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '07-reports-detailed-insulin', subdir);
  
  // 4. AI Analysis Page - All tabs
  console.log('\nAI Analysis page...');
  await page.goto(`${BASE_URL}/#ai`);
  await waitForStability(page);
  
  // Check if we need to set an API key first
  const needsApiKey = await page.getByText('Please add your API key').isVisible().catch(() => false);
  
  if (needsApiKey) {
    // Go to settings and add a dummy API key
    await page.goto(`${BASE_URL}/#settings`);
    await waitForStability(page);
    await page.getByRole('tab', { name: 'Data & AI' }).click();
    await page.waitForTimeout(500);
    
    // Find and fill Perplexity API key field
    const apiKeyInput = page.getByLabel('Perplexity API Key');
    await apiKeyInput.fill('dummy-api-key-for-screenshots');
    await page.waitForTimeout(500);
    
    // Go back to AI Analysis page
    await page.goto(`${BASE_URL}/#ai`);
    await waitForStability(page);
  }
  
  // Now capture AI Analysis tabs
  // AI - File Info
  await page.getByRole('tab', { name: 'File Info' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '08-ai-file-info', subdir);
  
  // AI - Time in Range
  await page.getByRole('tab', { name: 'Time in Range' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '09-ai-time-in-range', subdir);
  
  // AI - Glucose & Insulin
  await page.getByRole('tab', { name: 'Glucose & Insulin' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '10-ai-glucose-insulin', subdir);
  
  // AI - Meal Timing
  await page.getByRole('tab', { name: 'Meal Timing' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '11-ai-meal-timing', subdir);
  
  // AI - Pump Settings
  await page.getByRole('tab', { name: 'Pump Settings' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '12-ai-pump-settings', subdir);
  
  // 5. Settings Page - All tabs
  console.log('\nSettings page...');
  await page.goto(`${BASE_URL}/#settings`);
  await waitForStability(page);
  
  // Settings - General
  await page.getByRole('tab', { name: 'General' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '13-settings-general', subdir);
  
  // Settings - Data & AI
  await page.getByRole('tab', { name: 'Data & AI' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '14-settings-data-ai', subdir);
  
  // Settings - About
  await page.getByRole('tab', { name: 'About' }).click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, '15-settings-about', subdir);
  
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
