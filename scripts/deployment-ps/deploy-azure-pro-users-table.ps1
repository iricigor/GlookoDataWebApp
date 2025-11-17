################################################################################
# Azure Pro Users Table Deployment Script (PowerShell)
# 
# This script creates the ProUsers table in Azure Table Storage for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed
#   - Storage account must exist
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
Azure Pro Users Table Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates the ProUsers table in Azure Table Storage.

Parameters:
  -StorageAccountName <string>  Storage account name
  -ResourceGroup <string>       Resource group name
  -ConfigFile <string>          Custom configuration file
  -Help                         Show this help message

"@
    exit 0
}

if ($StorageAccountName) { $env:STORAGE_ACCOUNT_NAME = $StorageAccountName }
if ($ResourceGroup) { $env:RESOURCE_GROUP = $ResourceGroup }

Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })
Test-Prerequisites

Write-Section "Creating ProUsers Table"

$storageAccountName = $script:Config.StorageAccountName
$rgName = $script:Config.ResourceGroup

if (-not (Test-ResourceExists -ResourceType "storage-account" -ResourceName $storageAccountName -ResourceGroupName $rgName)) {
    Write-ErrorMessage "Storage account '$storageAccountName' not found"
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
