import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testDemoDataLoading() {
  console.log('Starting demo data loading test...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take screenshot of home page
    const screenshotsDir = join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    console.log('Taking screenshot of home page...');
    await page.screenshot({ path: join(screenshotsDir, '01-home-page.png'), fullPage: true });
    
    // Navigate to Data Upload page
    console.log('Navigating to Data Upload page...');
    await page.click('text=Data Upload');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '02-data-upload-page.png'), fullPage: true });
    
    // Click "Load Demo Data" button
    console.log('Clicking Load Demo Data button...');
    await page.click('button:has-text("Load Demo Data")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '03-demo-data-dialog.png'), fullPage: true });
    
    // Select Joshua demo data
    console.log('Selecting Joshua demo dataset...');
    const joshuaButton = page.locator('button:has-text("Joshua")').first();
    await joshuaButton.click();
    await page.waitForTimeout(3000); // Wait for data to load
    await page.screenshot({ path: join(screenshotsDir, '04-joshua-data-loaded.png'), fullPage: true });
    
    // Navigate to Reports page
    console.log('Navigating to Reports page...');
    await page.click('text=Reports');
    await page.waitForTimeout(3000); // Wait for reports to render
    await page.screenshot({ path: join(screenshotsDir, '05-reports-with-joshua.png'), fullPage: true });
    
    // Scroll down to see more of the report
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(screenshotsDir, '06-reports-scrolled.png'), fullPage: true });
    
    // Go back to Data Upload and load Nancy's data
    console.log('Loading Nancy demo dataset...');
    await page.click('text=Data Upload');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Load Demo Data")');
    await page.waitForTimeout(1000);
    const nancyButton = page.locator('button:has-text("Nancy")').first();
    await nancyButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(screenshotsDir, '07-nancy-data-loaded.png'), fullPage: true });
    
    // Check Nancy's reports
    console.log('Viewing Nancy reports...');
    await page.click('text=Reports');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(screenshotsDir, '08-reports-with-nancy.png'), fullPage: true });
    
    console.log('\n✅ Test completed successfully!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: join(screenshotsDir, 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

testDemoDataLoading().catch(console.error);
