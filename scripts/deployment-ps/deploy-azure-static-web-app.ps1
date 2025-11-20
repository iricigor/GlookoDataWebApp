################################################################################
# Azure Static Web App Deployment Script (PowerShell)
# 
# This script creates Azure Static Web App for the GlookoDataWebApp application
# with optional managed identity support.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed and configured (az login)
#   - For managed identity: Standard SKU required
#   - GlookoDeployment module installed for configuration management
#
################################################################################

#Requires -Version 7.0
#Requires -Modules @{ ModuleName='GlookoDeployment'; ModuleVersion='0.0.0' }

[CmdletBinding()]
param(
    [string]$Name,
    [string]$ResourceGroup,
    [string]$Location,
    [ValidateSet("Free", "Standard")]
    [string]$Sku = "Free",
    [string]$ConfigFile,
    [switch]$ManagedIdentity,
    [switch]$Help
)

if ($Help) {
    @"
Azure Static Web App Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates Azure Static Web App with optional managed identity.

Prerequisites:
  - GlookoDeployment PowerShell module must be installed
  - For managed identity: Standard SKU is required

Parameters:
  -Name <string>           Static Web App name (overrides config/default)
  -ResourceGroup <string>  Resource group name (overrides config/default)
  -Location <string>       Azure region (overrides config/default)
  -Sku <string>            SKU: Free or Standard (default: Free)
  -ManagedIdentity         Enable managed identity (requires Standard SKU)
  -ConfigFile <string>     Custom configuration file
  -Help                    Show this help message

Examples:
  ./deploy-azure-static-web-app.ps1 -Sku Standard -ManagedIdentity
  ./deploy-azure-static-web-app.ps1 -Sku Free

Installation:
  To install the GlookoDeployment module:
  iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

"@
    exit 0
}

if ($ManagedIdentity -and $Sku -eq "Free") {
    Write-Host "❌ Managed identity requires Standard SKU" -ForegroundColor Red
    Write-Host "ℹ️  Use -Sku Standard with -ManagedIdentity" -ForegroundColor Blue
    exit 1
}

# Load configuration from GlookoDeployment module
$config = if ($ConfigFile) {
    Load-GlookoConfig -ConfigFile $ConfigFile
} else {
    Load-GlookoConfig
}

# Override with command-line parameters
if ($Name) { $config.StaticWebAppName = $Name }
if ($ResourceGroup) { $config.ResourceGroup = $ResourceGroup }
if ($Location) { $config.Location = $Location }
if ($Sku) { $config.StaticWebAppSku = $Sku }

# Check prerequisites
if (-not (Test-AzurePrerequisites)) {
    Write-ErrorMessage "Prerequisites not met"
    exit 1
}

# Ensure resource group exists
Initialize-GlookoResourceGroup -ResourceGroupName $config.ResourceGroup -Location $config.Location -Tags $config.Tags

Write-Section "Creating Azure Static Web App"

$swaName = $config.StaticWebAppName
$rgName = $config.ResourceGroup
$location = $config.Location

Write-InfoMessage "Checking if Static Web App exists..."
if (Test-GlookoResourceExists -ResourceType "staticwebapp" -ResourceName $swaName -ResourceGroupName $rgName) {
    Write-WarningMessage "Static Web App '$swaName' already exists"
}
else {
    Write-InfoMessage "Creating Static Web App: $swaName"
    Write-InfoMessage "SKU: $Sku"
    
    az staticwebapp create `
        --name $swaName `
        --resource-group $rgName `
        --location $location `
        --sku $Sku 2>$null | Out-Null
    
    Write-SuccessMessage "Static Web App created"
}

if ($ManagedIdentity) {
    Write-Section "Configuring Managed Identity"
    
    $identityName = $config.ManagedIdentityName
    $identityId = Get-GlookoManagedIdentityId -IdentityName $identityName -ResourceGroupName $rgName
    
    if ($identityId) {
        Write-InfoMessage "Assigning managed identity to Static Web App..."
        az staticwebapp identity assign `
            --name $swaName `
            --resource-group $rgName `
            --identities $identityId 2>$null | Out-Null
        Write-SuccessMessage "Managed identity assigned"
    }
    else {
        Write-WarningMessage "Managed identity not found. Deploy managed identity first using: Set-GlookoManagedIdentity"
    }
}

# Get deployment token
$token = az staticwebapp secrets list `
    --name $swaName `
    --resource-group $rgName `
    --query "properties.apiKey" -o tsv 2>$null

Write-Section "Deployment Summary"
Write-SuccessMessage "Azure Static Web App configured!"
Write-Host ""
Write-InfoMessage "Static Web App Details:"
Write-Host "  - Name: $swaName"
Write-Host "  - SKU: $Sku"
Write-Host "  - Resource Group: $rgName"
if ($ManagedIdentity) {
    Write-Host "  - Managed Identity: Enabled"
}
Write-Host ""
Write-InfoMessage "Deployment Token (for GitHub Actions):"
Write-Host "  $token"
Write-Host ""
Write-InfoMessage "Add this to GitHub repository secrets as AZURE_STATIC_WEB_APPS_API_TOKEN"
Write-Host ""

Write-Section "Deployment Complete"
