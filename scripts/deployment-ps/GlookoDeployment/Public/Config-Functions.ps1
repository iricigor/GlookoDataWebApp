#Requires -Version 7.4

<#
.SYNOPSIS
    Configuration management functions for GlookoDeployment module

.DESCRIPTION
    Functions for managing deployment configuration stored at ~/.glookodata/config.json
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
#>

# Configuration file location
$script:ConfigDir = Join-Path $HOME ".glookodata"
$script:ConfigPath = Join-Path $script:ConfigDir "config.json"

# Default configuration values
$script:DefaultConfig = @{
    resourceGroup             = "glookodatawebapp-rg"
    location                  = "eastus"
    appName                   = "glookodatawebapp"
    storageAccountName        = "glookodatawebappstorage"
    managedIdentityName       = "glookodatawebapp-identity"
    staticWebAppName          = "glookodatawebapp-swa"
    staticWebAppSku           = "Standard"
    keyVaultName              = "glookodatawebapp-kv"
    functionAppName           = "glookodatawebapp-func"
    webAppUrl                 = "https://glooko.iric.online"
    appRegistrationName       = "GlookoDataWebApp"
    appRegistrationClientId   = ""
    signInAudience            = "PersonalMicrosoftAccount"
    useManagedIdentity        = $true
    tags                      = @{
        Application = "GlookoDataWebApp"
        Environment = "Production"
        ManagedBy   = "AzureDeploymentScripts"
    }
}

function Get-GlookoConfig {
    <#
    .SYNOPSIS
        Gets the current GlookoDataWebApp deployment configuration.
    
    .DESCRIPTION
        Retrieves the deployment configuration from the local configuration file.
        If no configuration file exists, returns default values.
    
    .PARAMETER Property
        Optional. Get a specific property value instead of the entire configuration.
    
    .EXAMPLE
        Get-GlookoConfig
        Returns the complete configuration object.
    
    .EXAMPLE
        Get-GlookoConfig -Property resourceGroup
        Returns just the resourceGroup value.
    
    .NOTES
        Configuration is stored at ~/.glookodata/config.json
    #>
    [CmdletBinding()]
    [Alias("Get-GC")]
    param(
        [Parameter()]
        [string]$Property
    )
    
    $config = $script:DefaultConfig.Clone()
    
    if (Test-Path $script:ConfigPath) {
        try {
            $fileConfig = Get-Content $script:ConfigPath -Raw | ConvertFrom-Json -AsHashtable
            foreach ($key in $fileConfig.Keys) {
                $config[$key] = $fileConfig[$key]
            }
        }
        catch {
            Write-WarningMessage "Failed to read configuration file: $_"
        }
    }
    
    if ($Property) {
        if ($config.ContainsKey($Property)) {
            return $config[$Property]
        }
        else {
            Write-WarningMessage "Property '$Property' not found in configuration"
            return $null
        }
    }
    
    return $config
}

function Set-GlookoConfig {
    <#
    .SYNOPSIS
        Sets GlookoDataWebApp deployment configuration values.
    
    .DESCRIPTION
        Updates the local configuration file with the specified values.
        Values not specified are preserved from the existing configuration.
    
    .PARAMETER ResourceGroup
        The Azure resource group name.
    
    .PARAMETER Location
        The Azure region for resources.
    
    .PARAMETER FunctionAppName
        The name for the Azure Function App.
    
    .PARAMETER StorageAccountName
        The name for the Azure Storage Account.
    
    .PARAMETER KeyVaultName
        The name for the Azure Key Vault.
    
    .PARAMETER ManagedIdentityName
        The name for the User-Assigned Managed Identity.
    
    .PARAMETER UseManagedIdentity
        Whether to use managed identity for authentication.
    
    .EXAMPLE
        Set-GlookoConfig -Location "westus2"
        Sets the location to West US 2.
    
    .EXAMPLE
        Set-GlookoConfig -FunctionAppName "myfunction" -ResourceGroup "myrg"
        Sets both the function app name and resource group.
    #>
    [CmdletBinding()]
    [Alias("Set-GC")]
    param(
        [Parameter()]
        [string]$ResourceGroup,
        
        [Parameter()]
        [string]$Location,
        
        [Parameter()]
        [string]$AppName,
        
        [Parameter()]
        [string]$FunctionAppName,
        
        [Parameter()]
        [string]$StorageAccountName,
        
        [Parameter()]
        [string]$KeyVaultName,
        
        [Parameter()]
        [string]$ManagedIdentityName,
        
        [Parameter()]
        [string]$StaticWebAppName,
        
        [Parameter()]
        [string]$WebAppUrl,
        
        [Parameter()]
        [bool]$UseManagedIdentity
    )
    
    # Ensure config directory exists
    if (-not (Test-Path $script:ConfigDir)) {
        New-Item -ItemType Directory -Path $script:ConfigDir -Force | Out-Null
        Write-InfoMessage "Created configuration directory: $script:ConfigDir"
    }
    
    # Get current config
    $config = Get-GlookoConfig
    
    # Update values if provided
    if ($ResourceGroup) { $config.resourceGroup = $ResourceGroup }
    if ($Location) { $config.location = $Location }
    if ($AppName) { $config.appName = $AppName }
    if ($FunctionAppName) { $config.functionAppName = $FunctionAppName }
    if ($StorageAccountName) { $config.storageAccountName = $StorageAccountName }
    if ($KeyVaultName) { $config.keyVaultName = $KeyVaultName }
    if ($ManagedIdentityName) { $config.managedIdentityName = $ManagedIdentityName }
    if ($StaticWebAppName) { $config.staticWebAppName = $StaticWebAppName }
    if ($WebAppUrl) { $config.webAppUrl = $WebAppUrl }
    if ($PSBoundParameters.ContainsKey('UseManagedIdentity')) { $config.useManagedIdentity = $UseManagedIdentity }
    
    # Save config
    $config | ConvertTo-Json -Depth 10 | Set-Content $script:ConfigPath
    
    Write-SuccessMessage "Configuration saved to $script:ConfigPath"
    return $config
}

function Test-GlookoConfig {
    <#
    .SYNOPSIS
        Validates the GlookoDataWebApp deployment configuration.
    
    .DESCRIPTION
        Checks that required configuration values are present and valid.
    
    .EXAMPLE
        Test-GlookoConfig
        Validates the current configuration.
    
    .NOTES
        Returns $true if configuration is valid, $false otherwise.
    #>
    [CmdletBinding()]
    [Alias("Test-GC")]
    param()
    
    $config = Get-GlookoConfig
    $isValid = $true
    
    Write-SectionHeader "Validating Configuration"
    
    # Check required values
    $requiredFields = @('resourceGroup', 'location', 'functionAppName', 'storageAccountName', 'appRegistrationClientId')
    
    foreach ($field in $requiredFields) {
        if (-not $config[$field] -or $config[$field] -eq '') {
            Write-ErrorMessage "Missing required configuration: $field"
            $isValid = $false
        }
        else {
            Write-SuccessMessage "$field`: $($config[$field])"
        }
    }
    
    # Validate storage account name (must be 3-24 lowercase alphanumeric)
    if ($config.storageAccountName) {
        if ($config.storageAccountName -notmatch '^[a-z0-9]{3,24}$') {
            Write-ErrorMessage "Storage account name must be 3-24 lowercase letters and numbers only"
            $isValid = $false
        }
    }
    
    # Validate appRegistrationClientId format (must be a valid GUID)
    if ($config.appRegistrationClientId) {
        if ($config.appRegistrationClientId -notmatch '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') {
            Write-ErrorMessage "appRegistrationClientId must be a valid GUID format (e.g., 00000000-0000-0000-0000-000000000000)"
            $isValid = $false
        }
    }
    
    # Validate location - just a helpful hint, not blocking validation
    # Azure adds new regions frequently, so we just show common ones as a reference
    $commonLocations = @('eastus', 'eastus2', 'westus', 'westus2', 'westus3', 'centralus', 
                        'northeurope', 'westeurope', 'uksouth', 'ukwest', 
                        'australiaeast', 'southeastasia', 'japaneast')
    if ($config.location -and $config.location -notin $commonLocations) {
        Write-InfoMessage "Location '$($config.location)' is not in common locations list but may still be valid. Run 'az account list-locations' to see all available locations."
    }
    
    if ($isValid) {
        Write-SuccessMessage "Configuration is valid"
    }
    else {
        Write-ErrorMessage "Configuration validation failed"
    }
    
    return $isValid
}

function Initialize-GlookoConfig {
    <#
    .SYNOPSIS
        Initializes the GlookoDataWebApp deployment configuration with default values.
    
    .DESCRIPTION
        Creates a new configuration file with default values. Existing configuration
        will be overwritten unless -Merge is specified.
    
    .PARAMETER Merge
        Merge defaults with existing configuration instead of overwriting.
    
    .EXAMPLE
        Initialize-GlookoConfig
        Creates a new configuration file with defaults.
    
    .EXAMPLE
        Initialize-GlookoConfig -Merge
        Adds missing default values to existing configuration.
    #>
    [CmdletBinding()]
    [Alias("Initialize-GC")]
    param(
        [Parameter()]
        [switch]$Merge
    )
    
    # Ensure config directory exists
    if (-not (Test-Path $script:ConfigDir)) {
        New-Item -ItemType Directory -Path $script:ConfigDir -Force | Out-Null
        Write-InfoMessage "Created configuration directory: $script:ConfigDir"
    }
    
    if ($Merge -and (Test-Path $script:ConfigPath)) {
        # Merge with existing config
        $existingConfig = Get-Content $script:ConfigPath -Raw | ConvertFrom-Json -AsHashtable
        $config = $script:DefaultConfig.Clone()
        
        foreach ($key in $existingConfig.Keys) {
            $config[$key] = $existingConfig[$key]
        }
    }
    else {
        $config = $script:DefaultConfig.Clone()
    }
    
    # Save config
    $config | ConvertTo-Json -Depth 10 | Set-Content $script:ConfigPath
    
    Write-SuccessMessage "Configuration initialized at $script:ConfigPath"
    return $config
}
