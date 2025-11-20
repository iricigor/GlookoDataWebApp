function Set-GlookoAppRegistration {
    <#
    .SYNOPSIS
    Creates or updates Azure App Registration for GlookoDataWebApp.
    
    .DESCRIPTION
    Creates and configures Azure App Registration for Microsoft authentication
    with appropriate redirect URIs for production and development.
    
    .PARAMETER Name
    App registration display name. If not specified, uses value from configuration.
    
    .PARAMETER WebAppUrl
    Production web application URL. If not specified, uses value from configuration.
    
    .PARAMETER SignInAudience
    Supported account types. If not specified, uses value from configuration.
    Valid values: AzureADMyOrg, AzureADMultipleOrgs, AzureADandPersonalMicrosoftAccount, PersonalMicrosoftAccount
    
    .PARAMETER ConfigFile
    Path to configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Set-GlookoAppRegistration
    
    .EXAMPLE
    Set-GlookoAppRegistration -Name "MyApp" -WebAppUrl "https://myapp.com"
    
    .EXAMPLE
    Set-GlookoAppRegistration -SignInAudience "PersonalMicrosoftAccount"
    
    .OUTPUTS
    Hashtable containing app registration details (appId, tenantId, etc.).
    #>
    [CmdletBinding()]
    param(
        [string]$Name,
        [string]$WebAppUrl,
        [ValidateSet('AzureADMyOrg', 'AzureADMultipleOrgs', 'AzureADandPersonalMicrosoftAccount', 'PersonalMicrosoftAccount')]
        [string]$SignInAudience,
        [string]$ConfigFile
    )
    
    # Load configuration
    $config = if ($ConfigFile) {
        Load-GlookoConfig -ConfigFile $ConfigFile
    } else {
        Load-GlookoConfig
    }
    
    # Override with parameters
    if ($Name) { $config.AppRegistrationName = $Name }
    if ($WebAppUrl) { $config.WebAppUrl = $WebAppUrl }
    if ($SignInAudience) { $config.SignInAudience = $SignInAudience }
    
    # Check prerequisites
    if (-not (Test-AzurePrerequisites)) {
        throw "Prerequisites not met. Please ensure Azure CLI is installed and you are logged in."
    }
    
    Write-Section "Creating Azure App Registration"
    
    $appName = $config.AppRegistrationName
    $webAppUrl = $config.WebAppUrl
    $audience = if ($config.SignInAudience) { $config.SignInAudience } else { "PersonalMicrosoftAccount" }
    
    Write-InfoMessage "Checking if app registration exists: $appName"
    $existingApp = az ad app list --display-name $appName --query "[0]" 2>$null | ConvertFrom-Json
    
    $appId = $null
    $appExists = $false
    
    if ($existingApp) {
        Write-WarningMessage "App registration '$appName' already exists"
        $appId = $existingApp.appId
        $appExists = $true
    }
    else {
        Write-InfoMessage "Creating app registration: $appName"
        Write-InfoMessage "Sign-in audience: $audience"
        
        # Create app registration with redirect URIs
        $redirectUris = @(
            "$webAppUrl/.auth/login/aad/callback",
            "http://localhost:5173/.auth/login/aad/callback"
        )
        
        try {
            $app = az ad app create `
                --display-name $appName `
                --sign-in-audience $audience `
                --web-redirect-uris $redirectUris[0] $redirectUris[1] 2>$null | ConvertFrom-Json
            
            $appId = $app.appId
            Write-SuccessMessage "App registration created successfully"
        }
        catch {
            throw "Failed to create app registration: $_"
        }
    }
    
    # Get tenant ID
    Write-InfoMessage "Getting tenant information..."
    $tenantId = az account show --query tenantId -o tsv 2>$null
    
    if (-not $tenantId) {
        throw "Failed to get tenant ID"
    }
    
    # Display summary
    Write-Section "Deployment Summary"
    
    Write-SuccessMessage "Azure App Registration configured successfully!"
    Write-Host ""
    Write-InfoMessage "App Registration Details:"
    Write-Host "  - Name: $appName"
    Write-Host "  - Application (Client) ID: $appId"
    Write-Host "  - Tenant ID: $tenantId"
    Write-Host "  - Sign-in Audience: $audience"
    Write-Host ""
    Write-InfoMessage "Redirect URIs:"
    Write-Host "  - Production: $webAppUrl/.auth/login/aad/callback"
    Write-Host "  - Development: http://localhost:5173/.auth/login/aad/callback"
    Write-Host ""
    
    if ($appExists) {
        Write-InfoMessage "Note: App registration already existed (not created)"
    }
    
    Write-InfoMessage "Next Steps:"
    Write-Host "  1. Add these values to your Static Web App configuration:"
    Write-Host "     AZURE_CLIENT_ID=$appId"
    Write-Host "     AZURE_TENANT_ID=$tenantId"
    Write-Host ""
    
    # Return app registration details
    return @{
        Name = $appName
        AppId = $appId
        TenantId = $tenantId
        SignInAudience = $audience
        WebAppUrl = $webAppUrl
        Existed = $appExists
    }
}

# Alias: Set-GAR (Set-GlookoAppRegistration)
New-Alias -Name Set-GAR -Value Set-GlookoAppRegistration -Force
