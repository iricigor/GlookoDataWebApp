# Scripts Directory

This directory contains utility scripts for the GlookoDataWebApp project.

## Available Scripts

### 1. deploy-azure-app-registration.sh

**Purpose:** Automates the creation and configuration of an Azure App Registration for Microsoft authentication.

**Usage:**
```bash
./deploy-azure-app-registration.sh
```

**Environment:** Azure Cloud Shell (bash)

**What it does:**
- Creates an Azure App Registration in Microsoft Entra ID
- Configures authentication for personal Microsoft accounts only
- Sets up redirect URIs for the web application at glooko.iric.online
- Configures required Microsoft Graph API permissions
- Outputs configuration values for integration

**Documentation:** See [docs/AZURE_APP_REGISTRATION.md](../docs/AZURE_APP_REGISTRATION.md) for detailed setup guide.

**Prerequisites:**
- Access to Azure Cloud Shell
- Permissions to create App Registrations
- Application Administrator or Global Administrator role

### 2. generate-demo-data.js

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

## Directory Structure

```
scripts/
├── README.md                           # This file
├── deploy-azure-app-registration.sh    # Azure deployment script
└── generate-demo-data.js               # Demo data generator
```

## Related Documentation

- [Azure App Registration Guide](../docs/AZURE_APP_REGISTRATION.md) - Detailed setup instructions for Azure authentication
- [Contributing Guide](../CONTRIBUTING.md) - General contribution guidelines
- [Quick Start Guide](../QUICKSTART.md) - Getting started with development

## Notes

- Scripts in this directory are maintained as part of the GlookoDataWebApp project
- All scripts should include clear documentation and error handling
- Shell scripts should use `set -e` for error handling and `set -u` for undefined variable checking
- Scripts should be executable (`chmod +x script.sh`)
