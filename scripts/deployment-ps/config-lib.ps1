################################################################################
# Configuration Library for Azure Deployment Scripts (PowerShell)
# 
# This library provides shared configuration management functionality that can
# be dot-sourced by deployment scripts. It handles:
#   - Loading configuration from JSON files
#   - Command-line parameter parsing
#   - Configuration precedence (params > env vars > config file > defaults)
#   - Helper functions for common tasks
#
# Usage:
#   . ./config-lib.ps1
#   Load-Config
#   # Now use $Config hashtable in your script
#
################################################################################

#Requires -Version 7.0

# Default configuration file location
$script:DefaultConfigDir = Join-Path $HOME ".glookodata"
$script:DefaultConfigFile = Join-Path $script:DefaultConfigDir "config.json"

################################################################################
# HELPER FUNCTIONS
################################################################################

# Print colored messages
function Write-InfoMessage {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-SuccessMessage {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-WarningMessage {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Print section header
function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host ("=" * 70) -ForegroundColor Blue
    Write-Host ""
}

################################################################################
# CONFIGURATION FUNCTIONS
################################################################################

# Get value from JSON config file
function Get-ConfigValue {
    param(
        [string]$Key,
        [string]$DefaultValue = "",
        [string]$ConfigFile = $script:DefaultConfigFile
    )
    
    if (Test-Path $ConfigFile) {
        try {
            $configData = Get-Content $ConfigFile -Raw | ConvertFrom-Json
            $value = $configData.$Key
            if ($null -ne $value -and $value -ne "") {
                return $value
            }
        }
        catch {
            Write-Verbose "Failed to read config value for $Key : $_"
        }
    }
    
    return $DefaultValue
}

# Load configuration with precedence: params > env vars > config file > defaults
# Sets $script:Config hashtable for use in scripts
function Load-Config {
    param(
        [string]$ConfigFile = $script:DefaultConfigFile
    )
    
    Write-Section "Loading Configuration"
    
    if (Test-Path $ConfigFile) {
        Write-SuccessMessage "Found local configuration: $ConfigFile"
    }
    else {
        Write-InfoMessage "No local configuration found (checked: $ConfigFile)"
        Write-InfoMessage "Using default values from script"
    }
    
    # Initialize config hashtable
    $script:Config = @{}
    
    # Load configuration values with precedence handling
    # Format: Check env var, then config file, then default
    
    $script:Config.ResourceGroup = if ($env:RESOURCE_GROUP) { $env:RESOURCE_GROUP } 
        else { Get-ConfigValue "resourceGroup" "glookodatawebapp-rg" $ConfigFile }
    
    $script:Config.Location = if ($env:LOCATION) { $env:LOCATION }
        else { Get-ConfigValue "location" "eastus" $ConfigFile }
    
    $script:Config.AppName = if ($env:APP_NAME) { $env:APP_NAME }
        else { Get-ConfigValue "appName" "glookodatawebapp" $ConfigFile }
    
    $script:Config.StorageAccountName = if ($env:STORAGE_ACCOUNT_NAME) { $env:STORAGE_ACCOUNT_NAME }
        else { Get-ConfigValue "storageAccountName" "glookodatawebappstorage" $ConfigFile }
    
    $script:Config.ManagedIdentityName = if ($env:MANAGED_IDENTITY_NAME) { $env:MANAGED_IDENTITY_NAME }
        else { Get-ConfigValue "managedIdentityName" "glookodatawebapp-identity" $ConfigFile }
    
    $script:Config.StaticWebAppName = if ($env:STATIC_WEB_APP_NAME) { $env:STATIC_WEB_APP_NAME }
        else { Get-ConfigValue "staticWebAppName" "glookodatawebapp-swa" $ConfigFile }
    
    $script:Config.StaticWebAppSku = if ($env:STATIC_WEB_APP_SKU) { $env:STATIC_WEB_APP_SKU }
        else { Get-ConfigValue "staticWebAppSku" "Free" $ConfigFile }
    
    $script:Config.WebAppUrl = if ($env:WEB_APP_URL) { $env:WEB_APP_URL }
        else { Get-ConfigValue "webAppUrl" "https://glooko.iric.online" $ConfigFile }
    
    $script:Config.AppRegistrationName = if ($env:APP_REGISTRATION_NAME) { $env:APP_REGISTRATION_NAME }
        else { Get-ConfigValue "appRegistrationName" "GlookoDataWebApp" $ConfigFile }
    
    $script:Config.SignInAudience = if ($env:SIGN_IN_AUDIENCE) { $env:SIGN_IN_AUDIENCE }
        else { Get-ConfigValue "signInAudience" "PersonalMicrosoftAccount" $ConfigFile }
    
    $script:Config.UseManagedIdentity = if ($env:USE_MANAGED_IDENTITY) { $env:USE_MANAGED_IDENTITY }
        else { Get-ConfigValue "useManagedIdentity" "true" $ConfigFile }
    
    # Build tags hashtable
    $script:Config.Tags = @{
        Application = $script:Config.AppName
        Environment = "Production"
        ManagedBy = "AzureDeploymentScripts"
    }
    
    Write-InfoMessage "Configuration loaded:"
    Write-InfoMessage "  Resource Group: $($script:Config.ResourceGroup)"
    Write-InfoMessage "  Location: $($script:Config.Location)"
    Write-InfoMessage "  App Name: $($script:Config.AppName)"
    Write-InfoMessage "  Use Managed Identity: $($script:Config.UseManagedIdentity)"
}

# Create config directory if it doesn't exist
function Initialize-ConfigDirectory {
    if (-not (Test-Path $script:DefaultConfigDir)) {
        Write-InfoMessage "Creating configuration directory: $script:DefaultConfigDir"
        New-Item -ItemType Directory -Path $script:DefaultConfigDir -Force | Out-Null
    }
}

# Save configuration to local file
function Save-ConfigValue {
    param(
        [string]$Key,
        [string]$Value,
        [string]$ConfigFile = $script:DefaultConfigFile
    )
    
    Initialize-ConfigDirectory
    
    # Create empty config if it doesn't exist
    if (-not (Test-Path $ConfigFile)) {
        @{} | ConvertTo-Json | Set-Content $ConfigFile
    }
    
    try {
        $configData = Get-Content $ConfigFile -Raw | ConvertFrom-Json -AsHashtable
        $configData[$Key] = $Value
        $configData | ConvertTo-Json | Set-Content $ConfigFile
        return $true
    }
    catch {
        Write-ErrorMessage "Failed to save config value: $_"
        return $false
    }
}

################################################################################
# AZURE VALIDATION FUNCTIONS
################################################################################

# Check if Azure CLI is installed
function Test-AzureCli {
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-ErrorMessage "Azure CLI is not installed or not in PATH"
        Write-InfoMessage "Please install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli"
        return $false
    }
    Write-SuccessMessage "Azure CLI is available"
    return $true
}

# Check if user is logged in
function Test-AzureLogin {
    Write-InfoMessage "Checking Azure login status..."
    
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if (-not $account) {
            Write-ErrorMessage "Not logged in to Azure"
            Write-InfoMessage "Please run 'az login' first"
            return $false
        }
        
        Write-SuccessMessage "Logged in to Azure"
        Write-InfoMessage "Account: $($account.name)"
        Write-InfoMessage "Subscription ID: $($account.id)"
        return $true
    }
    catch {
        Write-ErrorMessage "Not logged in to Azure"
        Write-InfoMessage "Please run 'az login' first"
        return $false
    }
}

# Run all prerequisite checks
function Test-Prerequisites {
    Write-Section "Checking Prerequisites"
    
    if (-not (Test-AzureCli)) {
        exit 1
    }
    
    if (-not (Test-AzureLogin)) {
        exit 1
    }
}

################################################################################
# AZURE RESOURCE FUNCTIONS
################################################################################

# Create resource group if it doesn't exist
function Initialize-ResourceGroup {
    param(
        [string]$ResourceGroupName = $script:Config.ResourceGroup,
        [string]$Location = $script:Config.Location
    )
    
    Write-InfoMessage "Checking if resource group exists: $ResourceGroupName"
    
    $exists = az group show --name $ResourceGroupName 2>$null
    if ($exists) {
        Write-SuccessMessage "Resource group '$ResourceGroupName' already exists"
    }
    else {
        Write-InfoMessage "Creating resource group: $ResourceGroupName"
        $tags = ($script:Config.Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "
        az group create --name $ResourceGroupName --location $Location --tags $tags | Out-Null
        Write-SuccessMessage "Resource group created successfully"
    }
}

# Check if a resource exists
function Test-ResourceExists {
    param(
        [ValidateSet("storage-account", "identity", "staticwebapp")]
        [string]$ResourceType,
        [string]$ResourceName,
        [string]$ResourceGroupName = $script:Config.ResourceGroup
    )
    
    try {
        switch ($ResourceType) {
            "storage-account" {
                $result = az storage account show --name $ResourceName --resource-group $ResourceGroupName 2>$null
            }
            "identity" {
                $result = az identity show --name $ResourceName --resource-group $ResourceGroupName 2>$null
            }
            "staticwebapp" {
                $result = az staticwebapp show --name $ResourceName --resource-group $ResourceGroupName 2>$null
            }
        }
        return $null -ne $result
    }
    catch {
        return $false
    }
}

################################################################################
# MANAGED IDENTITY FUNCTIONS
################################################################################

# Get managed identity client ID
function Get-ManagedIdentityId {
    param(
        [string]$IdentityName = $script:Config.ManagedIdentityName,
        [string]$ResourceGroupName = $script:Config.ResourceGroup
    )
    
    try {
        $identity = az identity show --name $IdentityName --resource-group $ResourceGroupName 2>$null | ConvertFrom-Json
        return $identity.clientId
    }
    catch {
        return $null
    }
}

# Get managed identity principal ID
function Get-ManagedIdentityPrincipalId {
    param(
        [string]$IdentityName = $script:Config.ManagedIdentityName,
        [string]$ResourceGroupName = $script:Config.ResourceGroup
    )
    
    try {
        $identity = az identity show --name $IdentityName --resource-group $ResourceGroupName 2>$null | ConvertFrom-Json
        return $identity.principalId
    }
    catch {
        return $null
    }
}

################################################################################
# HELP AND USAGE
################################################################################

function Show-ConfigHelp {
    @"

Configuration Management:

The scripts support configuration through multiple sources with this precedence:
  1. Command-line parameters (highest priority)
  2. Environment variables
  3. Local configuration file (~/.glookodata/config.json)
  4. Script default values (lowest priority)

Environment Variables:
  All configuration values can be set via environment variables before running:
  
  RESOURCE_GROUP         - Azure resource group name
  LOCATION               - Azure region (e.g., eastus, westus2)
  APP_NAME               - Application base name
  STORAGE_ACCOUNT_NAME   - Storage account name
  MANAGED_IDENTITY_NAME  - Managed identity name
  STATIC_WEB_APP_NAME    - Static Web App name
  USE_MANAGED_IDENTITY   - Use managed identity (true/false)

Example:
  `$env:LOCATION = "westus2"
  ./deploy-azure-storage-account.ps1

Configuration File:
  Create ~/.glookodata/config.json with your custom values.
  See config.template.json for the schema and available options.

"@
}

# Export functions for use in other scripts
Export-ModuleMember -Function @(
    'Write-InfoMessage',
    'Write-SuccessMessage',
    'Write-WarningMessage',
    'Write-ErrorMessage',
    'Write-Section',
    'Get-ConfigValue',
    'Load-Config',
    'Initialize-ConfigDirectory',
    'Save-ConfigValue',
    'Test-AzureCli',
    'Test-AzureLogin',
    'Test-Prerequisites',
    'Initialize-ResourceGroup',
    'Test-ResourceExists',
    'Get-ManagedIdentityId',
    'Get-ManagedIdentityPrincipalId',
    'Show-ConfigHelp'
)
