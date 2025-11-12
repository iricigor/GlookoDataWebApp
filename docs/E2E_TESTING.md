# End-to-End Testing with Playwright

This document provides comprehensive guidance on running and writing E2E tests for GlookoDataWebApp using Playwright.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Page Object Model](#page-object-model)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The GlookoDataWebApp uses [Playwright](https://playwright.dev/) for end-to-end testing. Playwright provides:

- **Cross-browser support**: Tests run on Chromium, Firefox, and WebKit
- **Auto-wait**: Automatically waits for elements to be ready before performing actions
- **Powerful debugging**: Trace viewer, screenshots, and videos for failed tests
- **Fast execution**: Parallel test execution with smart test isolation
- **Reliable testing**: Built-in retry mechanism and flake-resistant APIs

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm installed
- Project dependencies installed (`npm install`)

### Installation

1. **Install dependencies** (includes Playwright):
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install chromium firefox webkit
   ```

   Or install only Chromium for faster setup:
   ```bash
   npx playwright install chromium
   ```

3. **Verify installation**:
   ```bash
   npx playwright --version
   ```

## Running Tests

### All Tests

Run all E2E tests across all configured browsers:
```bash
npm run test:e2e
```

### Specific Browser

Run tests on a specific browser:
```bash
# Chromium only
npm run test:e2e -- --project=chromium

# Firefox only
npm run test:e2e -- --project=firefox

# WebKit only
npm run test:e2e -- --project=webkit
```

### Interactive UI Mode

Run tests with Playwright's interactive UI:
```bash
npm run test:e2e:ui
```

This opens a visual interface where you can:
- See all tests
- Run individual tests
- Watch tests execute in real-time
- Inspect DOM snapshots

### Debug Mode

Run tests in debug mode with step-through capability:
```bash
npm run test:e2e:debug
```

### Headed Mode

Run tests with visible browser windows:
```bash
npm run test:e2e:headed
```

### Specific Test File

Run a specific test file:
```bash
npx playwright test tests/e2e/smoke/critical-paths.spec.ts
```

### Specific Test

Run a specific test by name:
```bash
npx playwright test -g "should load the application successfully"
```

### View Test Report

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/#home');
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    const element = page.locator('selector');
    
    // Act
    await element.click();
    
    // Assert
    await expect(page).toHaveURL(/#expected-url/);
  });
});
```

### Using Page Objects

Tests should use Page Object Models for maintainability:

```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('Home Page', () => {
  test('should navigate to upload page', async ({ homePage, page }) => {
    // Navigate to home
    await homePage.navigate();
    
    // Use page object methods
    await homePage.goToDataUpload();
    
    // Verify navigation
    await expect(page).toHaveURL(/#upload/);
  });
});
```

### Common Assertions

```typescript
// URL assertions
await expect(page).toHaveURL(/#home/);
await expect(page).toHaveURL(/.*upload/);

// Element visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toContainText('expected text');
await expect(element).toHaveText('exact text');

// Element state
await expect(element).toBeEnabled();
await expect(element).toBeDisabled();
await expect(element).toBeChecked();

// Count assertions
await expect(page.locator('.item')).toHaveCount(5);
```

### Locator Strategies

Best to worst order of preference:

1. **Role-based** (most accessible):
   ```typescript
   page.getByRole('button', { name: /submit/i })
   page.getByRole('link', { name: /home/i })
   ```

2. **Label text**:
   ```typescript
   page.getByLabel('Email')
   page.getByLabel('Password')
   ```

3. **Placeholder**:
   ```typescript
   page.getByPlaceholder('Enter your email')
   ```

4. **Text content**:
   ```typescript
   page.getByText('Welcome')
   page.locator('text=demo-data.zip')
   ```

5. **Test ID** (add `data-testid` attributes):
   ```typescript
   page.getByTestId('submit-button')
   ```

6. **CSS selector** (last resort):
   ```typescript
   page.locator('.class-name')
   page.locator('[class*="partialClass"]')
   ```

## Page Object Model

### Creating a Page Object

Page objects encapsulate page-specific logic:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class NewPage extends BasePage {
  // Define locators
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1');
    this.submitButton = page.getByRole('button', { name: /submit/i });
  }

  // Define page-specific methods
  async navigate() {
    await this.goto('new-page');
  }

  async submitForm() {
    await this.submitButton.click();
    await this.waitForNavigation();
  }

  async isHeadingVisible(): Promise<boolean> {
    return await this.isVisible(this.heading);
  }
}
```

### Using Page Objects in Tests

1. **Add to fixtures** (`tests/fixtures/base.fixture.ts`):
   ```typescript
   import { NewPage } from '../page-objects/new.page';

   type TestFixtures = {
     // ... existing fixtures
     newPage: NewPage;
   };

   export const test = base.extend<TestFixtures>({
     // ... existing fixtures
     newPage: async ({ page }, use) => {
       const newPage = new NewPage(page);
       await use(newPage);
     },
   });
   ```

2. **Use in tests**:
   ```typescript
   test('should work with new page', async ({ newPage }) => {
     await newPage.navigate();
     expect(await newPage.isHeadingVisible()).toBe(true);
   });
   ```

## Test Structure

### Directory Organization

```
tests/
├── e2e/
│   ├── smoke/                    # Critical path smoke tests
│   │   └── critical-paths.spec.ts
│   ├── navigation/               # Navigation-specific tests
│   │   └── navigation.spec.ts
│   └── pages/                    # Page-specific tests
│       ├── home.spec.ts
│       ├── data-upload.spec.ts
│       ├── reports.spec.ts
│       └── settings.spec.ts
├── fixtures/
│   └── base.fixture.ts           # Test fixtures with page objects
├── page-objects/
│   ├── base.page.ts              # Base page object
│   ├── home.page.ts              # Home page object
│   ├── data-upload.page.ts       # Data upload page object
│   ├── reports.page.ts           # Reports page object
│   ├── settings.page.ts          # Settings page object
│   ├── navigation.component.ts   # Navigation component
│   └── index.ts                  # Exports
└── utils/
    ├── helpers.ts                # Utility functions
    └── constants.ts              # Test constants
```

### Test Categories

1. **Smoke Tests** (`tests/e2e/smoke/`):
   - Critical user journeys
   - Must pass before any deployment
   - Run on every PR

2. **Feature Tests** (`tests/e2e/pages/`):
   - Comprehensive feature coverage
   - Page-specific functionality
   - Run on every PR

3. **Navigation Tests** (`tests/e2e/navigation/`):
   - Navigation functionality
   - URL routing
   - Page transitions

## Best Practices

### 1. Use Page Objects

✅ **Good**:
```typescript
test('should navigate', async ({ homePage, page }) => {
  await homePage.navigate();
  await homePage.goToDataUpload();
  await expect(page).toHaveURL(/#upload/);
});
```

❌ **Bad**:
```typescript
test('should navigate', async ({ page }) => {
  await page.goto('/#home');
  await page.click('a[href="#upload"]');
  await expect(page).toHaveURL(/#upload/);
});
```

### 2. Avoid Hard Waits

✅ **Good**:
```typescript
await expect(element).toBeVisible();
await element.click();
```

❌ **Bad**:
```typescript
await page.waitForTimeout(2000);
await element.click();
```

### 3. Use Descriptive Test Names

✅ **Good**:
```typescript
test('should display error message when submitting empty form', async ({ page }) => {
  // ...
});
```

❌ **Bad**:
```typescript
test('test1', async ({ page }) => {
  // ...
});
```

### 4. Keep Tests Independent

Each test should:
- Work in isolation
- Not depend on other tests
- Clean up after itself

### 5. Use beforeEach for Setup

```typescript
test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup for all tests in this suite
    await page.goto('/#home');
  });

  test('test 1', async ({ page }) => {
    // Test specific logic
  });

  test('test 2', async ({ page }) => {
    // Test specific logic
  });
});
```

### 6. Handle Async Operations Properly

Always await async operations:
```typescript
await page.goto('/');
await element.click();
await expect(page).toHaveURL(/expected/);
```

### 7. Use Soft Assertions Sparingly

For non-critical checks:
```typescript
await expect.soft(element).toBeVisible();
// Test continues even if this fails
```

## CI/CD Integration

### GitHub Actions

The project includes a CI workflow that:
- Runs E2E tests on every PR
- Executes tests in Chromium (configurable)
- Collects test artifacts (traces, screenshots, videos)
- Uploads Playwright report as artifact

### Configuration

See `.github/workflows/test.yml` for the complete configuration.

Key environment variables:
- `CI=true` - Enables CI-specific behavior
- `BASE_URL` - Override base URL for tests

### Artifacts

After each CI run:
- **Playwright Report**: HTML report with test results
- **Test Results**: Screenshots, videos, and traces for failed tests

Access artifacts from the GitHub Actions workflow summary.

## Troubleshooting

### Tests Fail Locally But Pass in CI

- Check browser versions: `npx playwright --version`
- Clear cache: `npx playwright install --force`
- Check for environment-specific issues

### Flaky Tests

1. **Use auto-waiting**: Let Playwright wait automatically
2. **Check locators**: Ensure they're specific enough
3. **Avoid race conditions**: Wait for network requests if needed
4. **Enable retries**: Set `retries: 2` in config for flaky tests

### Debugging Failed Tests

1. **Run in UI mode**:
   ```bash
   npm run test:e2e:ui
   ```

2. **Run in debug mode**:
   ```bash
   npm run test:e2e:debug
   ```

3. **View trace**:
   ```bash
   npx playwright show-trace trace.zip
   ```

4. **Take screenshot manually**:
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

### Browser Installation Issues

If browsers fail to install:
```bash
# Install with dependencies
npx playwright install --with-deps chromium

# Or install system dependencies separately
npx playwright install-deps
npx playwright install chromium
```

### Timeout Issues

Increase timeout for slow operations:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

Or globally in `playwright.config.ts`:
```typescript
timeout: 30000, // 30 seconds
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Discord Community](https://discord.com/invite/playwright)

## Support

For issues or questions:
1. Check existing tests for examples
2. Refer to Playwright documentation
3. Open an issue in the repository
4. Ask in team channels

---

**Happy Testing! 🎭**
