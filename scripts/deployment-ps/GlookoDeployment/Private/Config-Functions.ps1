function Get-GlookoConfigValue {
    <#
    .SYNOPSIS
    Gets a configuration value from the configuration file.
    
    .PARAMETER Key
    The configuration key to retrieve.
    
    .PARAMETER DefaultValue
    The default value to return if the key is not found.
    
    .PARAMETER ConfigFile
    Path to the configuration file. Defaults to ~/.glookodata/config.json
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Key,
        
        [string]$DefaultValue = "",
        
        [string]$ConfigFile = (Join-Path $HOME ".glookodata" "config.json")
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

function Save-GlookoConfigValue {
    <#
    .SYNOPSIS
    Saves a configuration value to the configuration file.
    
    .PARAMETER Key
    The configuration key to set.
    
    .PARAMETER Value
    The value to save.
    
    .PARAMETER ConfigFile
    Path to the configuration file. Defaults to ~/.glookodata/config.json
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Key,
        
        [Parameter(Mandatory)]
        [string]$Value,
        
        [string]$ConfigFile = (Join-Path $HOME ".glookodata" "config.json")
    )
    
    Initialize-ConfigDirectory
    
    # Create empty config if it doesn't exist
    if (-not (Test-Path $ConfigFile)) {
        @{} | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile
    }
    
    try {
        $configData = Get-Content $ConfigFile -Raw | ConvertFrom-Json -AsHashtable
        $configData[$Key] = $Value
        $configData | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile
        return $true
    }
    catch {
        Write-ErrorMessage "Failed to save config value: $_"
        return $false
    }
}

function Initialize-ConfigDirectory {
    <#
    .SYNOPSIS
    Creates the configuration directory if it doesn't exist.
    #>
    [CmdletBinding()]
    param()
    
    $configDir = Join-Path $HOME ".glookodata"
    
    if (-not (Test-Path $configDir)) {
        Write-InfoMessage "Creating configuration directory: $configDir"
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
}

function Load-GlookoConfig {
    <#
    .SYNOPSIS
    Loads configuration with precedence: params > env vars > config file > defaults.
    
    .PARAMETER ConfigFile
    Path to the configuration file. Defaults to ~/.glookodata/config.json
    
    .OUTPUTS
    Hashtable containing the loaded configuration.
    #>
    [CmdletBinding()]
    param(
        [string]$ConfigFile = (Join-Path $HOME ".glookodata" "config.json")
    )
    
    Write-Section "Loading Configuration"
    
    if (Test-Path $ConfigFile) {
        Write-SuccessMessage "Found local configuration: $ConfigFile"
    }
    else {
        Write-InfoMessage "No local configuration found (checked: $ConfigFile)"
        Write-InfoMessage "Using default values from module"
    }
    
    # Initialize config hashtable
    $config = @{}
    
    # Load configuration values with precedence handling
    $config.ResourceGroup = if ($env:RESOURCE_GROUP) { $env:RESOURCE_GROUP } 
        else { Get-GlookoConfigValue "resourceGroup" "glookodatawebapp-rg" $ConfigFile }
    
    $config.Location = if ($env:LOCATION) { $env:LOCATION }
        else { Get-GlookoConfigValue "location" "eastus" $ConfigFile }
    
    $config.AppName = if ($env:APP_NAME) { $env:APP_NAME }
        else { Get-GlookoConfigValue "appName" "glookodatawebapp" $ConfigFile }
    
    $config.StorageAccountName = if ($env:STORAGE_ACCOUNT_NAME) { $env:STORAGE_ACCOUNT_NAME }
        else { Get-GlookoConfigValue "storageAccountName" "glookodatawebappstorage" $ConfigFile }
    
    $config.ManagedIdentityName = if ($env:MANAGED_IDENTITY_NAME) { $env:MANAGED_IDENTITY_NAME }
        else { Get-GlookoConfigValue "managedIdentityName" "glookodatawebapp-identity" $ConfigFile }
    
    $config.StaticWebAppName = if ($env:STATIC_WEB_APP_NAME) { $env:STATIC_WEB_APP_NAME }
        else { Get-GlookoConfigValue "staticWebAppName" "glookodatawebapp-swa" $ConfigFile }
    
    $config.StaticWebAppSku = if ($env:STATIC_WEB_APP_SKU) { $env:STATIC_WEB_APP_SKU }
        else { Get-GlookoConfigValue "staticWebAppSku" "Free" $ConfigFile }
    
    $config.WebAppUrl = if ($env:WEB_APP_URL) { $env:WEB_APP_URL }
        else { Get-GlookoConfigValue "webAppUrl" "https://glooko.iric.online" $ConfigFile }
    
    $config.AppRegistrationName = if ($env:APP_REGISTRATION_NAME) { $env:APP_REGISTRATION_NAME }
        else { Get-GlookoConfigValue "appRegistrationName" "GlookoDataWebApp" $ConfigFile }
    
    $config.SignInAudience = if ($env:SIGN_IN_AUDIENCE) { $env:SIGN_IN_AUDIENCE }
        else { Get-GlookoConfigValue "signInAudience" "PersonalMicrosoftAccount" $ConfigFile }
    
    $config.UseManagedIdentity = if ($env:USE_MANAGED_IDENTITY) { $env:USE_MANAGED_IDENTITY }
        else { Get-GlookoConfigValue "useManagedIdentity" "true" $ConfigFile }
    
    # Build tags hashtable
    $config.Tags = @{
        Application = $config.AppName
        Environment = "Production"
        ManagedBy = "GlookoDeploymentModule"
    }
    
    Write-InfoMessage "Configuration loaded:"
    Write-InfoMessage "  Resource Group: $($config.ResourceGroup)"
    Write-InfoMessage "  Location: $($config.Location)"
    Write-InfoMessage "  App Name: $($config.AppName)"
    Write-InfoMessage "  Use Managed Identity: $($config.UseManagedIdentity)"
    
    return $config
}
