################################################################################
# Azure App Registration Deployment Script (PowerShell)
# 
# This script creates and configures Azure App Registration for Microsoft
# authentication in the GlookoDataWebApp application.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed and configured (az login)
#   - Application Administrator permissions
#   - GlookoDeployment module installed for configuration management
#
################################################################################

#Requires -Version 7.0
#Requires -Modules @{ ModuleName='GlookoDeployment'; ModuleVersion='0.0.0' }

[CmdletBinding()]
param(
    [string]$AppName,
    [string]$WebAppUrl,
    [string]$ConfigFile,
    [switch]$Help
)

if ($Help) {
    @"
Azure App Registration Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates Azure App Registration for Microsoft authentication.

Prerequisites:
  - GlookoDeployment PowerShell module must be installed
  - Application Administrator permissions in Azure AD

Parameters:
  -AppName <string>      App registration name (overrides config/default)
  -WebAppUrl <string>    Production web URL (overrides config/default)
  -ConfigFile <string>   Custom configuration file
  -Help                  Show this help message

Installation:
  To install the GlookoDeployment module:
  iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

"@
    exit 0
}

# Load configuration from GlookoDeployment module
$config = if ($ConfigFile) {
    Load-GlookoConfig -ConfigFile $ConfigFile
} else {
    Load-GlookoConfig
}

# Override with command-line parameters
if ($AppName) { $config.AppRegistrationName = $AppName }
if ($WebAppUrl) { $config.WebAppUrl = $WebAppUrl }

# Check prerequisites
if (-not (Test-AzurePrerequisites)) {
    Write-ErrorMessage "Prerequisites not met"
    exit 1
}

Write-Section "Creating Azure App Registration"

$appName = $config.AppRegistrationName
$webAppUrl = $config.WebAppUrl

Write-InfoMessage "Checking if app registration exists..."
$existingApp = az ad app list --display-name $appName --query "[0]" 2>$null | ConvertFrom-Json

if ($existingApp) {
    Write-WarningMessage "App registration '$appName' already exists"
    $appId = $existingApp.appId
}
else {
    Write-InfoMessage "Creating app registration: $appName"
    
    # Create app registration
    $app = az ad app create `
        --display-name $appName `
        --sign-in-audience "PersonalMicrosoftAccount" `
        --web-redirect-uris "$webAppUrl/.auth/login/aad/callback" "http://localhost:5173/.auth/login/aad/callback" 2>$null | ConvertFrom-Json
    
    $appId = $app.appId
    
    Write-SuccessMessage "App registration created"
}

# Get tenant ID
$tenantId = az account show --query tenantId -o tsv 2>$null

Write-Section "Deployment Summary"
Write-SuccessMessage "Azure App Registration configured!"
Write-Host ""
Write-InfoMessage "App Registration Details:"
Write-Host "  - Name: $appName"
Write-Host "  - Application (Client) ID: $appId"
Write-Host "  - Tenant ID: $tenantId"
Write-Host "  - Sign-in Audience: Personal Microsoft Accounts"
Write-Host ""
Write-InfoMessage "Redirect URIs:"
Write-Host "  - Production: $webAppUrl/.auth/login/aad/callback"
Write-Host "  - Development: http://localhost:5173/.auth/login/aad/callback"
Write-Host ""
Write-InfoMessage "Next Steps:"
Write-Host "  1. Add these values to your Static Web App configuration:"
Write-Host "     AZURE_CLIENT_ID=$appId"
Write-Host "     AZURE_TENANT_ID=$tenantId"
Write-Host ""

Write-Section "Deployment Complete"
