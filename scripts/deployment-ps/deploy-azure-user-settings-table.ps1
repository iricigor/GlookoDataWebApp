################################################################################
# Azure User Settings Table Deployment Script (PowerShell)
# 
# This script creates the UserSettings table in Azure Table Storage for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed and configured (az login)
#   - Storage account must exist (deploy with Set-GlookoStorageAccount from GlookoDeployment module)
#   - GlookoDeployment module installed for configuration management
#
# Usage:
#   ./deploy-azure-user-settings-table.ps1 [OPTIONS]
#
################################################################################

#Requires -Version 7.0
#Requires -Modules @{ ModuleName='GlookoDeployment'; ModuleVersion='0.0.0' }

[CmdletBinding()]
param(
    [string]$StorageAccountName,
    [string]$ResourceGroup,
    [string]$ConfigFile,
    [switch]$Help
)

if ($Help) {
    @"
Azure User Settings Table Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates the UserSettings table in Azure Table Storage.

Prerequisites:
  - GlookoDeployment PowerShell module must be installed
  - Storage account must already exist

Parameters:
  -StorageAccountName <string>  Storage account name (overrides config/default)
  -ResourceGroup <string>       Resource group name (overrides config/default)
  -ConfigFile <string>          Use custom configuration file
  -Help                         Show this help message and exit

Installation:
  To install the GlookoDeployment module:
  iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

For more information, visit:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/scripts/deployment

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
if ($StorageAccountName) { $config.StorageAccountName = $StorageAccountName }
if ($ResourceGroup) { $config.ResourceGroup = $ResourceGroup }

# Check prerequisites
if (-not (Test-AzurePrerequisites)) {
    Write-ErrorMessage "Prerequisites not met"
    exit 1
}

Write-Section "Creating UserSettings Table"

$storageAccountName = $config.StorageAccountName
$rgName = $config.ResourceGroup

Write-InfoMessage "Checking if storage account exists..."
if (-not (Test-GlookoResourceExists -ResourceType "storage-account" -ResourceName $storageAccountName -ResourceGroupName $rgName)) {
    Write-ErrorMessage "Storage account '$storageAccountName' not found"
    Write-InfoMessage "Please deploy storage account first using: Set-GlookoStorageAccount"
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
