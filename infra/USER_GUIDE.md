# What-If Analysis Resolution - User Guide

## Quick Start

The infrastructure templates have been updated to address all issues found in the first what-if run. Here's how to verify and deploy:

### 1. Quick Validation (30 seconds)

```bash
cd infra
./validate.sh
```

**Expected Output:**
```
✓ main.bicep is valid
✓ parameters.current.bicepparam is valid
✓ parameters.generic.bicepparam is valid
✓ Table CORS is enabled
✓ Using existing App Service Plan
✓ App Insights integration configured
```

### 2. Run What-If Analysis (2-3 minutes)

```bash
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

### 3. Review Output

Compare the what-if output with the **Expected Changes** section below.

**✅ Good Signs:**
- 2 new RBAC role assignments created
- CORS rules preserved (NOT removed)
- No new App Service Plan created
- App Insights tag preserved
- Security improvements (purge protection, HTTPS, etc.)

**🚨 Red Flags (Should NOT appear):**
- CORS rules being removed: `- properties.cors.corsRules`
- New plan being created: `+ Microsoft.Web/serverfarms/glookodatawebapp-func-plan`
- Any resource deletions: `- Microsoft.Storage/...` or `- Microsoft.KeyVault/...`

### 4. Deploy (After What-If Verification)

```bash
az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam \
  --confirm-with-what-if
```

---

## What Was Fixed

### Issue 1: Table Storage CORS Removal ❌ → ✅

**Problem:** The what-if showed CORS rules being removed from Table Service.

**Impact:** Frontend would break - cannot access Table Storage from browser.

**Fix:**
- Added `enableTableCors` parameter (default: `true`)
- Added `tableCorsAllowedOrigins` parameter (default: `['*']`)
- Updated `storage.bicep` to conditionally include CORS
- Configured `parameters.current.bicepparam` to preserve existing CORS

**Result:** CORS rules are now preserved, frontend will continue working.

---

### Issue 2: New App Service Plan Creation ❌ → ✅

**Problem:** Template was creating a new plan instead of using the existing `WestEuropeLinuxDynamicPlan`.

**Impact:** Function App would move to new plan, possible cost implications.

**Fix:**
- Added `useExistingAppServicePlan` parameter (default: `false`)
- Added `existingAppServicePlanName` parameter
- Updated `function-app.bicep` to support both scenarios
- Configured `parameters.current.bicepparam` to use existing plan

**Result:** Function App stays on existing plan, no unnecessary migration.

---

### Issue 3: App Insights Tag Removal ❌ → ✅

**Problem:** The `hidden-link` tag connecting Function App to App Insights was being removed.

**Impact:** Monitoring correlation would be lost.

**Fix:**
- Added `appInsightsResourceId` parameter (optional)
- Updated `function-app.bicep` to add tag when resource ID provided
- Configured `parameters.current.bicepparam` with App Insights resource ID

**Result:** App Insights integration preserved, monitoring intact.

---

### Issue 4: Missing Configuration Properties ⚠️ → ✅

**Problem:** Function App was missing some configuration properties.

**Impact:** What-if showed additions that might be unexpected.

**Fix:**
- Added `localMySqlEnabled: false`
- Added `netFrameworkVersion: 'v4.6'`
- Already had security properties (ftpsState, minTlsVersion, httpsOnly)

**Result:** All properties explicitly defined, no surprises in what-if.

---

## Expected What-If Output

After applying the fixes, the what-if should show:

### Resources to Create (2) ✅

```
+ Microsoft.Storage/storageAccounts/.../roleAssignments/1af27705-...
  Role: Storage Table Data Contributor

+ Microsoft.Storage/storageAccounts/.../roleAssignments/595708b8-...
  Role: Storage Blob Data Contributor
```

**Why:** New RBAC role assignments for Managed Identity (passwordless auth).

### Resources to Modify (5-6) ✅

**1. Key Vault**
- ✅ Adding `enablePurgeProtection: true` (security improvement)
- ✅ Adding `networkAcls` (security improvement)
- ✅ Tag change: `ManagedBy: "Bicep"`

**2. Managed Identity**
- ✅ Tag standardization

**3. Storage Account**
- ✅ Tag standardization
- ⚠️ Removing `tags.Purpose: "UserSettings"` (acceptable - redundant)

**4. Table Service**
- ✅ CORS preserved (should show as "no change" or "ignore")
- 🚨 If CORS removal still appears, **STOP and investigate**

**5. Function App**
- ✅ Security settings added (HTTPS, TLS 1.2, FTPS disabled)
- ✅ App Insights tag preserved
- ✅ Hosting plan unchanged (uses existing)
- ✅ Tag change: `ManagedBy: "Bicep"`

**6. Static Web App**
- ✅ Tags added
- ✅ Build properties added
- ℹ️ Read-only properties removed (normal)

### Resources with No Change (3) ✅

- UserSettings table
- ProUsers table
- AIQueryLogs table

---

## Troubleshooting

### ❌ CORS Still Being Removed

**Check:**
```bash
grep "enableTableCors" infra/parameters.current.bicepparam
# Should show: param enableTableCors = true

grep "tableCorsAllowedOrigins" infra/parameters.current.bicepparam
# Should show: param tableCorsAllowedOrigins = ['*']
```

**Fix:** Ensure parameters are set correctly in `parameters.current.bicepparam`.

### ❌ New App Service Plan Being Created

**Check:**
```bash
grep "useExistingAppServicePlan" infra/parameters.current.bicepparam
# Should show: param useExistingAppServicePlan = true

grep "existingAppServicePlanName" infra/parameters.current.bicepparam
# Should show: param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'
```

**Fix:** Ensure parameters are set correctly in `parameters.current.bicepparam`.

### ❌ App Insights Tag Not Present

**Check:**
```bash
grep "appInsightsResourceId" infra/parameters.current.bicepparam
# Should show: param appInsightsResourceId = '/subscriptions/...'
```

**Fix:** Ensure App Insights resource ID is set correctly.

---

## Documentation Reference

📄 **FIX_SUMMARY.md** - Complete overview of all changes  
📄 **WHAT_IF_ANALYSIS.md** - Detailed analysis of each change  
📄 **EXPECTED_WHAT_IF.md** - Full expected output and red flags  
📄 **README.md** - Complete deployment guide  

---

## Parameters Explained

### Current Production Parameters

Located in: `infra/parameters.current.bicepparam`

```bicep
// Preserve existing CORS (prevents frontend breakage)
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Use existing hosting plan (prevents unnecessary migration)
param useExistingAppServicePlan = true
param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'

// Maintain App Insights integration (preserves monitoring)
param appInsightsResourceId = '/subscriptions/.../components/glookodatawebapp-func'
```

### Generic Deployment Parameters

Located in: `infra/parameters.generic.bicepparam`

```bicep
// Enable CORS for new deployments
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Create new hosting plan for new deployments
param useExistingAppServicePlan = false
param existingAppServicePlanName = ''

// App Insights optional for new deployments
param appInsightsResourceId = ''
```

---

## Deployment Workflow

### Development/Testing

1. **Validate:** `./validate.sh`
2. **What-If:** `az deployment group what-if ...`
3. **Review:** Compare with expected output
4. **Test Deploy:** Use `--what-if` flag first
5. **Actual Deploy:** Remove `--what-if` flag

### Production

1. **Validate:** `./validate.sh`
2. **What-If:** `az deployment group what-if ...`
3. **Review with Team:** Share what-if output
4. **Confirm:** All changes expected and acceptable
5. **Deploy with Confirmation:** Use `--confirm-with-what-if` flag

---

## Support

### If What-If Shows Unexpected Changes

1. **Do NOT deploy**
2. Review the what-if output carefully
3. Check `EXPECTED_WHAT_IF.md` for red flags
4. Compare parameters with expected values
5. If needed, open a GitHub issue with:
   - Full what-if output
   - Parameter file contents
   - Description of unexpected changes

### If Deployment Fails

1. Review error message
2. Check Azure Portal for resource state
3. Verify all prerequisites (resource group exists, permissions, etc.)
4. Check `README.md` troubleshooting section
5. Open GitHub issue with error details

---

## FAQ

### Q: Why so many changes for a "first deployment"?

**A:** This isn't a first deployment - the infrastructure already exists. The Bicep templates are being aligned with the existing resources to enable Infrastructure as Code management. Most changes are tag updates and security improvements.

### Q: Is it safe to enable purge protection?

**A:** Yes, required for production. Prevents accidental deletion of Key Vault and secrets. **Note:** Cannot be disabled once enabled.

### Q: Will this cause downtime?

**A:** No, if what-if matches expectations. All changes are tag updates, RBAC additions, and configuration improvements. No resources are being recreated.

### Q: What if I see resource deletions in what-if?

**A:** **STOP IMMEDIATELY.** Resource deletions should not appear. This would indicate a misconfiguration. Review parameters and resource names.

### Q: Can I deploy to a different environment?

**A:** Yes, create a new parameter file (e.g., `parameters.dev.bicepparam`) with appropriate values. Use `parameters.generic.bicepparam` as a template.

---

## Success Criteria

✅ **Validation script passes**  
✅ **What-if shows expected changes only**  
✅ **No red flags in what-if output**  
✅ **CORS rules preserved**  
✅ **Existing hosting plan used**  
✅ **App Insights tag present**  
✅ **Security improvements applied**  
✅ **No resource deletions**  

If all criteria are met, **proceed with deployment**.

---

## Next Steps

1. ✅ Run `./validate.sh` to verify templates
2. ✅ Run what-if analysis
3. ✅ Review output against `EXPECTED_WHAT_IF.md`
4. ✅ If everything looks good, deploy
5. ✅ After deployment:
   - Test frontend access to Table Storage
   - Verify Function App monitoring in App Insights
   - Check all API endpoints work
   - Review tags in Azure Portal

---

**Version:** 1.0  
**Date:** 2024-12-29  
**Status:** Ready for Testing and Deployment  
**Author:** GitHub Copilot

**All fixes have been implemented and validated. The infrastructure is ready for what-if testing and deployment.** 🚀
