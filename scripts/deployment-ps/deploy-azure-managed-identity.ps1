################################################################################
# Azure User Managed Identity Deployment Script (PowerShell)
# 
# This script creates and configures a user-assigned managed identity for the
# GlookoDataWebApp application. The managed identity is used to authenticate
# Azure resources without managing secrets.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed
#   - Logged in to Azure (az login)
#   - Contributor or Owner role on the subscription
#
# Usage:
#   ./deploy-azure-managed-identity.ps1 [OPTIONS]
#
# Parameters:
#   -Name              Managed identity name (default from config)
#   -ResourceGroup     Resource group name (default from config)
#   -Location          Azure region (default from config)
#   -ConfigFile        Custom configuration file path
#   -Save              Save arguments to local configuration file
#   -Verbose           Enable verbose output
#   -Help              Show this help message
#
# Examples:
#   ./deploy-azure-managed-identity.ps1
#   ./deploy-azure-managed-identity.ps1 -Name my-identity -Location westus2
#   $env:LOCATION = "westus2"; ./deploy-azure-managed-identity.ps1
#
################################################################################

#Requires -Version 7.0

[CmdletBinding()]
param(
    [string]$Name,
    [string]$ResourceGroup,
    [string]$Location,
    [string]$ConfigFile,
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
# HELP AND USAGE
################################################################################

function Show-Help {
    @"
Azure User Managed Identity Deployment Script

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This script creates and configures a user-assigned managed identity for
authenticating Azure resources without managing secrets or connection strings.

Parameters:
  -Name <string>         Managed identity name (overrides config/default)
  -ResourceGroup <string> Resource group name (overrides config/default)
  -Location <string>      Azure region (overrides config/default)
  -ConfigFile <string>    Use custom configuration file
  -Save                   Save arguments to local configuration file
  -Verbose                Enable verbose output
  -Help                   Show this help message and exit

Configuration:
$(Show-ConfigHelp)

Examples:
  # Deploy with default configuration
  ./deploy-azure-managed-identity.ps1

  # Deploy with custom name and location
  ./deploy-azure-managed-identity.ps1 -Name my-app-identity -Location westus2

  # Use custom config file
  ./deploy-azure-managed-identity.ps1 -ConfigFile ~/my-config.json

  # Save configuration for future runs
  ./deploy-azure-managed-identity.ps1 -Name my-identity -Save

Environment Variables:
  MANAGED_IDENTITY_NAME  - Override managed identity name
  RESOURCE_GROUP         - Override resource group name
  LOCATION               - Override Azure region

For more information, visit:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/scripts/deployment

"@
}

if ($Help) {
    Show-Help
    exit 0
}

################################################################################
# MANAGED IDENTITY DEPLOYMENT FUNCTIONS
################################################################################

function New-ManagedIdentity {
    Write-Section "Creating User-Assigned Managed Identity"
    
    $identityName = $script:Config.ManagedIdentityName
    $rgName = $script:Config.ResourceGroup
    $location = $script:Config.Location
    
    Write-InfoMessage "Checking if managed identity exists: $identityName"
    
    if (Test-ResourceExists -ResourceType identity -ResourceName $identityName -ResourceGroupName $rgName) {
        Write-WarningMessage "Managed identity '$identityName' already exists"
        return $true
    }
    else {
        Write-InfoMessage "Creating managed identity: $identityName"
        $tags = ($script:Config.Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "
        az identity create --name $identityName --resource-group $rgName --location $location --tags $tags | Out-Null
        
        Write-SuccessMessage "Managed identity created successfully"
        return $false
    }
}

function Get-IdentityDetails {
    Write-Section "Retrieving Managed Identity Details"
    
    $identityName = $script:Config.ManagedIdentityName
    $rgName = $script:Config.ResourceGroup
    
    Write-InfoMessage "Getting managed identity information..."
    
    $script:IdentityClientId = Get-ManagedIdentityId -IdentityName $identityName -ResourceGroupName $rgName
    $script:IdentityPrincipalId = Get-ManagedIdentityPrincipalId -IdentityName $identityName -ResourceGroupName $rgName
    
    $identityJson = az identity show --name $identityName --resource-group $rgName 2>$null
    if ($identityJson) {
        $identity = $identityJson | ConvertFrom-Json
        $script:IdentityResourceId = $identity.id
    }
    
    if (-not $script:IdentityClientId -or -not $script:IdentityPrincipalId) {
        Write-ErrorMessage "Failed to retrieve managed identity details"
        exit 1
    }
    
    Write-SuccessMessage "Managed identity details retrieved"
}

function Set-StorageRoles {
    Write-Section "Configuring Storage Account Access"
    
    $storageAccount = $script:Config.StorageAccountName
    $rgName = $script:Config.ResourceGroup
    
    # Check if storage account exists
    if (-not (Test-ResourceExists -ResourceType "storage-account" -ResourceName $storageAccount -ResourceGroupName $rgName)) {
        Write-WarningMessage "Storage account '$storageAccount' not found"
        Write-InfoMessage "Storage role assignment will be skipped"
        Write-InfoMessage "Run deploy-azure-storage-account.ps1 first, then re-run this script"
        return
    }
    
    Write-InfoMessage "Assigning roles to managed identity for storage account..."
    
    # Get storage account scope
    $storageJson = az storage account show --name $storageAccount --resource-group $rgName 2>$null
    if ($storageJson) {
        $storage = $storageJson | ConvertFrom-Json
        $storageScope = $storage.id
        
        # Assign Storage Blob Data Contributor role
        Write-InfoMessage "Assigning 'Storage Blob Data Contributor' role..."
        try {
            az role assignment create `
                --assignee $script:IdentityPrincipalId `
                --role "Storage Blob Data Contributor" `
                --scope $storageScope 2>$null | Out-Null
            Write-SuccessMessage "Storage Blob Data Contributor role assigned"
        }
        catch {
            Write-WarningMessage "Role may already be assigned (this is normal)"
        }
        
        # Assign Storage Table Data Contributor role
        Write-InfoMessage "Assigning 'Storage Table Data Contributor' role..."
        try {
            az role assignment create `
                --assignee $script:IdentityPrincipalId `
                --role "Storage Table Data Contributor" `
                --scope $storageScope 2>$null | Out-Null
            Write-SuccessMessage "Storage Table Data Contributor role assigned"
        }
        catch {
            Write-WarningMessage "Role may already be assigned (this is normal)"
        }
        
        Write-SuccessMessage "Storage account roles configured"
        Write-InfoMessage "The managed identity can now access storage without connection strings"
    }
}

function Save-Configuration {
    if ($Save) {
        Write-Section "Saving Configuration"
        
        Write-InfoMessage "Saving configuration to local file..."
        Save-ConfigValue "managedIdentityName" $script:Config.ManagedIdentityName
        Save-ConfigValue "resourceGroup" $script:Config.ResourceGroup
        Save-ConfigValue "location" $script:Config.Location
        
        $configFile = if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile }
        Write-SuccessMessage "Configuration saved to $configFile"
    }
}

function Show-Summary {
    param([bool]$IdentityExisted)
    
    Write-Section "Deployment Summary"
    
    Write-SuccessMessage "User-Assigned Managed Identity configured successfully!"
    Write-Host ""
    Write-InfoMessage "Managed Identity Details:"
    Write-Host "  - Name: $($script:Config.ManagedIdentityName)"
    Write-Host "  - Resource Group: $($script:Config.ResourceGroup)"
    Write-Host "  - Location: $($script:Config.Location)"
    Write-Host "  - Client ID: $script:IdentityClientId"
    Write-Host "  - Principal ID: $script:IdentityPrincipalId"
    Write-Host "  - Resource ID: $script:IdentityResourceId"
    Write-Host ""
    
    if ($IdentityExisted) {
        Write-InfoMessage "Note: Managed identity already existed (not created)"
    }
    
    Write-InfoMessage "What is a Managed Identity?"
    Write-Host "  A managed identity is an Azure AD identity that can be used to authenticate"
    Write-Host "  to Azure services without storing credentials in your code or configuration."
    Write-Host ""
    Write-Host "  Benefits:"
    Write-Host "  - No secrets to manage (no connection strings, passwords, or keys)"
    Write-Host "  - Automatic credential rotation by Azure"
    Write-Host "  - Improved security and compliance"
    Write-Host "  - Simplified access management"
    Write-Host ""
    
    Write-InfoMessage "Assigned Roles:"
    Write-Host "  - Storage Blob Data Contributor (if storage account exists)"
    Write-Host "  - Storage Table Data Contributor (if storage account exists)"
    Write-Host ""
    
    Write-InfoMessage "Next Steps:"
    Write-Host ""
    Write-Host "  1. Deploy or update other Azure resources to use this managed identity:"
    Write-Host "     - Static Web App: ./deploy-azure-static-web-app.ps1"
    Write-Host "     - Storage Account: ./deploy-azure-storage-account.ps1 -UseManagedIdentity"
    Write-Host ""
    Write-Host "  2. Assign additional roles if needed"
    Write-Host ""
}

################################################################################
# MAIN EXECUTION
################################################################################

# Override environment variables with command-line parameters
if ($Name) { $env:MANAGED_IDENTITY_NAME = $Name }
if ($ResourceGroup) { $env:RESOURCE_GROUP = $ResourceGroup }
if ($Location) { $env:LOCATION = $Location }

# Load configuration
Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })

# Check prerequisites
Test-Prerequisites

# Ensure resource group exists
Initialize-ResourceGroup

# Create managed identity
$identityExisted = New-ManagedIdentity

# Get identity details
Get-IdentityDetails

# Assign storage roles
Set-StorageRoles

# Save configuration if requested
Save-Configuration

# Display summary
Show-Summary -IdentityExisted $identityExisted

Write-Section "Deployment Complete"
Write-SuccessMessage "All operations completed successfully!"
