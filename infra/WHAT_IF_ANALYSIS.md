# What-If Analysis and Resolution

This document explains the changes identified in the first `az deployment group what-if` run and how they were addressed.

## Summary of Changes

The what-if analysis revealed several differences between the Bicep template and the existing Azure infrastructure. Most changes were categorized into:

1. ✅ **Expected and Acceptable** - Security improvements and new features
2. ⚠️ **Needs Attention** - Breaking changes that require configuration updates
3. ℹ️ **Informational** - Tag updates and minor property changes

## Detailed Analysis

### 1. Storage Table Service CORS Configuration ⚠️ CRITICAL

**What-If Output:**
```bicep
~ Microsoft.Storage/storageAccounts/glookodatawebappstorage/tableServices/default
  - properties:
      cors.corsRules: [...]
```

**Issue:** The existing Table Service has CORS rules that allow web browser access. Removing these would break the frontend application's ability to access Table Storage directly.

**Resolution:**
- Added `enableTableCors` parameter (default: `true`)
- Added `tableCorsAllowedOrigins` parameter (default: `['*']`)
- Updated `modules/storage.bicep` to include CORS configuration conditionally
- Updated parameter files to explicitly enable CORS with existing settings

**Impact:** ✅ FIXED - CORS rules are now preserved, preventing frontend breakage.

---

### 2. Function App Hosting Plan ⚠️ COST IMPACT

**What-If Output:**
```bicep
+ Microsoft.Web/serverfarms/glookodatawebapp-func-plan [2023-01-01]
~ Microsoft.Web/sites/glookodatawebapp-func
  ~ properties.serverFarmId: "WestEuropeLinuxDynamicPlan" => "glookodatawebapp-func-plan"
```

**Issue:** The template was creating a new App Service Plan (`glookodatawebapp-func-plan`) instead of using the existing shared plan (`WestEuropeLinuxDynamicPlan`).

**Analysis:**
- Creating a new Consumption plan has minimal cost impact (both are Y1/Dynamic)
- However, using the existing shared plan may be preferred for resource consolidation
- The what-if shows the function app being moved from one plan to another

**Resolution:**
- Added `useExistingAppServicePlan` parameter (default: `false`)
- Added `existingAppServicePlanName` parameter
- Updated `modules/function-app.bicep` to support both scenarios:
  - Create new plan when `useExistingAppServicePlan = false`
  - Reference existing plan when `useExistingAppServicePlan = true`
- Updated `parameters.current.bicepparam` to use existing plan:
  ```bicep
  param useExistingAppServicePlan = true
  param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'
  ```

**Impact:** ✅ FIXED - No new plan will be created; existing plan will be reused.

---

### 3. Application Insights Integration ℹ️ TAG UPDATE

**What-If Output:**
```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  - tags.hidden-link: /app-insights-resource-id: "/subscriptions/.../components/glookodatawebapp-func"
```

**Issue:** The Function App has a special tag that links it to Application Insights for monitoring. This tag was being removed.

**Resolution:**
- Added `appInsightsResourceId` parameter (optional)
- Updated `modules/function-app.bicep` to conditionally add the `hidden-link` tag when `appInsightsResourceId` is provided
- Updated `parameters.current.bicepparam` with the actual App Insights resource ID:
  ```bicep
  param appInsightsResourceId = '/subscriptions/6558e738-8188-4771-a5fb-b62f974f971c/resourceGroups/Glooko/providers/microsoft.insights/components/glookodatawebapp-func'
  ```

**Impact:** ✅ FIXED - App Insights link tag is now preserved.

---

### 4. Function App Configuration Properties ℹ️ ADDITIONS

**What-If Output:**
```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.localMySqlEnabled: false
  + properties.siteConfig.netFrameworkVersion: "v4.6"
  + properties.siteConfig.ftpsState: "Disabled"
  + properties.siteConfig.minTlsVersion: "1.2"
  ~ properties.httpsOnly: false => true
```

**Analysis:**
- Most additions are **security improvements** (TLS 1.2, HTTPS only, FTPS disabled)
- `localMySqlEnabled: false` and `netFrameworkVersion: v4.6` are default properties
- These are **acceptable changes** that improve security posture

**Resolution:**
- Added missing properties to `modules/function-app.bicep`:
  - `localMySqlEnabled: false`
  - `netFrameworkVersion: 'v4.6'`
  - Already had: `ftpsState: 'Disabled'`, `minTlsVersion: '1.2'`, `httpsOnly: true`

**Impact:** ✅ EXPECTED - Security improvements are being applied.

---

### 5. Key Vault Security Enhancements ✅ IMPROVEMENTS

**What-If Output:**
```bicep
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  + properties.enablePurgeProtection: true
  + properties.networkAcls:
      bypass: "AzureServices"
      defaultAction: "Allow"
```

**Analysis:**
- **Purge Protection**: Prevents permanent deletion of Key Vault and secrets (required for production)
- **Network ACLs**: Allows Azure services to access the vault while maintaining security

**Resolution:**
- No changes needed - these are already in the template and are **security best practices**

**Impact:** ✅ EXPECTED - Security improvements are being applied.

⚠️ **Warning:** Once `enablePurgeProtection` is enabled, it **cannot be disabled**. This is intentional to protect production secrets.

---

### 6. Static Web App Properties ℹ️ READ-ONLY REMOVALS

**What-If Output:**
```bicep
~ Microsoft.Web/staticSites/GlookoData
  - properties.deploymentAuthPolicy: "DeploymentToken"
  - properties.stableInboundIP: "20.101.2.157"
  - properties.trafficSplitting:
      environmentDistribution.default: 100
```

**Analysis:**
- These properties are **read-only** and managed by Azure
- `stableInboundIP` is assigned by Azure (cannot be set via template)
- `deploymentAuthPolicy` and `trafficSplitting` have default values
- Azure will maintain these values automatically

**Resolution:**
- No action needed - these are informational changes only

**Impact:** ✅ SAFE - Read-only properties will be maintained by Azure.

---

### 7. Tag Standardization ℹ️ GOVERNANCE

**What-If Output:**
```bicep
~ Microsoft.Storage/storageAccounts/glookodatawebappstorage
  - tags.Purpose: "UserSettings"
  + tags.ManagedBy: "Bicep"
  ~ tags.Application: "glookodatawebapp" => "GlookoDataWebApp"

~ Microsoft.ManagedIdentity/userAssignedIdentities/glookodatawebapp-identity
  ~ tags.Environment: "Production ManagedBy=GlookoDeploymentModule..." => "Production"
  + tags.Application: "GlookoDataWebApp"
  + tags.ManagedBy: "Bicep"
```

**Analysis:**
- Moving to standardized tagging scheme for better resource governance
- `ManagedBy: Bicep` indicates infrastructure is managed by IaC
- Removing old/inconsistent tags like embedded `ManagedBy=GlookoDeploymentModule` in Environment tag
- Removing `Purpose: UserSettings` which is redundant (storage has multiple purposes)

**Resolution:**
- Accept standardized tags as defined in parameter files
- All resources now have consistent tags:
  ```bicep
  tags = {
    Application: 'GlookoDataWebApp'
    Environment: 'Production'
    ManagedBy: 'Bicep'
  }
  ```

**Impact:** ✅ EXPECTED - Tag standardization for better governance.

---

### 8. RBAC Role Assignments ✅ NEW FEATURES

**What-If Output:**
```bicep
+ Microsoft.Storage/storageAccounts/.../roleAssignments/1af27705-371b-5d3e-a53c-3df3874492df
  properties.roleDefinitionId: "Storage Table Data Contributor"

+ Microsoft.Storage/storageAccounts/.../roleAssignments/595708b8-0e71-529e-94b7-dab11d6821f3
  properties.roleDefinitionId: "Storage Blob Data Contributor"
```

**Analysis:**
- These are **new role assignments** for the Managed Identity
- Enable passwordless authentication to Storage Account
- Required for the Function App to access Tables and Blobs using Managed Identity

**Resolution:**
- No changes needed - these are already in the template and are **best practices**

**Impact:** ✅ EXPECTED - Managed Identity RBAC is being implemented.

---

### 9. Key Vault Role Assignment Diagnostic ℹ️ INFORMATIONAL

**What-If Output:**
```
Diagnostics (1): 
[extensionResourceId(...)] (Unsupported) Changes to the resource...cannot be analyzed
```

**Analysis:**
- This is a **what-if limitation** for extension resources (role assignments)
- The role assignment is defined correctly in the template
- Azure cannot calculate the exact resource ID until deployment

**Resolution:**
- No action needed - this is a known limitation of what-if analysis

**Impact:** ✅ SAFE - Role assignment will deploy correctly.

---

## Final What-If Results (Expected)

After applying the fixes, the what-if output should show:

### Resources to Create (3)
- ✅ Storage Table Data Contributor role assignment (new, expected)
- ✅ Storage Blob Data Contributor role assignment (new, expected)
- ❌ ~~App Service Plan~~ (no longer created, using existing)

### Resources to Modify (6)
- ✅ Key Vault - Security improvements (purge protection, network ACLs)
- ✅ Managed Identity - Tag updates
- ✅ Storage Account - Tag updates
- ✅ Table Service - **CORS preserved** (no longer shows removal)
- ✅ Function App - Tag updates, **plan reference unchanged**, security settings
- ✅ Static Web App - Tag additions, build properties

### Resources with No Change (3)
- ✅ UserSettings table
- ✅ ProUsers table
- ✅ AIQueryLogs table

### Ignored Resources (3)
- ℹ️ App Insights component (managed elsewhere)
- ℹ️ Existing App Service Plan (not managed by this template)
- ℹ️ Smart Detector Alert Rules (managed elsewhere)

---

## Parameter Configuration Summary

### Current Production (`parameters.current.bicepparam`)

```bicep
// Preserve existing infrastructure
param useExistingAppServicePlan = true
param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'

// Preserve Table Storage CORS
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Maintain App Insights integration
param appInsightsResourceId = '/subscriptions/.../components/glookodatawebapp-func'
```

### Generic/New Deployments (`parameters.generic.bicepparam`)

```bicep
// Create new App Service Plan
param useExistingAppServicePlan = false
param existingAppServicePlanName = ''

// Enable CORS for web access
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Optional App Insights
param appInsightsResourceId = ''
```

---

## Verification Steps

1. **Validate Bicep Syntax:**
   ```bash
   az bicep build --file main.bicep
   ```

2. **Run What-If Again:**
   ```bash
   az deployment group what-if \
     --resource-group Glooko \
     --template-file main.bicep \
     --parameters parameters.current.bicepparam
   ```

3. **Check Key Changes:**
   - ✅ No Table Service CORS removal
   - ✅ No new App Service Plan creation
   - ✅ App Insights tag preserved
   - ✅ Security improvements applied
   - ✅ Tags standardized

4. **Deploy (After Verification):**
   ```bash
   az deployment group create \
     --resource-group Glooko \
     --template-file main.bicep \
     --parameters parameters.current.bicepparam \
     --confirm-with-what-if
   ```

---

## Recommendations

### Before Deployment

1. ✅ Review what-if output one more time
2. ✅ Verify no unexpected "Delete" operations
3. ✅ Confirm tag changes are acceptable
4. ✅ Backup Key Vault secrets (as a precaution)
5. ✅ Test in dev/staging environment first (if available)

### After Deployment

1. ✅ Verify frontend can still access Table Storage
2. ✅ Check Function App monitoring in App Insights
3. ✅ Test API endpoints
4. ✅ Verify Static Web App deployment
5. ✅ Review resource tags for consistency

---

## Questions Answered

### Q: Why are RBAC role assignments being created?
**A:** These are new and required for Managed Identity authentication to Storage. They enable passwordless access, which is more secure than connection strings.

### Q: Is it safe to enable purge protection on Key Vault?
**A:** Yes, this is a security best practice for production. It prevents accidental permanent deletion of secrets. Note: This setting **cannot be disabled** once enabled.

### Q: Why create a new App Service Plan vs. using existing?
**A:** The parameter `useExistingAppServicePlan` now controls this. For current production, set to `true` to use the existing plan. For new deployments, set to `false` to create a dedicated plan.

### Q: Will the Static Web App deployment be affected?
**A:** No, the property removals are read-only fields. Azure manages these automatically. The buildProperties additions improve the deployment configuration.

### Q: Are the tag changes breaking?
**A:** No, tags are metadata only. Changing tags does not affect resource functionality. The new tags provide better governance and tracking.

---

## Conclusion

The initial what-if output showed several changes, but most were either:
- ✅ **Expected** - Security improvements and RBAC setup
- ✅ **Acceptable** - Tag standardization and governance
- ⚠️ **Fixed** - CORS preservation, hosting plan reuse, App Insights link

With the parameter adjustments made, the infrastructure deployment should now be safe to proceed with minimal disruption to existing services.

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-29  
**Status:** Ready for Deployment  
**Related Documents:**
- EXPECTED_WHAT_IF.md - Expected what-if output after fixes
- WHAT_IF_DELTAS_EXPLAINED.md - Detailed explanation of each delta (roleAssignments, Key Vault, Function App, Static Web App changes)
