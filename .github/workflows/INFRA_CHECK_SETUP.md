# Infrastructure Check Workflow Setup Guide

This guide explains how to configure the Infrastructure Check workflow (The Watchman) for your repository.

## Overview

The Infrastructure Check workflow automatically validates Bicep infrastructure changes using Azure's what-if analysis on every Pull Request. It uses **OIDC (OpenID Connect)** for secure, keyless authentication to Azure without storing any credentials.

## Prerequisites

- Azure subscription with appropriate permissions
- Contributor or Owner role on the target resource group (`Glooko`)
- Permission to create App Registrations in Azure AD
- Admin access to GitHub repository settings

## Step 1: Create Azure AD Application

Create an Azure AD application for GitHub Actions authentication:

```bash
# Set variables
APP_NAME="GlookoDataWebApp-GitHub-Actions"
SUBSCRIPTION_ID="your-subscription-id"  # Get with: az account show --query id -o tsv
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

**Example values:**
```bash
# Example - your values will be different
SUBSCRIPTION_ID="12345678-1234-1234-1234-123456789abc"  # Azure Subscription ID
APP_ID="87654321-4321-4321-4321-cba987654321"          # Will be generated
TENANT_ID="abcdefab-abcd-abcd-abcd-abcdefabcdef"       # Your Azure AD Tenant ID
```

## Step 2: Create Service Principal

Create a service principal and assign it permissions:

```bash
# Create service principal
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

## Step 3: Configure OIDC Federated Credentials

Configure the app to trust GitHub Actions using OIDC:

```bash
# Get your GitHub repository details
GITHUB_ORG="your-org"         # Replace with your GitHub organization or username
GITHUB_REPO="your-repo"       # Replace with your repository name

# Create federated credential for Pull Requests
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "GitHubActionsPR",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG/$GITHUB_REPO"':pull_request",
    "description": "GitHub Actions - Pull Request workflow",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for workflow_dispatch (manual runs)
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "GitHubActionsWorkflowDispatch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG/$GITHUB_REPO"':ref:refs/heads/main",
    "description": "GitHub Actions - Manual workflow runs",
    "audiences": ["api://AzureADTokenExchange"]
  }'

echo "✅ OIDC federated credentials configured"
```

**How to find your repository details:**
- **GITHUB_ORG**: Your GitHub username or organization name (from the URL: `github.com/USERNAME/repo`)
- **GITHUB_REPO**: Your repository name (from the URL: `github.com/user/REPOSITORY`)

**Example for this repository:**
```bash
# For iricigor/GlookoDataWebApp
GITHUB_ORG="iricigor"
GITHUB_REPO="GlookoDataWebApp"
```

## Step 4: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of the following:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `AZURE_DEPLOYER_CLIENT_ID` | Application (Client) ID | `echo $APP_ID` or from Azure Portal |
| `AZURE_TENANT_ID` | Azure AD Tenant ID | `echo $TENANT_ID` or from Azure Portal |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | `echo $SUBSCRIPTION_ID` or `az account show --query id -o tsv` |

### Finding Values in Azure Portal

Alternatively, you can find these values in the Azure Portal:

- **AZURE_DEPLOYER_CLIENT_ID**: 
  - Azure Portal → Azure Active Directory → App registrations → Your App → Overview → Application (client) ID

- **AZURE_TENANT_ID**: 
  - Azure Portal → Azure Active Directory → Overview → Tenant ID

- **AZURE_SUBSCRIPTION_ID**: 
  - Azure Portal → Subscriptions → Your Subscription → Subscription ID

## Step 5: Test the Workflow

### Option 1: Manual Test (workflow_dispatch)

1. Go to **Actions** tab in your GitHub repository
2. Select **Infrastructure Check** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### Option 2: Create a Test PR

1. Make a small change to any Bicep file in the `infra/` directory
2. Create a pull request
3. The workflow should automatically trigger
4. Check the PR comments for the what-if analysis results

## Troubleshooting

### Error: "AADSTS700016: Application not found"

**Solution:** Ensure the federated credential is created correctly with the exact repository name:

```bash
# Verify the credential
az ad app federated-credential list --id $APP_ID
```

### Error: "No subscription found"

**Solution:** Ensure the service principal has the Contributor role:

```bash
# List role assignments
az role assignment list --assignee $APP_ID --output table
```

### Error: "The client does not have authorization to perform action"

**Solution:** The service principal needs Contributor role on the resource group:

```bash
# Add Contributor role
az role assignment create \
  --role "Contributor" \
  --assignee $APP_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
```

### Workflow doesn't trigger on PR

**Solution:** Check the file paths in your PR. The workflow only triggers when files in `infra/` are modified.

## Security Best Practices

✅ **Do's:**
- Use OIDC authentication (no long-lived credentials)
- Grant minimum required permissions (Contributor on resource group only)
- Regularly review and rotate credentials
- Monitor workflow runs for suspicious activity

❌ **Don'ts:**
- Never store Azure credentials (passwords, keys) as GitHub secrets
- Don't grant Owner role unless absolutely necessary
- Don't use service principal authentication keys (use OIDC instead)

## What the Workflow Does

1. **Triggers**: Automatically runs when PR modifies files in `infra/`
2. **Validates**: Checks Bicep syntax and parameter files
3. **Analyzes**: Runs `az deployment group what-if` to preview changes
4. **Reports**: Posts results as a PR comment
5. **Read-Only**: Never deploys or modifies Azure resources

## Next Steps

After setting up this workflow:

1. ✅ Test the workflow with a test PR
2. ✅ Review the what-if output format
3. ✅ Familiarize yourself with expected changes (see [EXPECTED_WHAT_IF.md](../../infra/EXPECTED_WHAT_IF.md))
4. 🚀 (Future) Set up deployment workflow with write permissions

## Resources

- [Azure OIDC with GitHub Actions](https://learn.microsoft.com/azure/developer/github/connect-from-azure)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)
- [Bicep What-If Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deploy-what-if)
- [Infrastructure Documentation](../../infra/README.md)
