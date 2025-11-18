################################################################################
# Azure User Settings Table Deployment Script (PowerShell)
# 
# This script creates the UserSettings table in Azure Table Storage for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed
#   - Logged in to Azure (az login)
#   - Storage account must exist (run deploy-azure-storage-account.ps1 first)
#
# Usage:
#   ./deploy-azure-user-settings-table.ps1 [OPTIONS]
#
################################################################################

#Requires -Version 7.0

[CmdletBinding()]
param(
    [string]$StorageAccountName,
    [string]$ResourceGroup,
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
Azure User Settings Table Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates the UserSettings table in Azure Table Storage.

Parameters:
  -StorageAccountName <string>  Storage account name (overrides config/default)
  -ResourceGroup <string>       Resource group name (overrides config/default)
  -ConfigFile <string>          Use custom configuration file
  -Help                         Show this help message and exit

For more information, visit:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/scripts/deployment

"@
    exit 0
}

# Override environment variables with command-line parameters
if ($StorageAccountName) { $env:STORAGE_ACCOUNT_NAME = $StorageAccountName }
if ($ResourceGroup) { $env:RESOURCE_GROUP = $ResourceGroup }

# Load configuration
Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })

# Check prerequisites
Test-Prerequisites

Write-Section "Creating UserSettings Table"

$storageAccountName = $script:Config.StorageAccountName
$rgName = $script:Config.ResourceGroup

Write-InfoMessage "Checking if storage account exists..."
if (-not (Test-ResourceExists -ResourceType "storage-account" -ResourceName $storageAccountName -ResourceGroupName $rgName)) {
    Write-ErrorMessage "Storage account '$storageAccountName' not found"
    Write-InfoMessage "Please run deploy-azure-storage-account.ps1 first"
    exit 1
}

Write-InfoMessage "Creating UserSettings table..."

# Get storage account key
$accountKey = az storage account keys list `
    --account-name $storageAccountName `
    --resource-group $rgName `
    --query "[0].value" -o tsv 2>$null

if (-not $accountKey) {
    Write-ErrorMessage "Failed to get storage account key"
    exit 1
}

# Create table
try {
    az storage table create `
        --name "UserSettings" `
        --account-name $storageAccountName `
        --account-key $accountKey 2>$null | Out-Null
    Write-SuccessMessage "UserSettings table created successfully"
}
catch {
    Write-WarningMessage "Table may already exist (this is normal)"
}

# Configure CORS
Write-InfoMessage "Configuring CORS for browser access..."
az storage cors add `
    --services t `
    --methods GET PUT POST DELETE `
    --origins "*" `
    --allowed-headers "*" `
    --exposed-headers "*" `
    --max-age 3600 `
    --account-name $storageAccountName `
    --account-key $accountKey 2>$null | Out-Null

Write-SuccessMessage "CORS configured successfully"

Write-Section "Deployment Summary"
Write-SuccessMessage "UserSettings table configured successfully!"
Write-Host ""
Write-InfoMessage "Table Details:"
Write-Host "  - Name: UserSettings"
Write-Host "  - Storage Account: $storageAccountName"
Write-Host "  - Purpose: Store user preferences and settings"
Write-Host ""
Write-InfoMessage "Table Structure:"
Write-Host "  - PartitionKey: User email address"
Write-Host "  - RowKey: 'settings'"
Write-Host "  - Columns: ThemeMode, ExportFormat, GlucoseThresholds, etc."
Write-Host ""

Write-Section "Deployment Complete"
Write-SuccessMessage "All operations completed successfully!"
