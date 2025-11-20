################################################################################
# Azure Pro Users Table Deployment Script (PowerShell)
# 
# This script creates the ProUsers table in Azure Table Storage for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed and configured (az login)
#   - Storage account must exist (deploy with Set-GlookoStorageAccount from GlookoDeployment module)
#   - GlookoDeployment module installed for configuration management
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
Azure Pro Users Table Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates the ProUsers table in Azure Table Storage.

Prerequisites:
  - GlookoDeployment PowerShell module must be installed
  - Storage account must already exist

Parameters:
  -StorageAccountName <string>  Storage account name (overrides config/default)
  -ResourceGroup <string>       Resource group name (overrides config/default)
  -ConfigFile <string>          Custom configuration file
  -Help                         Show this help message

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
if ($StorageAccountName) { $config.StorageAccountName = $StorageAccountName }
if ($ResourceGroup) { $config.ResourceGroup = $ResourceGroup }

# Check prerequisites
if (-not (Test-AzurePrerequisites)) {
    Write-ErrorMessage "Prerequisites not met"
    exit 1
}

Write-Section "Creating ProUsers Table"

$storageAccountName = $config.StorageAccountName
$rgName = $config.ResourceGroup

if (-not (Test-GlookoResourceExists -ResourceType "storage-account" -ResourceName $storageAccountName -ResourceGroupName $rgName)) {
    Write-ErrorMessage "Storage account '$storageAccountName' not found"
    Write-InfoMessage "Please deploy storage account first using: Set-GlookoStorageAccount"
    exit 1
}

$accountKey = az storage account keys list `
    --account-name $storageAccountName `
    --resource-group $rgName `
    --query "[0].value" -o tsv 2>$null

try {
    az storage table create `
        --name "ProUsers" `
        --account-name $storageAccountName `
        --account-key $accountKey 2>$null | Out-Null
    Write-SuccessMessage "ProUsers table created successfully"
}
catch {
    Write-WarningMessage "Table may already exist"
}

Write-Section "Deployment Complete"
Write-SuccessMessage "ProUsers table configured!"
