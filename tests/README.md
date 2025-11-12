# E2E Tests

This directory contains end-to-end tests for GlookoDataWebApp using Playwright.

## Quick Start

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific browser
npm run test:e2e -- --project=chromium
```

### Writing Tests

1. **Create a new test file** in the appropriate directory:
   - `tests/e2e/smoke/` - For critical path tests
   - `tests/e2e/pages/` - For page-specific tests
   - `tests/e2e/navigation/` - For navigation tests

2. **Use the test fixture** that provides page objects:
   ```typescript
   import { test, expect } from '../../fixtures/base.fixture';
   ```

3. **Write your test** using page objects:
   ```typescript
   test('should do something', async ({ homePage, page }) => {
     await homePage.navigate();
     await expect(page).toHaveURL(/#home/);
   });
   ```

## Directory Structure

```
tests/
├── e2e/                          # E2E test files
│   ├── smoke/                    # Critical path smoke tests
│   ├── navigation/               # Navigation tests
│   └── pages/                    # Page-specific tests
├── fixtures/                     # Test fixtures
│   └── base.fixture.ts           # Extended test with page objects
├── page-objects/                 # Page Object Models
│   ├── base.page.ts              # Base page functionality
│   ├── home.page.ts              # Home page
│   ├── data-upload.page.ts       # Data upload page
│   ├── reports.page.ts           # Reports page
│   ├── settings.page.ts          # Settings page
│   └── navigation.component.ts   # Navigation component
└── utils/                        # Test utilities
    ├── helpers.ts                # Helper functions
    └── constants.ts              # Test constants
```

## Test Coverage

### Current Tests (40 total)

- **Smoke Tests** (5 tests) - Critical user journeys
- **Navigation Tests** (8 tests) - Navigation functionality
- **Home Page Tests** (7 tests) - Landing page
- **Data Upload Tests** (5 tests) - File management
- **Reports Tests** (4 tests) - Report functionality
- **Settings Tests** (11 tests) - Settings management

## Page Objects

All tests use Page Object Model (POM) pattern for maintainability:

- `BasePage` - Common functionality for all pages
- `HomePage` - Home page interactions
- `DataUploadPage` - Data upload page interactions
- `ReportsPage` - Reports page interactions
- `SettingsPage` - Settings page interactions
- `NavigationComponent` - Navigation bar interactions

Page objects are automatically available in tests via fixtures.

## Best Practices

1. **Always use page objects** instead of direct page interactions
2. **Use descriptive test names** that explain what is being tested
3. **Keep tests independent** - don't rely on order or state from other tests
4. **Avoid hard waits** - let Playwright's auto-wait handle timing
5. **Use proper locators** - prefer role-based selectors over CSS
6. **Add assertions** - verify expected behavior explicitly

## Documentation

For complete documentation, see:
- [E2E Testing Guide](../docs/E2E_TESTING.md) - Comprehensive guide
- [Playwright Documentation](https://playwright.dev/) - Official docs

## CI/CD

E2E tests run automatically on:
- Every pull request
- Every push to main branch
- Manual workflow dispatch

Results and artifacts (screenshots, videos, traces) are available in GitHub Actions.
