################################################################################
# Azure App Registration Deployment Script (PowerShell)
# 
# This script creates and configures Azure App Registration for Microsoft
# authentication in the GlookoDataWebApp application.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed
#   - Application Administrator permissions
#
################################################################################

#Requires -Version 7.0

[CmdletBinding()]
param(
    [string]$AppName,
    [string]$WebAppUrl,
    [string]$ConfigFile,
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
Azure App Registration Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates Azure App Registration for Microsoft authentication.

Parameters:
  -AppName <string>      App registration name
  -WebAppUrl <string>    Production web URL
  -ConfigFile <string>   Custom configuration file
  -Help                  Show this help message

"@
    exit 0
}

if ($AppName) { $env:APP_REGISTRATION_NAME = $AppName }
if ($WebAppUrl) { $env:WEB_APP_URL = $WebAppUrl }

Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })
Test-Prerequisites

Write-Section "Creating Azure App Registration"

$appName = $script:Config.AppRegistrationName
$webAppUrl = $script:Config.WebAppUrl

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
