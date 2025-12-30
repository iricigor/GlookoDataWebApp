# Infrastructure Check Workflow - Quick Reference

## 🎯 What It Does

Automatically validates Bicep infrastructure changes on every Pull Request using Azure's what-if analysis.

## 🔧 Files Created

| File | Purpose |
|------|---------|
| `.github/workflows/infra-check.yml` | Main workflow - validates Bicep changes |
| `.github/workflows/INFRA_CHECK_SETUP.md` | Complete setup guide with OIDC configuration |
| `infra/README.md` (updated) | Added CI/CD Integration section |

## 🚀 Quick Start

### Required GitHub Secrets

Configure these secrets in **Settings** → **Secrets and variables** → **Actions**:

```
AZURE_DEPLOYER_CLIENT_ID    (Azure AD Application ID)
AZURE_TENANT_ID             (Azure AD Tenant ID)
AZURE_SUBSCRIPTION_ID       (Azure Subscription ID)
```

### Setup Commands (5 Minutes)

```bash
# 1. Create Azure AD App
APP_NAME="GlookoDataWebApp-GitHub-Actions"
az ad app create --display-name "$APP_NAME"
APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)

# 2. Create Service Principal
az ad sp create --id $APP_ID

# 3. Assign Permissions
SUBSCRIPTION_ID=$(az account show --query id -o tsv)  # Auto-detect current subscription
az role assignment create \
  --role "Contributor" \
  --assignee $APP_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/Glooko"

# 4. Configure OIDC (replace with your actual repo details)
GITHUB_ORG="your-org"        # Your GitHub username or org (e.g., "iricigor")
GITHUB_REPO="your-repo"      # Your repo name (e.g., "GlookoDataWebApp")

az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "GitHubActionsPR",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:'"$GITHUB_ORG/$GITHUB_REPO"':pull_request",
  "audiences": ["api://AzureADTokenExchange"]
}'

# 5. Get secret values for GitHub
echo "AZURE_DEPLOYER_CLIENT_ID: $APP_ID"
echo "AZURE_TENANT_ID: $(az account show --query tenantId -o tsv)"
echo "AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
```

**Note:** Replace `your-org` and `your-repo` with your actual GitHub repository details from the URL: `github.com/YOUR-ORG/YOUR-REPO`

## 📋 How It Works

1. **Trigger**: PR modifies files in `infra/`
2. **Login**: Authenticates to Azure using OIDC
3. **Validate**: Checks Bicep syntax
4. **Analyze**: Runs `az deployment group what-if`
5. **Report**: Posts results as PR comment

## 🎨 Workflow Triggers

Only runs when PRs modify:
- ✅ `infra/**/*.bicep` - Bicep templates
- ✅ `infra/**/*.bicepparam` - Parameter files
- ✅ `infra/*.sh` - Shell scripts
- ✅ `.github/workflows/infra-check.yml` - The workflow itself

Does NOT run for changes to:
- ❌ `src/` - Application code
- ❌ `docs/` - Documentation
- ❌ Other workflows

## 📊 Output Examples

### ✅ Success (No Changes)
```
## ✅ What-If Analysis - No Changes

The infrastructure changes have been validated successfully.
```

### ✅ Success (Changes Detected)
```
## ✅ What-If Analysis - Changes Detected

The infrastructure changes have been validated successfully.

📋 What-If Analysis Results (click to expand)
```

### ⚠️ Warning (Destructive Changes)
```
## ⚠️ What-If Analysis - Destructive Changes Detected

WARNING: This deployment would delete or modify existing resources.
Please review the changes carefully before merging.
```

### ❌ Error
```
## ❌ What-If Analysis Failed

The what-if analysis encountered an error. Please review the logs below.
```

## 🔒 Security Features

- **OIDC Authentication**: No long-lived credentials
- **Minimal Permissions**: Contributor role on resource group only
- **Read-Only**: Never deploys or modifies resources
- **Audit Trail**: Every run logged in GitHub Actions

## 📚 Documentation

- **Setup Guide**: [INFRA_CHECK_SETUP.md](.github/workflows/INFRA_CHECK_SETUP.md)
- **Infrastructure Docs**: [infra/README.md](infra/README.md)
- **Expected What-If**: [EXPECTED_WHAT_IF.md](infra/EXPECTED_WHAT_IF.md)

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow doesn't trigger | Check if files in `infra/` were modified |
| AADSTS700016 error | Verify federated credential repo name matches exactly |
| Authorization error | Check service principal has Contributor role |
| No subscription found | Verify AZURE_SUBSCRIPTION_ID is correct |

## ✨ Features

✅ Automatic validation on every PR
✅ Keyless authentication (OIDC)
✅ Destructive change detection
✅ Smart PR comments (creates or updates existing)
✅ Collapsible output for clean PRs
✅ Job summaries in Actions tab
✅ Direct links to documentation

## 🔮 Future Enhancements

After testing this read-only workflow, you can:
- 🚀 Add deployment workflow with write permissions
- 📊 Add cost estimation analysis
- 🔔 Add Slack/Teams notifications
- 🎯 Add drift detection for deployed resources

## 📞 Support

For issues or questions:
- Review the [setup guide](.github/workflows/INFRA_CHECK_SETUP.md)
- Check [troubleshooting](#-troubleshooting) section
- Open an issue on GitHub
