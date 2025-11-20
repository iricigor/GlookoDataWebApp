function Get-GlookoConfig {
    <#
    .SYNOPSIS
    Retrieves the current Glooko deployment configuration.
    
    .DESCRIPTION
    Loads and returns the configuration for Glooko deployments. Configuration is loaded
    with the following precedence: environment variables > config file > defaults.
    
    .PARAMETER ConfigFile
    Path to a custom configuration file. If not specified, uses ~/.glookodata/config.json
    
    .EXAMPLE
    Get-GlookoConfig
    
    .EXAMPLE
    Get-GlookoConfig -ConfigFile ~/my-custom-config.json
    
    .OUTPUTS
    Hashtable containing the configuration values.
    #>
    [CmdletBinding()]
    param(
        [string]$ConfigFile
    )
    
    if ($ConfigFile) {
        return Load-GlookoConfig -ConfigFile $ConfigFile
    }
    else {
        return Load-GlookoConfig
    }
}

# Alias: Get-GC
New-Alias -Name Get-GC -Value Get-GlookoConfig -Force

function Set-GlookoConfig {
    <#
    .SYNOPSIS
    Sets configuration values for Glooko deployments.
    
    .DESCRIPTION
    Saves configuration values to the local configuration file (~/.glookodata/config.json).
    
    .PARAMETER ResourceGroup
    Azure resource group name.
    
    .PARAMETER Location
    Azure region (e.g., eastus, westus2).
    
    .PARAMETER AppName
    Application base name.
    
    .PARAMETER StorageAccountName
    Storage account name (must be globally unique).
    
    .PARAMETER ManagedIdentityName
    User-assigned managed identity name.
    
    .PARAMETER StaticWebAppName
    Static Web App name.
    
    .PARAMETER StaticWebAppSku
    Static Web App SKU (Free or Standard).
    
    .PARAMETER WebAppUrl
    Production web application URL.
    
    .PARAMETER AppRegistrationName
    Azure App Registration display name.
    
    .PARAMETER SignInAudience
    Supported account types for authentication.
    
    .PARAMETER UseManagedIdentity
    Use managed identity for authentication (true/false).
    
    .PARAMETER ConfigFile
    Path to the configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Set-GlookoConfig -Location "westus2" -ResourceGroup "my-rg"
    
    .EXAMPLE
    Set-GlookoConfig -StorageAccountName "mystorageacct" -UseManagedIdentity "true"
    #>
    [CmdletBinding()]
    param(
        [string]$ResourceGroup,
        [string]$Location,
        [string]$AppName,
        [string]$StorageAccountName,
        [string]$ManagedIdentityName,
        [string]$StaticWebAppName,
        [ValidateSet('Free', 'Standard')]
        [string]$StaticWebAppSku,
        [string]$WebAppUrl,
        [string]$AppRegistrationName,
        [ValidateSet('AzureADMyOrg', 'AzureADMultipleOrgs', 'AzureADandPersonalMicrosoftAccount', 'PersonalMicrosoftAccount')]
        [string]$SignInAudience,
        [ValidateSet('true', 'false')]
        [string]$UseManagedIdentity,
        [string]$ConfigFile
    )
    
    Initialize-ConfigDirectory
    
    $configPath = if ($ConfigFile) { $ConfigFile } else { Join-Path $HOME ".glookodata" "config.json" }
    
    # Create empty config if it doesn't exist
    if (-not (Test-Path $configPath)) {
        @{} | ConvertTo-Json -Depth 10 | Set-Content $configPath
    }
    
    # Load existing config
    $config = Get-Content $configPath -Raw | ConvertFrom-Json -AsHashtable
    
    # Update values that were provided
    if ($ResourceGroup) { $config.resourceGroup = $ResourceGroup }
    if ($Location) { $config.location = $Location }
    if ($AppName) { $config.appName = $AppName }
    if ($StorageAccountName) { $config.storageAccountName = $StorageAccountName }
    if ($ManagedIdentityName) { $config.managedIdentityName = $ManagedIdentityName }
    if ($StaticWebAppName) { $config.staticWebAppName = $StaticWebAppName }
    if ($StaticWebAppSku) { $config.staticWebAppSku = $StaticWebAppSku }
    if ($WebAppUrl) { $config.webAppUrl = $WebAppUrl }
    if ($AppRegistrationName) { $config.appRegistrationName = $AppRegistrationName }
    if ($SignInAudience) { $config.signInAudience = $SignInAudience }
    if ($UseManagedIdentity) { $config.useManagedIdentity = ($UseManagedIdentity -eq 'true') }
    
    # Save updated config
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    
    Write-SuccessMessage "Configuration saved to: $configPath"
    
    # Display updated configuration
    Write-InfoMessage "Current configuration:"
    $config.GetEnumerator() | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)"
    }
}

# Alias: Set-GC
New-Alias -Name Set-GC -Value Set-GlookoConfig -Force

function Test-GlookoConfig {
    <#
    .SYNOPSIS
    Validates the Glooko deployment configuration.
    
    .DESCRIPTION
    Checks if the configuration file exists and contains valid values.
    
    .PARAMETER ConfigFile
    Path to the configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Test-GlookoConfig
    
    .OUTPUTS
    Boolean indicating if the configuration is valid.
    #>
    [CmdletBinding()]
    param(
        [string]$ConfigFile
    )
    
    $configPath = if ($ConfigFile) { $ConfigFile } else { Join-Path $HOME ".glookodata" "config.json" }
    
    Write-Section "Validating Configuration"
    
    if (-not (Test-Path $configPath)) {
        Write-WarningMessage "Configuration file not found: $configPath"
        Write-InfoMessage "Run 'Initialize-GlookoConfig' to create a configuration file"
        return $false
    }
    
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        
        Write-SuccessMessage "Configuration file is valid JSON"
        Write-InfoMessage "Configuration location: $configPath"
        
        # Check for required fields
        $requiredFields = @('resourceGroup', 'location', 'appName')
        $missingFields = @()
        
        foreach ($field in $requiredFields) {
            if (-not $config.$field) {
                $missingFields += $field
            }
        }
        
        if ($missingFields.Count -gt 0) {
            Write-WarningMessage "Missing required fields: $($missingFields -join ', ')"
            return $false
        }
        
        Write-SuccessMessage "All required fields are present"
        return $true
    }
    catch {
        Write-ErrorMessage "Invalid configuration file: $_"
        return $false
    }
}

# Alias: Test-GC
New-Alias -Name Test-GC -Value Test-GlookoConfig -Force

function Initialize-GlookoConfig {
    <#
    .SYNOPSIS
    Creates a new Glooko deployment configuration file.
    
    .DESCRIPTION
    Creates a configuration file with default values at ~/.glookodata/config.json
    
    .PARAMETER Force
    Overwrites existing configuration file if it exists.
    
    .PARAMETER ConfigFile
    Path to the configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Initialize-GlookoConfig
    
    .EXAMPLE
    Initialize-GlookoConfig -Force
    #>
    [CmdletBinding()]
    param(
        [switch]$Force,
        [string]$ConfigFile
    )
    
    Write-Section "Creating Configuration File"
    
    Initialize-ConfigDirectory
    
    $configPath = if ($ConfigFile) { $ConfigFile } else { Join-Path $HOME ".glookodata" "config.json" }
    
    if ((Test-Path $configPath) -and -not $Force) {
        Write-WarningMessage "Configuration file already exists: $configPath"
        Write-InfoMessage "Use -Force to overwrite, or use Set-GlookoConfig to update values"
        return
    }
    
    Write-InfoMessage "Creating configuration file: $configPath"
    
    # Create default configuration
    $defaultConfig = @{
        resourceGroup = "glookodatawebapp-rg"
        location = "eastus"
        appName = "glookodatawebapp"
        storageAccountName = "glookodatawebappstorage"
        managedIdentityName = "glookodatawebapp-identity"
        staticWebAppName = "glookodatawebapp-swa"
        staticWebAppSku = "Free"
        useManagedIdentity = $true
        webAppUrl = "https://glooko.iric.online"
        appRegistrationName = "GlookoDataWebApp"
        signInAudience = "PersonalMicrosoftAccount"
    }
    
    $defaultConfig | ConvertTo-Json -Depth 10 | Set-Content $configPath
    
    Write-SuccessMessage "Configuration file created successfully"
    Write-InfoMessage "Location: $configPath"
    Write-InfoMessage "You can now edit this file or use Set-GlookoConfig to customize values"
}

# Alias: Initialize-GC
New-Alias -Name Initialize-GC -Value Initialize-GlookoConfig -Force
