function Invoke-GlookoDeployment {
    <#
    .SYNOPSIS
    Master orchestration function for deploying GlookoDataWebApp Azure resources.
    
    .DESCRIPTION
    Orchestrates the deployment of all Azure resources for GlookoDataWebApp with
    centralized configuration management.
    
    .PARAMETER All
    Deploy all resources (identity, storage, tables, authentication, web app).
    
    .PARAMETER Identity
    Deploy managed identity only.
    
    .PARAMETER Storage
    Deploy storage account only.
    
    .PARAMETER Tables
    Deploy tables (UserSettings, ProUsers) only.
    
    .PARAMETER Auth
    Deploy app registration for authentication only.
    
    .PARAMETER WebApp
    Deploy static web app only.
    
    .PARAMETER ConfigFile
    Path to configuration file. Defaults to ~/.glookodata/config.json
    
    .PARAMETER WhatIf
    Show what would be deployed without actually deploying.
    
    .EXAMPLE
    Invoke-GlookoDeployment -All
    
    .EXAMPLE
    Invoke-GlookoDeployment -Identity -Storage
    
    .EXAMPLE
    Invoke-GlookoDeployment -All -WhatIf
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [switch]$All,
        [switch]$Identity,
        [switch]$Storage,
        [switch]$Tables,
        [switch]$Auth,
        [switch]$WebApp,
        [string]$ConfigFile
    )
    
    Write-Section "Glooko Deployment Orchestration"
    
    # Load configuration
    $config = if ($ConfigFile) {
        Load-GlookoConfig -ConfigFile $ConfigFile
    } else {
        Load-GlookoConfig
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
        return
    }
    
    if ($WhatIf) {
        Write-WarningMessage "WhatIf mode - No resources will be created"
    }
    
    Write-Host ""
    Write-InfoMessage "Deployment Plan:"
    if ($Identity) { Write-Host "  ✓ Managed Identity" }
    if ($Storage) { Write-Host "  ✓ Storage Account" }
    if ($Tables) { Write-Host "  ✓ Tables (UserSettings, ProUsers)" }
    if ($Auth) { Write-Host "  ✓ App Registration" }
    if ($WebApp) { Write-Host "  ✓ Static Web App" }
    Write-Host ""
    
    if (-not $WhatIf) {
        $response = Read-Host "Do you want to proceed with deployment? (y/N)"
        if ($response -notmatch "^[Yy]$") {
            Write-InfoMessage "Deployment cancelled"
            return
        }
    }
    
    $results = @{}
    
    # Execute deployments in order
    if ($Identity) {
        Write-Section "Deploying Managed Identity"
        if ($WhatIf) {
            Write-InfoMessage "Would deploy managed identity: $($config.ManagedIdentityName)"
        } else {
            try {
                $results.Identity = Set-GlookoManagedIdentity -ConfigFile $ConfigFile
                Write-SuccessMessage "Managed identity deployment completed"
            } catch {
                Write-ErrorMessage "Managed identity deployment failed: $_"
                $results.Identity = @{ Error = $_.Exception.Message }
            }
        }
    }
    
    if ($Storage) {
        Write-Section "Deploying Storage Account"
        if ($WhatIf) {
            Write-InfoMessage "Would deploy storage account: $($config.StorageAccountName)"
        } else {
            try {
                $params = @{ ConfigFile = $ConfigFile }
                if ($config.UseManagedIdentity -eq "true") {
                    $params.UseManagedIdentity = $true
                }
                $results.Storage = Set-GlookoStorageAccount @params
                Write-SuccessMessage "Storage account deployment completed"
            } catch {
                Write-ErrorMessage "Storage account deployment failed: $_"
                $results.Storage = @{ Error = $_.Exception.Message }
            }
        }
    }
    
    if ($Tables) {
        Write-Section "Deploying Storage Tables"
        if ($WhatIf) {
            Write-InfoMessage "Would deploy storage tables: UserSettings, ProUsers"
        } else {
            try {
                $results.Tables = Set-GlookoTableStorage -ConfigFile $ConfigFile
                Write-SuccessMessage "Storage tables deployment completed"
            } catch {
                Write-ErrorMessage "Storage tables deployment failed: $_"
                $results.Tables = @{ Error = $_.Exception.Message }
            }
        }
    }
    
    if ($Auth) {
        Write-Section "Deploying App Registration"
        if ($WhatIf) {
            Write-InfoMessage "Would deploy app registration: $($config.AppRegistrationName)"
        } else {
            try {
                $results.Auth = Set-GlookoAppRegistration -ConfigFile $ConfigFile
                Write-SuccessMessage "App registration deployment completed"
            } catch {
                Write-ErrorMessage "App registration deployment failed: $_"
                $results.Auth = @{ Error = $_.Exception.Message }
            }
        }
    }
    
    if ($WebApp) {
        Write-Section "Deploying Static Web App"
        if ($WhatIf) {
            Write-InfoMessage "Would deploy static web app: $($config.StaticWebAppName)"
        } else {
            try {
                $params = @{ ConfigFile = $ConfigFile }
                if ($config.UseManagedIdentity -eq "true" -and $config.StaticWebAppSku -eq "Standard") {
                    $params.AssignManagedIdentity = $true
                }
                $results.WebApp = Set-GlookoStaticWebApp @params
                Write-SuccessMessage "Static web app deployment completed"
            } catch {
                Write-ErrorMessage "Static web app deployment failed: $_"
                $results.WebApp = @{ Error = $_.Exception.Message }
            }
        }
    }
    
    # Display final summary
    Write-Section "Deployment Summary"
    
    $failureCount = ($results.Values | Where-Object { $_.Error }).Count
    
    if ($WhatIf) {
        Write-InfoMessage "WhatIf mode - no changes were made"
    }
    elseif ($failureCount -eq 0) {
        Write-SuccessMessage "All deployments completed successfully!"
    }
    else {
        Write-WarningMessage "$failureCount deployment(s) failed"
        Write-InfoMessage "Check the logs above for details"
    }
    
    return $results
}

# Alias: Invoke-GD (Invoke-GlookoDeployment)
New-Alias -Name Invoke-GD -Value Invoke-GlookoDeployment -Force
