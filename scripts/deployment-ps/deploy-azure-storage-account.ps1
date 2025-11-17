################################################################################
# Azure Storage Account Deployment Script (PowerShell)
# 
# This script creates and configures Azure Storage Account for the 
# GlookoDataWebApp application with optional managed identity support.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed
#   - Logged in to Azure (az login)
#   - For managed identity: run deploy-azure-managed-identity.ps1 first
#
# Usage:
#   ./deploy-azure-storage-account.ps1 [OPTIONS]
#
# Parameters:
#   -Name                Storage account name (default from config)
#   -ResourceGroup       Resource group name (default from config)
#   -Location            Azure region (default from config)
#   -ConfigFile          Custom configuration file path
#   -UseManagedIdentity  Configure for managed identity access
#   -ShowConnection      Display connection string
#   -Save                Save arguments to local configuration file
#   -Help                Show this help message
#
# Examples:
#   ./deploy-azure-storage-account.ps1
#   ./deploy-azure-storage-account.ps1 -UseManagedIdentity
#   $env:LOCATION = "westus2"; ./deploy-azure-storage-account.ps1
#
################################################################################

#Requires -Version 7.0

[CmdletBinding()]
param(
    [string]$Name,
    [string]$ResourceGroup,
    [string]$Location,
    [string]$ConfigFile,
    [switch]$UseManagedIdentity,
    [switch]$ShowConnection,
    [switch]$Save,
    [switch]$Help
)

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Source configuration library
$ConfigLibPath = Join-Path $ScriptDir "config-lib.ps1"
if (Test-Path $ConfigLibPath) {
    . $ConfigLibPath
}
else {
    Write-Host "ERROR: config-lib.ps1 not found in $ScriptDir" -ForegroundColor Red
    exit 1
}

################################################################################
# HELP
################################################################################

function Show-Help {
    @"
Azure Storage Account Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates and configures Azure Storage Account with optional
managed identity support for secure, secret-free authentication.

Parameters:
  -Name <string>           Storage account name (overrides config/default)
  -ResourceGroup <string>  Resource group name (overrides config/default)
  -Location <string>       Azure region (overrides config/default)
  -ConfigFile <string>     Use custom configuration file
  -UseManagedIdentity      Configure for managed identity access
  -ShowConnection          Display connection string
  -Save                    Save arguments to local configuration file
  -Help                    Show this help message and exit

Configuration:
$(Show-ConfigHelp)

Examples:
  # Deploy with default configuration
  ./deploy-azure-storage-account.ps1

  # Deploy with managed identity support
  ./deploy-azure-storage-account.ps1 -UseManagedIdentity

  # Deploy with custom name and location
  ./deploy-azure-storage-account.ps1 -Name mystorageacct -Location westus2

For more information, visit:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/scripts/deployment

"@
}

if ($Help) {
    Show-Help
    exit 0
}

################################################################################
# STORAGE ACCOUNT DEPLOYMENT FUNCTIONS
################################################################################

function New-StorageAccount {
    Write-Section "Creating Azure Storage Account"
    
    $storageAccountName = $script:Config.StorageAccountName
    $rgName = $script:Config.ResourceGroup
    $location = $script:Config.Location
    
    Write-InfoMessage "Checking if storage account exists: $storageAccountName"
    
    if (Test-ResourceExists -ResourceType "storage-account" -ResourceName $storageAccountName -ResourceGroupName $rgName) {
        Write-WarningMessage "Storage account '$storageAccountName' already exists"
        return $true
    }
    else {
        Write-InfoMessage "Creating storage account: $storageAccountName"
        Write-InfoMessage "This may take a few minutes..."
        
        $tags = ($script:Config.Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "
        
        az storage account create `
            --name $storageAccountName `
            --resource-group $rgName `
            --location $location `
            --sku Standard_LRS `
            --kind StorageV2 `
            --https-only true `
            --min-tls-version TLS1_2 `
            --allow-blob-public-access false `
            --tags $tags | Out-Null
        
        Write-SuccessMessage "Storage account created successfully"
        return $false
    }
}

function Get-StorageConnectionString {
    $storageAccountName = $script:Config.StorageAccountName
    $rgName = $script:Config.ResourceGroup
    
    $connectionString = az storage account show-connection-string `
        --name $storageAccountName `
        --resource-group $rgName `
        --query connectionString -o tsv 2>$null
    
    return $connectionString
}

function Show-Summary {
    param([bool]$StorageExisted, [bool]$UseMI)
    
    Write-Section "Deployment Summary"
    
    Write-SuccessMessage "Azure Storage Account configured successfully!"
    Write-Host ""
    Write-InfoMessage "Storage Account Details:"
    Write-Host "  - Name: $($script:Config.StorageAccountName)"
    Write-Host "  - Resource Group: $($script:Config.ResourceGroup)"
    Write-Host "  - Location: $($script:Config.Location)"
    Write-Host "  - SKU: Standard_LRS"
    Write-Host "  - Authentication: $(if ($UseMI) { 'Managed Identity' } else { 'Connection String' })"
    Write-Host ""
    
    if ($StorageExisted) {
        Write-InfoMessage "Note: Storage account already existed (not created)"
    }
    
    if (-not $UseMI -or $ShowConnection) {
        Write-InfoMessage "Connection String:"
        $connectionString = Get-StorageConnectionString
        Write-Host "  $connectionString"
        Write-Host ""
        Write-WarningMessage "Keep the connection string secure - never commit to source control!"
    }
    
    if ($UseMI) {
        Write-InfoMessage "Managed Identity Configuration:"
        Write-Host "  The storage account is configured to use managed identity."
        Write-Host "  No connection string needed in your application code."
        Write-Host ""
    }
    
    Write-InfoMessage "Next Steps:"
    Write-Host ""
    Write-Host "  1. Create tables for user data:"
    Write-Host "     - UserSettings: ./deploy-azure-user-settings-table.ps1"
    Write-Host "     - ProUsers: ./deploy-azure-pro-users-table.ps1"
    Write-Host ""
    if ($UseMI) {
        Write-Host "  2. Configure your application to use DefaultAzureCredential"
        Write-Host "  3. Deploy Static Web App with managed identity"
    }
    else {
        Write-Host "  2. Add connection string to Static Web App application settings"
    }
    Write-Host ""
}

################################################################################
# MAIN EXECUTION
################################################################################

# Override environment variables with command-line parameters
if ($Name) { $env:STORAGE_ACCOUNT_NAME = $Name }
if ($ResourceGroup) { $env:RESOURCE_GROUP = $ResourceGroup }
if ($Location) { $env:LOCATION = $Location }
if ($UseManagedIdentity) { $env:USE_MANAGED_IDENTITY = "true" }

# Load configuration
Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })

# Check prerequisites
Test-Prerequisites

# Ensure resource group exists
Initialize-ResourceGroup

# Create storage account
$storageExisted = New-StorageAccount

# Save configuration if requested
if ($Save) {
    Write-Section "Saving Configuration"
    Write-InfoMessage "Saving configuration to local file..."
    Save-ConfigValue "storageAccountName" $script:Config.StorageAccountName
    Save-ConfigValue "resourceGroup" $script:Config.ResourceGroup
    Save-ConfigValue "location" $script:Config.Location
    if ($UseManagedIdentity) {
        Save-ConfigValue "useManagedIdentity" "true"
    }
    $configFile = if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile }
    Write-SuccessMessage "Configuration saved to $configFile"
}

# Display summary
Show-Summary -StorageExisted $storageExisted -UseMI $UseManagedIdentity

Write-Section "Deployment Complete"
Write-SuccessMessage "All operations completed successfully!"
