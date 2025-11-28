# Scripts Directory

This directory contains utility scripts and tools for the GlookoDataWebApp project.

## 📁 Directory Structure

```
scripts/
├── README.md                        # This file
├── deployment-cli/                  # Bash scripts for Azure deployment
│   ├── config-lib.sh               # Shared configuration library
│   ├── config.template.json        # Configuration template
│   ├── deploy-azure-storage-account.sh  # Azure Storage Account deployment
│   ├── deploy-azure-function.sh    # Azure Function App deployment
│   └── README.md                   # Bash scripts documentation
├── deployment-ps/                   # PowerShell module for Azure deployment
│   ├── GlookoDeployment/           # PowerShell module
│   │   ├── GlookoDeployment.psd1   # Module manifest
│   │   ├── GlookoDeployment.psm1   # Module loader
│   │   ├── Public/                 # Exported functions
│   │   └── Private/                # Internal helper functions
│   ├── Install-GlookoDeploymentModule.ps1  # One-liner installer
│   └── README.md                   # PowerShell module documentation
├── capture-screenshots.ts           # Screenshot capture tool
├── generate-demo-data.js            # Demo data generator
├── generate-demo-from-real-data.js
├── generate-german-demo-data.js
├── test-demo-loading.mjs
├── test-german-demo-data.mjs
└── test-german-import-e2e.mjs
```

## 🚀 Azure Deployment Scripts

Scripts for deploying Azure infrastructure for GlookoDataWebApp.

### Bash Scripts (deployment-cli/)

Run in Azure Cloud Shell or any environment with Azure CLI:

```bash
# Deploy Storage Account
curl -o deploy-azure-storage-account.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-cli/deploy-azure-storage-account.sh
chmod +x deploy-azure-storage-account.sh
./deploy-azure-storage-account.sh

# Deploy Function App
curl -o deploy-azure-function.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-cli/deploy-azure-function.sh
chmod +x deploy-azure-function.sh
./deploy-azure-function.sh
```

See [deployment-cli/README.md](deployment-cli/README.md) for full documentation.

### PowerShell Module (deployment-ps/)

Install and use the GlookoDeployment module:

```powershell
# One-liner install
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

# Deploy Storage Account
Set-GlookoStorageAccount

# Deploy Azure Function
Set-GlookoAzureFunction
```

See [deployment-ps/README.md](deployment-ps/README.md) for full documentation.

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
