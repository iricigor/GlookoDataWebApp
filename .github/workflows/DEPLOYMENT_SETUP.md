# Production Deployment Workflow Setup Guide

This guide explains how to configure the Production Deployment workflow for automated deployment of both Azure Infrastructure (Bicep) and the React Frontend (Static Web App).

## Overview

The Production Deployment workflow (`deploy-production.yml`) provides:
- **Manual-only deployment** via workflow_dispatch (no automatic triggers)
- **Infrastructure deployment** (Bicep templates) with manual approval
- **Application deployment** (Static Web App + Function App) with automatic approval  
- **Controlled execution**: Choose to deploy infrastructure, application, or both via checkboxes

**Key Design Decision:** This workflow is intentionally **manual-only** to ensure controlled, deliberate deployments to production. It does NOT trigger automatically on push to main.

## Table of Contents

- [Differences from Infrastructure Check Workflow](#differences-from-infrastructure-check-workflow)
- [Prerequisites](#prerequisites)
- [Step 1: Create Azure AD Application (if not exists)](#step-1-create-azure-ad-application-if-not-exists)
  - [Option A: Reuse Existing App Registration](#option-a-reuse-existing-app-registration)
  - [Option B: Create New App Registration](#option-b-create-new-app-registration)
- [Step 2: Create Service Principal and Assign Permissions](#step-2-create-service-principal-and-assign-permissions)
- [Step 3: Configure OIDC Federated Credentials for Deployment](#step-3-configure-oidc-federated-credentials-for-deployment)
  - [Verify Federated Credentials](#verify-federated-credentials)
- [Step 4: Configure GitHub Secrets](#step-4-configure-github-secrets)
- [Step 5: Configure GitHub Environments](#step-5-configure-github-environments)
  - [Environment 1: Infra-Prod (Manual Approval Required)](#environment-1-infra-prod-manual-approval-required)
  - [Environment 2: SWA-Prod (Auto-Approved/Tracking Only)](#environment-2-swa-prod-auto-approvedtracking-only)
- [Step 6: Test the Workflow](#step-6-test-the-workflow)
  - [Manual Deployment Test](#manual-deployment-test)
  - [Test Scenarios](#test-scenarios)
- [How the Workflow Works](#how-the-workflow-works)
  - [Manual Deployment Control](#manual-deployment-control)
  - [Change Detection Since Last Deployment](#change-detection-since-last-deployment)
  - [Execution Flow](#execution-flow)
  - [Job Dependencies](#job-dependencies)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Workflow Behavior Examples](#workflow-behavior-examples)
- [Next Steps](#next-steps)
- [Resources](#resources)
- [Support](#support)

## Differences from Infrastructure Check Workflow

| Aspect | Infrastructure Check | Production Deployment |
|--------|---------------------|----------------------|
| **Purpose** | Validate changes (read-only) | Deploy changes (write access) |
| **Authentication** | OIDC with read permissions | OIDC with write permissions |
| **Approval** | None (automatic) | Infrastructure: Manual, App: Automatic |
| **Secrets** | `AZURE_DEPLOYER_CLIENT_ID` | Same secrets, different federated credentials |
| **Triggers** | Pull requests | Manual only (workflow_dispatch) |
| **Environments** | None | `Infra-Prod` (manual), `SWA-Prod` (tracking) |

## Prerequisites

- Azure subscription with appropriate permissions
- Contributor or Owner role on the target resource group (`Glooko`)
- Permission to create App Registrations in Azure AD
- Admin access to GitHub repository settings
- Existing infrastructure deployed or ready to deploy

## Step 1: Create Azure AD Application (if not exists)

If you already created an App Registration for the Infrastructure Check workflow, you can **reuse the same application** but add additional federated credentials for deployment.

### Option A: Reuse Existing App Registration

```bash
# Get existing app ID
APP_NAME="GlookoDataWebApp-GitHub-Actions"
APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo "Reusing existing App Registration:"
echo "Application (Client) ID: $APP_ID"
echo "Tenant ID: $TENANT_ID"
echo "Subscription ID: $SUBSCRIPTION_ID"
```

### Option B: Create New App Registration

```bash
# Set variables
APP_NAME="GlookoDataWebApp-GitHub-Actions-Deploy"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
RESOURCE_GROUP="Glooko"

# Create the app registration
az ad app create --display-name "$APP_NAME"

# Get the Application (Client) ID
APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)
echo "Application (Client) ID: $APP_ID"

# Get the Tenant ID
TENANT_ID=$(az account show --query tenantId -o tsv)
echo "Tenant ID: $TENANT_ID"
```

## Step 2: Create Service Principal and Assign Permissions

The service principal needs **Contributor** role to deploy resources:

```bash
# Create service principal (skip if already exists)
az ad sp create --id $APP_ID

# Get the Service Principal Object ID
SP_OBJECT_ID=$(az ad sp list --display-name "$APP_NAME" --query "[0].id" -o tsv)
echo "Service Principal Object ID: $SP_OBJECT_ID"

# Assign Contributor role to the resource group
az role assignment create \
  --role "Contributor" \
  --assignee $APP_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"

echo "✅ Service Principal created and assigned Contributor role"
```

**Note:** Contributor role is required for deploying infrastructure. The Infrastructure Check workflow only needs read permissions for what-if analysis, but this deployment workflow needs write permissions.

## Step 3: Configure OIDC Federated Credentials for Deployment

Add federated credentials that allow GitHub Actions to deploy from the `main` branch:

```bash
# Get your GitHub repository details
GITHUB_ORG="iricigor"              # Your GitHub username or organization
GITHUB_REPO="GlookoDataWebApp"     # Your repository name

# Create federated credential for main branch (push events)
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "GitHubActionsDeployMain",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG/$GITHUB_REPO"':ref:refs/heads/main",
    "description": "GitHub Actions - Production deployment from main branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for workflow_dispatch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "GitHubActionsDeployDispatch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG/$GITHUB_REPO"':ref:refs/heads/main",
    "description": "GitHub Actions - Manual deployment workflow",
    "audiences": ["api://AzureADTokenExchange"]
  }'

echo "✅ OIDC federated credentials configured for deployment"
```

**Important:** These federated credentials are different from the PR credentials used in the Infrastructure Check workflow. They allow authentication when running workflows from the `main` branch, not from pull requests.

### Verify Federated Credentials

```bash
# List all federated credentials for the app
az ad app federated-credential list --id $APP_ID --output table

# You should see credentials for:
# - Pull requests (Infrastructure Check workflow)
# - Main branch pushes (Deployment workflow)
# - Workflow dispatch (Manual deployments)
```

## Step 4: Configure GitHub Secrets

The deployment workflow uses the **same secrets** as the Infrastructure Check workflow. If you've already set them up, you can skip this step.

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of the following:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `AZURE_DEPLOYER_CLIENT_ID` | Application (Client) ID | `echo $APP_ID` or from Azure Portal |
| `AZURE_TENANT_ID` | Azure AD Tenant ID | `echo $TENANT_ID` or from Azure Portal |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | `echo $SUBSCRIPTION_ID` or `az account show --query id -o tsv` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WONDERFUL_STONE_071384103` | SWA deployment token | Azure Portal → Static Web App → Manage deployment token |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Function App publish profile | Azure Portal → Function App → Get publish profile |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |

**Note:** The first three secrets (`AZURE_DEPLOYER_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) are the same ones used by the Infrastructure Check workflow.

## Step 5: Configure GitHub Environments

The deployment workflow uses two environments for approval control:

### Environment 1: Infra-Prod (Manual Approval Required)

This environment protects infrastructure deployments and requires manual approval before deploying.

1. Go to **Settings** → **Environments** → **New environment**
2. Name: `Infra-Prod`
3. Configure protection rules:
   - ✅ **Required reviewers**: Add yourself or team members who should approve infrastructure changes
   - ✅ **Wait timer**: Optional (e.g., 0 minutes for immediate approval after review)
   - ✅ **Deployment branches**: Limit to `main` branch only
4. Click **Save protection rules**

### Environment 2: SWA-Prod (Auto-Approved/Tracking Only)

This environment tracks application deployments but doesn't require approval.

1. Go to **Settings** → **Environments** → **New environment**
2. Name: `SWA-Prod`
3. Configure protection rules (optional):
   - ✅ **Deployment branches**: Limit to `main` branch only
   - ❌ **Required reviewers**: Leave empty for automatic approval
4. Click **Save protection rules**

## Step 6: Test the Workflow

### Manual Deployment Test

1. Go to **Actions** tab in your GitHub repository
2. Select **🚀 Deploy to Production** workflow
3. Click **Run workflow**
4. Choose deployment options:
   - **Deploy infrastructure**: ✅ Check to deploy infrastructure (requires manual approval)
   - **Deploy application**: ✅ Check to deploy application
5. Click **Run workflow**
6. If infrastructure deployment is selected:
   - The workflow will wait for manual approval on the `Infra-Prod` environment
   - Go to the workflow run and click **Review deployments**
   - Select `Infra-Prod` and click **Approve and deploy**
7. If application deployment is selected:
   - It will wait for infrastructure to complete (if also selected)
   - Then proceed automatically via `SWA-Prod` environment

### Test Scenarios

**Scenario 1: Deploy Application Only**
- ❌ Deploy infrastructure: Unchecked
- ✅ Deploy application: Checked
- Result: Only application deploys, infrastructure is skipped

**Scenario 2: Deploy Infrastructure Only**
- ✅ Deploy infrastructure: Checked
- ❌ Deploy application: Unchecked
- Result: Only infrastructure deploys (requires approval), application is skipped

**Scenario 3: Deploy Both**
- ✅ Deploy infrastructure: Checked
- ✅ Deploy application: Checked
- Result: Infrastructure deploys first (requires approval), then application deploys

## How the Workflow Works

### Manual Deployment Control

This workflow is **manual-only** and uses workflow_dispatch inputs:

**Deployment Options:**
- **Deploy infrastructure** (checkbox): 
  - Default: `false` (unchecked)
  - Triggers infrastructure deployment with manual approval required
  - Deploys Bicep templates to Azure
  
- **Deploy application** (checkbox):
  - Default: `true` (checked)
  - Triggers application deployment (automatic after infrastructure if both selected)
  - Deploys Static Web App and Function App

**Why Manual-Only?**
- Ensures controlled, deliberate production deployments
- Prevents accidental deployments from code merges
- Allows deploying infrastructure and application independently
- Provides flexibility in deployment timing

### Change Detection Since Last Deployment

Even though the workflow is manual, it intelligently **analyzes what changed since the last successful deployment** to provide helpful context:

**How it works:**
1. Finds the last successful infrastructure deployment using git tags (format: `deploy-infra-YYYYMMDD-HHMMSS`)
2. Compares current commit to the last deployment commit
3. Detects which files changed: infrastructure (`infra/**`, `scripts/**`) or application (`src/**`, `api/**`, etc.)
4. Shows warnings if you're skipping a deployment when files have changed

**Benefits:**
- ✅ See what changed since last deployment before deciding what to deploy
- ✅ Get warnings if infrastructure files changed but you're only deploying the app
- ✅ Track deployment history via git tags
- ✅ Make informed deployment decisions

**Example:**
```
Last deployment commit: abc123 (3 days ago)
Current commit: def456

Changes since last deployment:
- Infrastructure files changed: true
  - infra/main.bicep
  - scripts/deployment-cli/deploy.sh
- Application files changed: true
  - src/App.tsx
  - api/src/functions/user.ts

⚠️ Warning: Infrastructure files have changed since last deployment, 
but infrastructure deployment is not selected.
```

### Execution Flow

```mermaid
graph TD
    A[Manual Trigger<br/>workflow_dispatch] --> B[check-changes]
    B --> C{Deploy Infra<br/>Selected?}
    C -->|Yes| D[deploy-infra]
    C -->|No| E[Skip deploy-infra]
    D --> F[Manual Approval Required<br/>Infra-Prod]
    F --> G[Deploy Infrastructure]
    B --> H{Deploy App<br/>Selected?}
    H -->|Yes| I{Deploy Infra<br/>Selected?}
    I -->|Yes| J[Wait for deploy-infra]
    I -->|No| K[Deploy Immediately]
    J --> L[deploy-app]
    K --> L
    H -->|No| M[Skip deploy-app]
```

### Job Dependencies

- `deploy-infra` depends on `check-changes`
- `deploy-app` depends on both `check-changes` and `deploy-infra`
- `deploy-app` uses `always()` to run even if `deploy-infra` is skipped
- `deploy-app` only runs if:
  - Application deployment is selected AND
  - (Infrastructure deployment is NOT selected OR infrastructure deployed successfully)

## Troubleshooting

### Error: "No subscription found"

**Cause:** The service principal doesn't have the Contributor role.

**Solution:** Assign the Contributor role:

```bash
az role assignment create \
  --role "Contributor" \
  --assignee $APP_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
```

### Error: "AADSTS700016: Application not found"

**Cause:** The federated credential is not configured correctly.

**Solution:** Verify the credential:

```bash
az ad app federated-credential list --id $APP_ID
```

Ensure the `subject` field matches: `repo:OWNER/REPO:ref:refs/heads/main`

### Infrastructure Job Stuck Waiting for Approval

**Cause:** The `Infra-Prod` environment requires manual approval.

**Solution:** This is expected behavior. To approve:

1. Go to **Actions** → Select the workflow run
2. Click **Review deployments**
3. Select `Infra-Prod`
4. Click **Approve and deploy**

### Application Job Skipped Even Though Checkbox Checked

**Cause:** The `deploy-infra` job failed, so `deploy-app` was skipped.

**Solution:** Fix the infrastructure deployment issue first, then retry the workflow.

### Both Jobs Skipped

**Cause:** Both checkboxes were unchecked in the workflow_dispatch inputs.

**Solution:** This is expected behavior. Select at least one deployment option when running the workflow.

## Security Best Practices

✅ **Do's:**
- Use OIDC authentication (no long-lived credentials)
- Require manual approval for infrastructure changes
- Grant minimum required permissions (Contributor on resource group only)
- Regularly review and rotate credentials
- Monitor workflow runs for suspicious activity
- Use separate environments for infra and app deployments
- Use manual-only workflows for production deployments

❌ **Don'ts:**
- Never store Azure credentials (passwords, keys) as GitHub secrets
- Don't grant Owner role unless absolutely necessary
- Don't disable environment protection for infrastructure deployments
- Don't use service principal authentication keys (use OIDC instead)
- Don't enable automatic deployments to production

## Workflow Behavior Examples

### Example 1: Deploy Infrastructure Only

**Manual Input:**
- ✅ Deploy infrastructure: Checked
- ❌ Deploy application: Unchecked

**Workflow Behavior:**
1. ✅ `check-changes`: infra=true, app=false
2. ✅ `deploy-infra`: Waits for manual approval, then deploys infrastructure
3. ⏭️ `deploy-app`: Skipped (not selected)

### Example 2: Deploy Application Only

**Manual Input:**
- ❌ Deploy infrastructure: Unchecked
- ✅ Deploy application: Checked

**Workflow Behavior:**
1. ✅ `check-changes`: infra=false, app=true
2. ⏭️ `deploy-infra`: Skipped (not selected)
3. ✅ `deploy-app`: Deploys immediately (no waiting for deploy-infra)

### Example 3: Deploy Both Infrastructure and Application

**Manual Input:**
- ✅ Deploy infrastructure: Checked
- ✅ Deploy application: Checked

**Workflow Behavior:**
1. ✅ `check-changes`: infra=true, app=true
2. ✅ `deploy-infra`: Waits for manual approval, then deploys infrastructure
3. ✅ `deploy-app`: Waits for deploy-infra to complete, then deploys application

### Example 4: Deploy Nothing (Both Unchecked)

**Files Changed:** `README.md`

**Workflow Behavior:**
1. ✅ `check-changes`: infra=false, app=false
2. ⏭️ `deploy-infra`: Skipped
3. ⏭️ `deploy-app`: Skipped

## Next Steps

After setting up this workflow:

1. ✅ Test the workflow with a manual run (workflow_dispatch)
2. ✅ Verify environment protections work correctly
3. ✅ Test conditional logic by making different types of changes
4. ✅ Document your team's approval process for infrastructure changes
5. 🚀 Set up notifications for deployment approvals

## Resources

- [Azure OIDC with GitHub Actions](https://learn.microsoft.com/azure/developer/github/connect-from-azure)
- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)
- [Infrastructure Check Setup](./INFRA_CHECK_SETUP.md) - For read-only what-if analysis
- [Infrastructure Documentation](../../infra/README.md)

## Support

For issues or questions:

- Open an issue on [GitHub](https://github.com/iricigor/GlookoDataWebApp/issues)
- Review the [Infrastructure Check Setup](./INFRA_CHECK_SETUP.md) guide
- Check the main [Deployment Guide](../../docs/DEPLOYMENT.md)
