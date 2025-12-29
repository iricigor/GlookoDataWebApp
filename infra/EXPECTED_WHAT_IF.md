# Expected What-If Results After Fixes

This document describes what the `az deployment group what-if` output should look like after applying the fixes from this PR.

## Running the What-If

```bash
cd infra

# Validate Bicep syntax first
az bicep build --file main.bicep

# Run what-if analysis
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

## Expected Changes

### ✅ Resources to Create (2)

These are **new RBAC role assignments** - expected and required:

```
+ Microsoft.Storage/storageAccounts/glookodatawebappstorage/.../roleAssignments/1af27705-...
  Role: Storage Table Data Contributor
  Purpose: Enable Managed Identity to access Table Storage

+ Microsoft.Storage/storageAccounts/glookodatawebappstorage/.../roleAssignments/595708b8-...
  Role: Storage Blob Data Contributor
  Purpose: Enable Managed Identity to access Blob Storage
```

**Why:** These are required for passwordless authentication using Managed Identity.

### ✅ Resources to Modify (5-6)

Expected modifications (security improvements and tag updates):

#### 1. Key Vault
```
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  + properties.enablePurgeProtection: true
  + properties.networkAcls:
      bypass: "AzureServices"
      defaultAction: "Allow"
  ~ tags.ManagedBy: "AzureDeploymentScripts" => "Bicep"
```
**Why:** Security improvements - purge protection prevents accidental deletion, network ACLs add security layer.

#### 2. Managed Identity
```
~ Microsoft.ManagedIdentity/userAssignedIdentities/glookodatawebapp-identity
  + tags.Application: "GlookoDataWebApp"
  + tags.ManagedBy: "Bicep"
  ~ tags.Environment: "Production ManagedBy=..." => "Production"
```
**Why:** Tag standardization for better governance.

#### 3. Storage Account
```
~ Microsoft.Storage/storageAccounts/glookodatawebappstorage
  - tags.Purpose: "UserSettings"
  + tags.ManagedBy: "Bicep"
  ~ tags.Application: "glookodatawebapp" => "GlookoDataWebApp"
  x properties.encryption.services: (unsupported - no change)
```
**Why:** Tag standardization. Encryption services marked as unsupported are read-only.

#### 4. Table Service
```
~ Microsoft.Storage/storageAccounts/glookodatawebappstorage/tableServices/default
  = properties.cors.corsRules: [...]  (no change or ignore)
```
**Why:** CORS rules should now be preserved. May show as "no change" or "ignore" depending on exact match.

**⚠️ CRITICAL CHECK:** Verify that CORS rules are NOT being removed. If you still see:
```
- properties.cors.corsRules: [...]
```
This indicates a problem - the CORS configuration is not working as expected.

#### 5. Function App
```
~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.cors: {...}
  + properties.siteConfig.ftpsState: "Disabled"
  + properties.siteConfig.localMySqlEnabled: false
  + properties.siteConfig.minTlsVersion: "1.2"
  + properties.siteConfig.netFrameworkVersion: "v4.6"
  ~ properties.httpsOnly: false => true
  = properties.serverFarmId: "/subscriptions/.../WestEuropeLinuxDynamicPlan"
  ~ properties.siteConfig.linuxFxVersion: "Node|20" => "node|20"
  ~ tags.ManagedBy: "AzureDeploymentScripts" => "Bicep"
  + tags.hidden-link: /app-insights-resource-id: "..."
```
**Why:** Security improvements and configuration standardization. Server farm ID should show "no change" since we're using the existing plan.

**⚠️ CRITICAL CHECK:** Verify that `properties.serverFarmId` shows:
- Either `= (no change)` 
- Or `~ old => new` where both reference `WestEuropeLinuxDynamicPlan`

If you see a new plan being created:
```
+ Microsoft.Web/serverfarms/glookodatawebapp-func-plan
```
This indicates the `useExistingAppServicePlan` parameter is not working correctly.

#### 6. Static Web App
```
~ Microsoft.Web/staticSites/GlookoData
  - properties.deploymentAuthPolicy: "DeploymentToken"
  - properties.stableInboundIP: "20.101.2.157"
  - properties.trafficSplitting: {...}
  + properties.buildProperties: {...}
  + tags: {...}
```
**Why:** Read-only properties being removed by Azure, build properties being standardized, tags being added.

### ✅ Resources with No Change (3)

```
= Microsoft.Storage/storageAccounts/.../tables/AIQueryLogs
= Microsoft.Storage/storageAccounts/.../tables/ProUsers
= Microsoft.Storage/storageAccounts/.../tables/UserSettings
```

### ℹ️ Ignored Resources (3)

```
* Microsoft.Insights/components/glookodatawebapp-func
* Microsoft.Web/serverFarms/WestEuropeLinuxDynamicPlan
* microsoft.alertsmanagement/smartDetectorAlertRules/Failure Anomalies - glookodatawebapp-func
```
**Why:** These resources exist but are not managed by this template.

### ℹ️ Diagnostics (1)

```
[extensionResourceId(...)] (Unsupported) Changes to the resource declared at...cannot be analyzed
```
**Why:** This is a what-if limitation for extension resources (Key Vault role assignment). It will deploy correctly.

## Summary Counts

**Expected:**
- Resources to create: **2** (RBAC role assignments)
- Resources to modify: **5-6** (tag updates and security improvements)
- Resources with no change: **3** (tables)
- Unsupported: **1** (Key Vault role assignment - diagnostic only)
- Ignored: **3** (resources not managed by template)

## Red Flags 🚨

If you see any of these in the what-if output, **STOP and investigate:**

### 1. ❌ Table Service CORS Removal
```
~ Microsoft.Storage/storageAccounts/.../tableServices/default
  - properties.cors.corsRules: [...]
```
**Problem:** CORS configuration is not being preserved  
**Impact:** Frontend will break - cannot access Table Storage  
**Action:** Check `enableTableCors` parameter is set to `true` in parameters.current.bicepparam

### 2. ❌ New App Service Plan Creation
```
+ Microsoft.Web/serverfarms/glookodatawebapp-func-plan
```
**Problem:** Creating new plan instead of using existing  
**Impact:** Function App will move to new plan, possible cost implications  
**Action:** Check `useExistingAppServicePlan` is set to `true` and `existingAppServicePlanName` is correct

### 3. ❌ Resource Deletions
```
- Microsoft.Storage/storageAccounts/...
- Microsoft.KeyVault/vaults/...
```
**Problem:** Template would delete existing resources  
**Impact:** DATA LOSS, service outage  
**Action:** STOP IMMEDIATELY - check resource names match exactly

### 4. ❌ Table Deletions
```
- Microsoft.Storage/storageAccounts/.../tables/UserSettings
- Microsoft.Storage/storageAccounts/.../tables/ProUsers
```
**Problem:** Tables being deleted and recreated  
**Impact:** DATA LOSS  
**Action:** STOP IMMEDIATELY - check table names in parameters

## Green Flags ✅

These are **expected and acceptable** changes:

- ✅ Creating RBAC role assignments for Managed Identity
- ✅ Adding `enablePurgeProtection` to Key Vault
- ✅ Adding `networkAcls` to Key Vault
- ✅ Changing tags from "AzureDeploymentScripts" to "Bicep"
- ✅ Adding standardized tags (Application, Environment, ManagedBy)
- ✅ Setting `httpsOnly: true` on Function App
- ✅ Adding security settings (minTlsVersion, ftpsState)
- ✅ Adding `hidden-link` tag for App Insights
- ✅ Removing read-only properties from Static Web App

## After What-If Verification

If the what-if output matches the **Expected Changes** section above and shows **no red flags**, you can proceed with deployment:

```bash
az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam \
  --confirm-with-what-if
```

The `--confirm-with-what-if` flag will show the what-if output again and prompt for confirmation before deploying.

## Troubleshooting

### Issue: CORS Still Being Removed

**Check:**
1. `parameters.current.bicepparam` has `param enableTableCors = true`
2. `parameters.current.bicepparam` has `param tableCorsAllowedOrigins = ['*']`
3. Bicep template compiled successfully
4. Parameter file validated successfully

### Issue: New App Service Plan Being Created

**Check:**
1. `parameters.current.bicepparam` has `param useExistingAppServicePlan = true`
2. `parameters.current.bicepparam` has `param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'`
3. Existing plan name is correct (case-sensitive)

### Issue: App Insights Tag Not Being Added

**Check:**
1. `parameters.current.bicepparam` has `param appInsightsResourceId = '...'`
2. Resource ID is correct and complete
3. App Insights resource still exists

## Contact

If the what-if output shows unexpected results not covered in this document, please:
1. Do **not** proceed with deployment
2. Document the unexpected changes
3. Open a GitHub issue with the full what-if output
4. Wait for review before proceeding

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-29  
**Related:** WHAT_IF_ANALYSIS.md
