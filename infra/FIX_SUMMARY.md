# Infrastructure as Code - What-If Analysis Fix Summary

## Overview

This PR addresses all the issues identified in the first `az deployment group what-if` run for the GlookoDataWebApp infrastructure deployment. The changes ensure that deploying the Bicep templates will not cause service disruption or unexpected resource modifications.

## Problem Statement

The initial what-if analysis showed several concerning changes:
- ❌ Table Storage CORS rules being removed (would break frontend)
- ❌ New App Service Plan being created instead of using existing one
- ❌ App Insights integration tag being removed
- ⚠️ Various tag changes and property additions

## Solution Implemented

### 1. Added Configurable Parameters

**In `main.bicep`:**
- `enableTableCors` (bool) - Enable/disable CORS for Table Storage
- `tableCorsAllowedOrigins` (array) - Allowed origins for CORS
- `useExistingAppServicePlan` (bool) - Use existing vs. create new hosting plan
- `existingAppServicePlanName` (string) - Name of existing plan to use
- `appInsightsResourceId` (string) - App Insights resource ID for integration

### 2. Updated Module Files

**`modules/storage.bicep`:**
- Added CORS configuration support with conditional properties
- CORS rules are only applied when `enableTableCors = true`
- Preserves existing CORS configuration from production

**`modules/function-app.bicep`:**
- Added support for using existing App Service Plan
- Conditionally creates new plan only when `useExistingAppServicePlan = false`
- Added `hidden-link` tag for App Insights when resource ID is provided
- Added missing siteConfig properties (localMySqlEnabled, netFrameworkVersion)

### 3. Updated Parameter Files

**`parameters.current.bicepparam` (Production):**
```bicep
// Preserve existing infrastructure
param useExistingAppServicePlan = true
param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'

// Preserve CORS for frontend access
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Maintain App Insights integration
param appInsightsResourceId = '/subscriptions/.../components/glookodatawebapp-func'
```

**`parameters.generic.bicepparam` (New Deployments):**
```bicep
// Create new hosting plan
param useExistingAppServicePlan = false
param existingAppServicePlanName = ''

// Enable CORS for web access
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Optional App Insights
param appInsightsResourceId = ''
```

### 4. Created Validation and Documentation

**Scripts:**
- `validate.sh` - Quick validation script that checks:
  - Bicep syntax validation
  - Parameter file validation
  - Critical parameter verification
  - Provides next steps

**Documentation:**
- `WHAT_IF_ANALYSIS.md` - Comprehensive analysis of each what-if change
  - Why each change appears
  - Whether it's acceptable
  - How it was fixed
  
- `EXPECTED_WHAT_IF.md` - Guide for running what-if after fixes
  - Expected changes (green flags ✅)
  - Red flags to watch for (🚨)
  - Troubleshooting guide
  
- Updated `README.md` with improved deployment workflow

## Expected What-If Results

After applying these fixes, running `az deployment group what-if` should show:

### ✅ Expected Changes (Safe to Deploy)

**Resources to Create (2):**
- Storage Table Data Contributor role assignment (for Managed Identity)
- Storage Blob Data Contributor role assignment (for Managed Identity)

**Resources to Modify (5-6):**
- Key Vault - Security improvements (purge protection, network ACLs)
- Managed Identity - Tag standardization
- Storage Account - Tag standardization
- Table Service - CORS preserved (no longer shows removal)
- Function App - Tag updates, security settings, uses existing plan
- Static Web App - Tag additions, build properties

**Resources with No Change (3):**
- UserSettings table
- ProUsers table
- AIQueryLogs table

### 🚨 Red Flags (Should NOT Appear)

If you see any of these, **DO NOT deploy**:

1. **Table Service CORS Removal:**
   ```
   - properties.cors.corsRules: [...]
   ```
   This means CORS configuration is not working - frontend will break.

2. **New App Service Plan Creation:**
   ```
   + Microsoft.Web/serverfarms/glookodatawebapp-func-plan
   ```
   This means the function app would move to a new plan.

3. **Resource Deletions:**
   ```
   - Microsoft.Storage/storageAccounts/...
   - Microsoft.KeyVault/vaults/...
   - Microsoft.Storage/.../tables/...
   ```
   This would cause DATA LOSS - stop immediately!

## How to Verify and Deploy

### Step 1: Validate Templates

```bash
cd infra
./validate.sh
```

Expected output:
```
✓ All Bicep templates are syntactically valid
✓ Parameter files are valid
✓ Table CORS is enabled
✓ Using existing App Service Plan
✓ App Insights integration configured
```

### Step 2: Run What-If Analysis

```bash
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

### Step 3: Review What-If Output

Compare the output with `EXPECTED_WHAT_IF.md`:
- ✅ Check that expected changes are present
- 🚨 Verify no red flags appear
- ℹ️ Review any unexpected changes

### Step 4: Deploy (After Verification)

Only proceed if what-if matches expectations:

```bash
az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam \
  --confirm-with-what-if
```

The `--confirm-with-what-if` flag will show the what-if output again and prompt for confirmation.

## Benefits of This Approach

1. ✅ **No Service Disruption** - CORS preserved, existing hosting plan used
2. ✅ **Security Improvements** - Purge protection, HTTPS enforcement, RBAC
3. ✅ **Flexibility** - Same templates work for new and existing deployments
4. ✅ **Better Governance** - Standardized tags, IaC management
5. ✅ **Passwordless Auth** - Managed Identity RBAC instead of connection strings
6. ✅ **Validation Tools** - Easy to verify before deploying
7. ✅ **Comprehensive Docs** - Clear explanation of all changes

## Technical Details

### CORS Configuration

The CORS configuration ensures the frontend can access Table Storage directly from the browser:

```bicep
cors: {
  corsRules: [
    {
      allowedOrigins: ['*']  // Or specific domain
      allowedMethods: ['GET', 'PUT', 'POST', 'DELETE']
      allowedHeaders: ['*']
      exposedHeaders: ['*']
      maxAgeInSeconds: 3600
    }
  ]
}
```

### Hosting Plan Flexibility

The template can now:
- Use existing shared plan (production use case)
- Create dedicated plan (new deployment use case)

Controlled by parameters:
```bicep
param useExistingAppServicePlan = true
param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'
```

### App Insights Integration

The `hidden-link` tag connects the Function App to Application Insights:

```bicep
tags: {
  'hidden-link: /app-insights-resource-id': '/subscriptions/.../components/...'
}
```

This enables:
- Automatic correlation of logs and metrics
- Better monitoring in Azure Portal
- Dependency tracking

## Files Changed

### Modified Files
- `infra/main.bicep` - Added new parameters
- `infra/modules/storage.bicep` - Added CORS support
- `infra/modules/function-app.bicep` - Added hosting plan flexibility and App Insights
- `infra/parameters.current.bicepparam` - Configured for production
- `infra/parameters.generic.bicepparam` - Configured for new deployments
- `infra/README.md` - Updated documentation
- `.gitignore` - Excluded auto-generated JSON files

### New Files
- `infra/validate.sh` - Quick validation script
- `infra/WHAT_IF_ANALYSIS.md` - Detailed analysis of changes
- `infra/EXPECTED_WHAT_IF.md` - Expected results and red flags

## Questions Answered

### Q: Why were RBAC role assignments being created?
**A:** These are new and enable Managed Identity to access Storage using RBAC instead of connection strings. This is more secure and follows Azure best practices.

### Q: Is it safe to enable purge protection on Key Vault?
**A:** Yes, this is required for production. It prevents permanent deletion of secrets. Note: Once enabled, it cannot be disabled.

### Q: Why not always create a new App Service Plan?
**A:** Production uses a shared Consumption plan. Creating a new plan would move the Function App unnecessarily. New deployments should create their own plan.

### Q: Will frontend break if CORS is not configured?
**A:** Yes, browsers block cross-origin requests. Without CORS, the frontend cannot access Table Storage directly.

## Next Steps

1. ✅ Review this summary and the detailed documentation
2. ✅ Run `validate.sh` to verify template syntax
3. ✅ Run `az deployment group what-if` to preview changes
4. ✅ Compare output with `EXPECTED_WHAT_IF.md`
5. ✅ If everything looks good, proceed with deployment
6. ✅ After deployment, verify frontend still works
7. ✅ Check Function App monitoring in App Insights

## Support

For questions or issues:
- Review `WHAT_IF_ANALYSIS.md` for detailed explanations
- Check `EXPECTED_WHAT_IF.md` for troubleshooting
- See `README.md` for complete deployment guide
- Open a GitHub issue if you encounter unexpected behavior

---

**Author:** GitHub Copilot  
**Date:** 2024-12-29  
**Status:** Ready for Testing and Deployment
