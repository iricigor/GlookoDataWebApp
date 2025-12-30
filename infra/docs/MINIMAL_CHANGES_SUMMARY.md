# Minimal Changes Summary

This document explains the approach taken to minimize Bicep template changes and defer best practice implementations to future PRs.

## Goal

Minimize infrastructure changes to only what's absolutely necessary:
- Keep existing CORS configuration (required for frontend-backend communication)
- Remove all best practice additions to be implemented in separate PRs
- Avoid deployment conflicts with existing Azure resources

## Changes Removed

### 1. RBAC Role Assignments (main.bicep)

**Removed:**
- Storage Table Data Contributor role assignment
- Storage Blob Data Contributor role assignment

**Reason:**
- These role assignments **already exist** in Azure with different IDs
- Existing Table role: `4949700a-2127-4912-bc2b-b46fe97fec30`
- Existing Blob role: `c351193c-5102-4e17-8d3a-8209023f503a`
- Template would generate different IDs using `guid()` function
- Deployment would fail with "role assignment already exists" error

**Status:**
- Commented out in `infra/main.bicep` lines 140-145
- Role assignments are managed separately outside of Bicep template

---

### 2. Key Vault Security Enhancements (modules/key-vault.bicep)

**Removed:**
- `enablePurgeProtection: true` (line 24)
- `networkAcls` configuration (lines 30-33)

**Reason:**
- Best practice security improvements, not critical for current deployment
- Can be implemented in separate security hardening PR

**Impact:**
- Key Vault will remain without purge protection (can be added later)
- Network ACLs will use default (allow all, can be restricted later)

**Status:**
- Commented out with note: "best practice, implement in separate PR"

---

### 3. Function App Best Practices (modules/function-app.bicep)

**Removed:**
- `httpsOnly: true` (line 80) - Currently `false` in production
- `ftpsState: 'Disabled'` (line 177)
- `minTlsVersion: '1.2'` (line 178)
- `localMySqlEnabled: false` (line 179)
- `netFrameworkVersion: 'v4.6'` (line 180)

**Kept:**
- CORS configuration (lines 170-176) - **Required for frontend to call backend APIs**

**Reason:**
- Security best practices that are not critical for immediate deployment
- Can be implemented in dedicated security hardening PR
- CORS is kept because it's required for the application to function

**Impact:**
- Function App will remain with current security posture
- HTTPS redirection, FTPS disabling, and TLS 1.2 minimum to be added later

**Status:**
- Removed properties commented out with note: "best practice settings removed - implement in separate PR"
- CORS configuration retained

---

### 4. Static Web App Build Properties (modules/static-web-app.bicep)

**Removed:**
- `buildProperties` configuration (lines 39-43)
  - `appLocation: '/'`
  - `apiLocation: 'api'`
  - `outputLocation: 'dist'`

**Reason:**
- Documentation improvement, not a functional requirement
- Build properties are already configured in GitHub Actions workflows
- Can be added for IaC completeness in separate PR

**Impact:**
- Static Web App deployment uses GitHub Actions workflow configuration
- No functional change

**Status:**
- Commented out with note: "best practice documentation, implement in separate PR"

---

## What Remains in the Template

### 1. Core Infrastructure
- ✅ Managed Identity
- ✅ Storage Account with Tables and CORS
- ✅ Key Vault (basic configuration)
- ✅ Function App (basic configuration + CORS)
- ✅ Static Web App (basic configuration)

### 2. Required RBAC
- ✅ Key Vault Secrets User role for Managed Identity (in key-vault.bicep)

### 3. Required Configuration
- ✅ Function App CORS (required for frontend-backend communication)
- ✅ App Insights integration (existing)
- ✅ Existing App Service Plan usage (avoid creating new plan)

---

## Expected What-If Output After Removals

### Resources to Create
- **0** (was 2 role assignments, now removed)

### Resources to Modify
- **~2-3** (mostly tag changes)
  - Managed Identity - tag standardization
  - Storage Account - tag standardization
  - Function App - CORS addition (required), tag changes
  - Static Web App - tag additions

### Resources with No Change
- **3+** (tables and other resources)

### Key Vault Role Assignment
- **1 diagnostic** (unsupported - extension resource, will deploy correctly)

---

## Future PRs (Best Practices)

### Security Hardening PR
Should include:
1. **Key Vault:**
   - Enable purge protection
   - Configure network ACLs

2. **Function App:**
   - Enable HTTPS only
   - Disable FTPS
   - Set minimum TLS version to 1.2
   - Explicitly disable local MySQL

3. **Storage Account:**
   - Review and apply additional security settings

### RBAC Management PR
Should include:
1. **Decision:** Choose one of:
   - Option A: Delete existing role assignments, let Bicep manage them
   - Option B: Keep manual management, remove from template permanently
   - Option C: Update template to use existing assignment IDs (hardcode)

2. **Recommendation:** Option A for full IaC management

### Documentation PR
Should include:
1. **Static Web App:**
   - Add build properties to template for IaC completeness
   - Document alignment with GitHub Actions workflows

---

## Verification Commands

### Validate Bicep Syntax
```bash
cd infra
az bicep build --file main.bicep
az bicep build-params --file parameters.current.bicepparam
```

### Run What-If
```bash
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

### Expected Changes
- Tag updates (acceptable)
- CORS addition on Function App (required)
- NO role assignment creations
- NO Key Vault security additions
- NO Function App security additions
- NO Static Web App build properties

---

## Rollback Plan

If the minimal changes approach causes issues:

1. **Restore best practices:** Uncomment all removed sections
2. **Address role assignments:** Delete existing Azure role assignments before deployment
3. **Deploy with all changes:** Full security hardening in one deployment

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-29  
**Status:** Minimal Changes Implemented  
**Related Documents:**
- WHAT_IF_DELTAS_EXPLAINED.md - Detailed explanation of each delta
- WHAT_IF_ANALYSIS.md - Initial what-if analysis
- EXPECTED_WHAT_IF.md - Expected output reference
