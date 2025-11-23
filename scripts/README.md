# Scripts Directory

This directory contains utility scripts and tools for the GlookoDataWebApp project.

## 📁 Directory Structure

```
scripts/
├── README.md                    # This file
├── capture-screenshots.ts       # Screenshot capture tool
├── generate-demo-data.js        # Demo data generator
├── generate-demo-from-real-data.js
├── generate-german-demo-data.js
├── test-demo-loading.mjs
├── test-german-demo-data.mjs
└── test-german-import-e2e.mjs
```

## Available Utility Scripts

### 1. generate-demo-data.js

**Purpose:** Generates demo CGM (Continuous Glucose Monitoring) data with realistic glucose distributions for testing.

**Usage:**
```bash
node generate-demo-data.js
```

**Environment:** Node.js 20+

**What it does:**
- Generates realistic CGM data with proper glucose value distributions
- Creates demo data ZIP file in `public/demo-data.zip`
- Maintains specified percentage distributions across glucose ranges:
  - 1% very low (<3.0 mmol/L)
  - 2% low (3.0-3.8 mmol/L)
  - 71% in range (3.9-10.0 mmol/L)
  - 19% high (10.1-13.9 mmol/L)
  - 7% very high (14.0-16.5 mmol/L)

**Prerequisites:**
- Node.js 20 or higher
- npm dependencies installed

### 2. capture-screenshots.ts

**Purpose:** Automated screenshot capture tool for documentation.

**Usage:**
```bash
npm run capture-screenshots
```

**Environment:** Node.js 20+ with Playwright

**What it does:**
- Captures screenshots of various application pages
- Used for updating documentation and README
- Saves screenshots to `docs/screenshots/`

## Related Documentation

- [Deployment Guide](../docs/DEPLOYMENT.md) - Azure Static Web Apps deployment
- [Contributing Guide](../CONTRIBUTING.md) - General contribution guidelines
- [Quick Start Guide](../QUICKSTART.md) - Getting started with development

## Notes

- Scripts in this directory are maintained as part of the GlookoDataWebApp project
- All scripts should include clear documentation and error handling
- Scripts should be well-documented and easy to understand
