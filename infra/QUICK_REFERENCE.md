# Bicep Infrastructure Quick Reference

Quick command reference for working with the GlookoDataWebApp Bicep infrastructure.

## Prerequisites

```bash
# Check Azure CLI version (requires 2.50.0+)
az --version

# Check Bicep version
az bicep version

# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Verify current subscription
az account show --query name -o tsv
```

## Validation

```bash
# Navigate to infra directory
cd infra

# Validate Bicep syntax
az bicep build --file main.bicep

# Run automated verification
./verify.sh

# Run manual what-if (current production)
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam

# Run what-if (generic)
az deployment group what-if \
  --resource-group glooko-rg \
  --template-file main.bicep \
  --parameters parameters.generic.bicepparam
```

## Deployment

```bash
# Deploy with confirmation prompt
az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam \
  --confirm-with-what-if

# Deploy without confirmation (not recommended)
az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam

# Create resource group first (if needed)
az group create --name Glooko --location westeurope
```

## Post-Deployment

```bash
# Add secrets to Key Vault
az keyvault secret set \
  --vault-name glookodatawebapp-kv \
  --name "PerplexityApiKey" \
  --value "<your-key>"

az keyvault secret set \
  --vault-name glookodatawebapp-kv \
  --name "GeminiApiKey" \
  --value "<your-key>"

az keyvault secret set \
  --vault-name glookodatawebapp-kv \
  --name "google-client-id" \
  --value "<your-client-id>"

az keyvault secret set \
  --vault-name glookodatawebapp-kv \
  --name "google-client-secret" \
  --value "<your-client-secret>"

# Link Function App backend to Static Web App
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az staticwebapp backends link \
  --name GlookoData \
  --resource-group Glooko \
  --backend-resource-id "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/Glooko/providers/Microsoft.Web/sites/glookodatawebapp-func" \
  --backend-region westeurope

# Verify backend link
az staticwebapp backends list \
  --name GlookoData \
  --resource-group Glooko
```

## Verification Commands

```bash
# List all resources in resource group
az resource list \
  --resource-group Glooko \
  --output table

# Show managed identity
az identity show \
  --name glookodatawebapp-identity \
  --resource-group Glooko \
  --output table

# List storage tables
az storage table list \
  --account-name glookodatawebappstorage \
  --auth-mode login \
  --output table

# Show key vault
az keyvault show \
  --name glookodatawebapp-kv \
  --output table

# List key vault secrets (names only)
az keyvault secret list \
  --vault-name glookodatawebapp-kv \
  --query "[].name" \
  --output table

# Show function app
az functionapp show \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --output table

# List function app settings
az functionapp config appsettings list \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --output table

# Show static web app
az staticwebapp show \
  --name GlookoData \
  --resource-group Glooko \
  --output table

# Check RBAC role assignments for managed identity
MI_PRINCIPAL_ID=$(az identity show \
  --name glookodatawebapp-identity \
  --resource-group Glooko \
  --query principalId -o tsv)

az role assignment list \
  --assignee "${MI_PRINCIPAL_ID}" \
  --resource-group Glooko \
  --output table
```

## Troubleshooting

```bash
# Get deployment error details
az deployment group show \
  --resource-group Glooko \
  --name <deployment-name> \
  --query properties.error

# List recent deployments
az deployment group list \
  --resource-group Glooko \
  --output table

# Export existing resource as JSON (for comparison)
az functionapp show \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --output json > current-function-app.json

# Test Azure login
az account show

# Re-login if needed
az logout
az login
```

## Bicep Utilities

```bash
# Decompile ARM JSON to Bicep
az bicep decompile --file template.json

# Build Bicep to ARM JSON
az bicep build --file main.bicep --outfile main.json

# Upgrade Bicep CLI
az bicep upgrade

# Install Bicep CLI (if not included with Azure CLI)
az bicep install
```

## Parameter File Management

```bash
# View parameter file
cat parameters.current.bicepparam

# Edit parameter file
nano parameters.current.bicepparam

# Create custom parameter file
cp parameters.generic.bicepparam parameters.custom.bicepparam
nano parameters.custom.bicepparam

# Use custom parameter file
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --parameters parameters.custom.bicepparam
```

## Clean Up (Destructive!)

```bash
# Delete entire resource group (⚠️ DANGER!)
az group delete \
  --name Glooko \
  --yes \
  --no-wait

# Delete specific resource
az <resource-type> delete \
  --name <resource-name> \
  --resource-group Glooko
```

## Common Workflows

### New Environment Deployment

```bash
# 1. Create resource group
az group create --name my-glooko-rg --location westeurope

# 2. Copy and edit parameter file
cp parameters.generic.bicepparam parameters.myenv.bicepparam
nano parameters.myenv.bicepparam

# 3. Run what-if
az deployment group what-if \
  --resource-group my-glooko-rg \
  --template-file main.bicep \
  --parameters parameters.myenv.bicepparam

# 4. Deploy
az deployment group create \
  --resource-group my-glooko-rg \
  --template-file main.bicep \
  --parameters parameters.myenv.bicepparam \
  --confirm-with-what-if

# 5. Add secrets and link backend (see Post-Deployment above)
```

### Update Existing Infrastructure

```bash
# 1. Edit Bicep files
nano main.bicep

# 2. Validate syntax
az bicep build --file main.bicep

# 3. Run what-if to preview changes
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam

# 4. Deploy changes
az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam \
  --confirm-with-what-if
```

### Verify Infrastructure Matches

```bash
# Run automated verification
./verify.sh

# OR manual what-if
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam

# Expected: "No change" or only "Ignore" changes
```

## Environment Variables

```bash
# Set variables for repeated use
export RESOURCE_GROUP="Glooko"
export LOCATION="westeurope"
export SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Use in commands
az deployment group what-if \
  --resource-group "${RESOURCE_GROUP}" \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

## Resources

- [Full README](./README.md)
- [Manual Verification Guide](./MANUAL_VERIFICATION.md)
- [Azure Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)
