################################################################################
# Azure Master Deployment Script (PowerShell)
# 
# This is the master orchestration script for deploying all Azure resources
# for the GlookoDataWebApp application.
#
# Prerequisites:
#   - PowerShell 7.0+
#   - Azure CLI installed
#   - Logged in to Azure (az login)
#   - Appropriate permissions to create all resources
#
# Usage:
#   ./deploy-azure-master.ps1 [OPTIONS]
#
# Parameters:
#   -All               Deploy all resources
#   -Identity          Deploy only managed identity
#   -Storage           Deploy only storage account
#   -Tables            Deploy only tables
#   -Auth              Deploy only app registration
#   -WebApp            Deploy only static web app
#   -DryRun            Validate configuration without deploying
#   -ConfigFile        Use custom configuration file
#   -CreateConfig      Create configuration file interactively
#   -ShowConfig        Display current configuration
#   -Help              Show this help message
#
# Examples:
#   ./deploy-azure-master.ps1 -All
#   ./deploy-azure-master.ps1 -Identity -Storage
#   ./deploy-azure-master.ps1 -DryRun -ShowConfig
#
################################################################################

#Requires -Version 7.0

[CmdletBinding()]
param(
    [switch]$All,
    [switch]$Identity,
    [switch]$Storage,
    [switch]$Tables,
    [switch]$Auth,
    [switch]$WebApp,
    [switch]$DryRun,
    [string]$ConfigFile,
    [switch]$CreateConfig,
    [switch]$ShowConfig,
    [switch]$Help
)

# Script version
$ScriptVersion = "1.0.0"

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
Azure Master Deployment Script v$ScriptVersion

Usage: $($MyInvocation.MyCommand.Name) [OPTIONS]

This master script orchestrates the deployment of all Azure resources for
GlookoDataWebApp with centralized configuration management.

Deployment Options:
  -All               Deploy all resources in order
  -Identity          Deploy only managed identity
  -Storage           Deploy only storage account
  -Tables            Deploy only tables (UserSettings, ProUsers)
  -Auth              Deploy only app registration
  -WebApp            Deploy only static web app

Configuration Options:
  -ConfigFile <string>    Use custom configuration file
  -CreateConfig           Create configuration file interactively
  -ShowConfig             Display current configuration

Other Options:
  -DryRun            Validate configuration without deploying
  -Help              Show this help message

Configuration Priority:
  1. Command-line parameters (highest)
  2. Environment variables
  3. Configuration file (~/.glookodata/config.json)
  4. Script defaults (lowest)

Examples:
  # Deploy all resources
  ./deploy-azure-master.ps1 -All

  # Deploy specific components
  ./deploy-azure-master.ps1 -Identity -Storage

  # Validate configuration
  ./deploy-azure-master.ps1 -DryRun -ShowConfig

For detailed documentation:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/docs/DEPLOYMENT.md

"@
}

if ($Help) {
    Show-Help
    exit 0
}

################################################################################
# CONFIGURATION MANAGEMENT
################################################################################

function New-ConfigurationInteractive {
    Write-Section "Creating Configuration File"
    
    Initialize-ConfigDirectory
    
    $configFile = if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile }
    
    if (Test-Path $configFile) {
        Write-WarningMessage "Configuration file already exists: $configFile"
        $response = Read-Host "Do you want to overwrite it? (y/N)"
        if ($response -notmatch "^[Yy]$") {
            Write-InfoMessage "Keeping existing configuration"
            return
        }
    }
    
    Write-InfoMessage "Creating new configuration file: $configFile"
    
    # Copy template
    $templateFile = Join-Path $ScriptDir "config.template.json"
    if (Test-Path $templateFile) {
        Copy-Item $templateFile $configFile
        Write-SuccessMessage "Configuration file created from template"
    }
    else {
        # Create basic config
        @{
            resourceGroup = "glookodatawebapp-rg"
            location = "eastus"
            appName = "glookodatawebapp"
            storageAccountName = "glookodatawebappstorage"
            managedIdentityName = "glookodatawebapp-identity"
            staticWebAppName = "glookodatawebapp-swa"
            staticWebAppSku = "Free"
            useManagedIdentity = $true
            webAppUrl = "https://glooko.iric.online"
        } | ConvertTo-Json | Set-Content $configFile
        Write-SuccessMessage "Configuration file created"
    }
    
    Write-InfoMessage "Location: $configFile"
    Write-InfoMessage "You can now edit this file with your preferred values"
}

function Show-Configuration {
    Write-Section "Current Configuration"
    
    Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })
    
    Write-Host ""
    Write-InfoMessage "Configuration Values:"
    Write-Host "  Resource Group:      $($script:Config.ResourceGroup)"
    Write-Host "  Location:            $($script:Config.Location)"
    Write-Host "  App Name:            $($script:Config.AppName)"
    Write-Host "  Storage Account:     $($script:Config.StorageAccountName)"
    Write-Host "  Managed Identity:    $($script:Config.ManagedIdentityName)"
    Write-Host "  Static Web App:      $($script:Config.StaticWebAppName)"
    Write-Host "  Static Web App SKU:  $($script:Config.StaticWebAppSku)"
    Write-Host "  Web App URL:         $($script:Config.WebAppUrl)"
    Write-Host "  Use Managed ID:      $($script:Config.UseManagedIdentity)"
    Write-Host ""
    
    $configFile = if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile }
    if (Test-Path $configFile) {
        Write-InfoMessage "Configuration file: $configFile"
    }
    else {
        Write-InfoMessage "No configuration file found (using defaults)"
    }
}

################################################################################
# DEPLOYMENT EXECUTION
################################################################################

function Invoke-DeploymentScript {
    param(
        [string]$ScriptName,
        [string]$Description,
        [hashtable]$Parameters = @{}
    )
    
    $scriptPath = Join-Path $ScriptDir $ScriptName
    
    if (-not (Test-Path $scriptPath)) {
        Write-ErrorMessage "Script not found: $scriptPath"
        return $false
    }
    
    Write-Section "Executing: $ScriptName"
    Write-InfoMessage "Description: $Description"
    Write-Host ""
    
    if ($DryRun) {
        Write-InfoMessage "DRY RUN: Would execute $ScriptName"
        return $true
    }
    
    try {
        & $scriptPath @Parameters
        Write-SuccessMessage "$ScriptName completed successfully"
        return $true
    }
    catch {
        Write-ErrorMessage "$ScriptName failed: $_"
        return $false
    }
}

function Start-Deployment {
    Write-Section "Starting Deployment"
    
    if ($DryRun) {
        Write-WarningMessage "DRY RUN MODE - No resources will be created"
    }
    
    Write-Host ""
    Write-InfoMessage "Deployment Plan:"
    if ($Identity -or $All) { Write-Host "  ✓ Managed Identity" }
    if ($Storage -or $All) { Write-Host "  ✓ Storage Account" }
    if ($Tables -or $All) { Write-Host "  ✓ Tables (UserSettings, ProUsers)" }
    if ($Auth -or $All) { Write-Host "  ✓ App Registration" }
    if ($WebApp -or $All) { Write-Host "  ✓ Static Web App" }
    Write-Host ""
    
    if (-not $DryRun) {
        $response = Read-Host "Do you want to proceed with deployment? (y/N)"
        if ($response -notmatch "^[Yy]$") {
            Write-InfoMessage "Deployment cancelled"
            return
        }
    }
    
    $failedCount = 0
    
    # Execute scripts in order based on selections
    if ($Identity -or $All) {
        if (-not (Invoke-DeploymentScript -ScriptName "deploy-azure-managed-identity.ps1" -Description "Create user-assigned managed identity")) {
            $failedCount++
        }
    }
    
    if ($Storage -or $All) {
        $params = @{}
        if ($script:Config.UseManagedIdentity -eq "true") {
            $params.UseManagedIdentity = $true
        }
        if (-not (Invoke-DeploymentScript -ScriptName "deploy-azure-storage-account.ps1" -Description "Create storage account" -Parameters $params)) {
            $failedCount++
        }
    }
    
    if ($Tables -or $All) {
        if (-not (Invoke-DeploymentScript -ScriptName "deploy-azure-user-settings-table.ps1" -Description "Create UserSettings table")) {
            $failedCount++
        }
        if (-not (Invoke-DeploymentScript -ScriptName "deploy-azure-pro-users-table.ps1" -Description "Create ProUsers table")) {
            $failedCount++
        }
    }
    
    if ($Auth -or $All) {
        if (-not (Invoke-DeploymentScript -ScriptName "deploy-azure-app-registration.ps1" -Description "Configure Microsoft authentication")) {
            $failedCount++
        }
    }
    
    if ($WebApp -or $All) {
        $params = @{
            Sku = $script:Config.StaticWebAppSku
        }
        if ($script:Config.UseManagedIdentity -eq "true") {
            $params.ManagedIdentity = $true
        }
        if (-not (Invoke-DeploymentScript -ScriptName "deploy-azure-static-web-app.ps1" -Description "Create Static Web App" -Parameters $params)) {
            $failedCount++
        }
    }
    
    # Display final summary
    Write-Section "Deployment Summary"
    
    if ($failedCount -eq 0) {
        Write-SuccessMessage "All deployments completed successfully!"
    }
    else {
        Write-WarningMessage "$failedCount deployment(s) failed"
        Write-InfoMessage "Check the logs above for details"
    }
}

################################################################################
# MAIN EXECUTION
################################################################################

# Display header
Write-Section "Azure Master Deployment Script v$ScriptVersion"
Write-InfoMessage "GlookoDataWebApp Infrastructure Deployment"
Write-Host ""

# Handle utility actions
if ($CreateConfig) {
    New-ConfigurationInteractive
    exit 0
}

# Load configuration
Load-Config -ConfigFile $(if ($ConfigFile) { $ConfigFile } else { $script:DefaultConfigFile })

if ($ShowConfig) {
    Show-Configuration
    if (-not $DryRun) {
        exit 0
    }
}

# Set all flags if -All is specified
if ($All) {
    $Identity = $true
    $Storage = $true
    $Tables = $true
    $Auth = $true
    $WebApp = $true
}

# Check if any deployment is selected
if (-not ($Identity -or $Storage -or $Tables -or $Auth -or $WebApp)) {
    Write-WarningMessage "No deployment components selected"
    Write-InfoMessage "Use -All or specify individual components (-Identity, -Storage, etc.)"
    Write-InfoMessage "Use -Help for more information"
    exit 0
}

# Run prerequisite checks
if (-not $DryRun) {
    Test-Prerequisites
}

# Run deployment
Start-Deployment

Write-Section "Deployment Complete"
Write-SuccessMessage "All operations completed!"
Write-InfoMessage "Check the output above for resource details"
