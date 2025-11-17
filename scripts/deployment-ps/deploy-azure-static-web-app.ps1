################################################################################
# Azure Static Web App Deployment Script (PowerShell)
# 
# This script creates Azure Static Web App for the GlookoDataWebApp application
# with optional managed identity support.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed
#   - For managed identity: Standard SKU required
#
################################################################################

#Requires -Version 7.0

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

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigLibPath = Join-Path $ScriptDir "config-lib.ps1"
if (Test-Path $ConfigLibPath) {
    . $ConfigLibPath
}
else {
    Write-Host "ERROR: config-lib.ps1 not found in $ScriptDir" -ForegroundColor Red
    exit 1
}

if ($Help) {
    @"
Azure Static Web App Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates Azure Static Web App with optional managed identity.

Parameters:
  -Name <string>       Static Web App name
  -ResourceGroup <string>  Resource group name
  -Location <string>   Azure region
  -Sku <string>        SKU: Free or Standard (default: Free)
  -ManagedIdentity     Enable managed identity (requires Standard SKU)
  -ConfigFile <string> Custom configuration file
  -Help                Show this help message

Examples:
  ./deploy-azure-static-web-app.ps1 -Sku Standard -ManagedIdentity
  ./deploy-azure-static-web-app.ps1 -Sku Free

"@
    exit 0
}

if ($ManagedIdentity -and $Sku -eq "Free") {
    Write-ErrorMessage "Managed identity requires Standard SKU"
    Write-InfoMessage "Use -Sku Standard with -ManagedIdentity"
    exit 1
}

if ($Name) { $env:STATIC_WEB_APP_NAME = $Name }
if ($ResourceGroup) { $env:RESOURCE_GROUP = $ResourceGroup }
if ($Location) { $env:LOCATION = $Location }
if ($Sku) { $env:STATIC_WEB_APP_SKU = $Sku }

Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })
Test-Prerequisites
Initialize-ResourceGroup

Write-Section "Creating Azure Static Web App"

$swaName = $script:Config.StaticWebAppName
$rgName = $script:Config.ResourceGroup
$location = $script:Config.Location

Write-InfoMessage "Checking if Static Web App exists..."
if (Test-ResourceExists -ResourceType "staticwebapp" -ResourceName $swaName -ResourceGroupName $rgName) {
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
    
    $identityName = $script:Config.ManagedIdentityName
    $identityId = Get-ManagedIdentityId -IdentityName $identityName
    
    if ($identityId) {
        Write-InfoMessage "Assigning managed identity to Static Web App..."
        az staticwebapp identity assign `
            --name $swaName `
            --resource-group $rgName `
            --identities $identityId 2>$null | Out-Null
        Write-SuccessMessage "Managed identity assigned"
    }
    else {
        Write-WarningMessage "Managed identity not found. Run deploy-azure-managed-identity.ps1 first"
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
