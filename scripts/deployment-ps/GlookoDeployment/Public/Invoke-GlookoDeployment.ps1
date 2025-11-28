#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage, Az.Functions, Az.KeyVault, Az.ManagedServiceIdentity

<#
.SYNOPSIS
    Orchestrates the complete deployment of GlookoDataWebApp Azure infrastructure.

.DESCRIPTION
    This function orchestrates the deployment of all Azure resources needed for
    GlookoDataWebApp. It can deploy individual resources or all resources in the
    correct dependency order.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle

.PARAMETER ManagedIdentity
    Deploy only the User-Assigned Managed Identity.

.PARAMETER FunctionApp
    Deploy only the Azure Function App.

.PARAMETER All
    Deploy all resources in dependency order.

.PARAMETER DryRun
    Show what would be deployed without actually deploying.

.PARAMETER SkipPrerequisites
    Skip prerequisite checks (use with caution).

.EXAMPLE
    Invoke-GlookoDeployment -ManagedIdentity
    Deploys only the User-Assigned Managed Identity.

.EXAMPLE
    Invoke-GlookoDeployment -FunctionApp
    Deploys only the Azure Function App.

.EXAMPLE
    Invoke-GlookoDeployment -All
    Deploys all infrastructure resources.

.EXAMPLE
    Invoke-GlookoDeployment -All -DryRun
    Shows what would be deployed without deploying.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
#>
function Invoke-GlookoDeployment {
    [CmdletBinding()]
    [Alias("Invoke-GD")]
    param(
        [Parameter()]
        [switch]$ManagedIdentity,

        [Parameter()]
        [switch]$FunctionApp,

        [Parameter()]
        [switch]$All,

        [Parameter()]
        [switch]$DryRun,

        [Parameter()]
        [switch]$SkipPrerequisites
    )

    begin {
        Write-SectionHeader "GlookoDataWebApp Infrastructure Deployment"
        
        $config = Get-GlookoConfig
        
        Write-InfoMessage "Resource Group: $($config.resourceGroup)"
        Write-InfoMessage "Location: $($config.location)"
        
        if ($DryRun) {
            Write-WarningMessage "DRY RUN MODE - No changes will be made"
        }
    }

    process {
        try {
            # Check prerequisites
            if (-not $SkipPrerequisites) {
                Write-SectionHeader "Checking Prerequisites"
                
                if (-not (Test-AzureConnection)) {
                    throw "Not connected to Azure. Please run 'Connect-AzAccount'"
                }
                Write-SuccessMessage "Connected to Azure"
                
                # Validate configuration
                if (-not (Test-GlookoConfig)) {
                    throw "Configuration validation failed. Please run Initialize-GlookoConfig"
                }
            }
            
            # Track what will be/was deployed
            $deployedResources = @()
            
            if ($DryRun) {
                Write-SectionHeader "Deployment Plan"
                
                if ($All -or $ManagedIdentity) {
                    Write-InfoMessage "Would deploy: User-Assigned Managed Identity ($($config.managedIdentityName))"
                }
                
                if ($All -or $FunctionApp) {
                    Write-InfoMessage "Would deploy: Azure Function App ($($config.functionAppName))"
                }
                
                Write-Host ""
                Write-InfoMessage "Run without -DryRun to execute deployment"
                return
            }
            
            # Deploy resources in dependency order
            # 1. Managed Identity (needed by other resources)
            if ($All -or $ManagedIdentity) {
                Write-SectionHeader "Deploying User-Assigned Managed Identity"
                $result = Set-GlookoManagedIdentity
                $deployedResources += @{
                    Type   = "Managed Identity"
                    Name   = $result.Name
                    Url    = $null
                    Status = if ($result.Created) { "Created" } else { "Already Existed" }
                }
            }
            
            # 2. Function App (depends on Managed Identity)
            if ($All -or $FunctionApp) {
                Write-SectionHeader "Deploying Azure Function App"
                $result = Set-GlookoAzureFunction -UseManagedIdentity
                $deployedResources += @{
                    Type   = "Function App"
                    Name   = $result.Name
                    Url    = $result.FunctionUrl
                    Status = if ($result.Created) { "Created" } else { "Already Existed" }
                }
            }
            
            # Summary
            Write-SectionHeader "Deployment Summary"
            
            if ($deployedResources.Count -eq 0) {
                Write-WarningMessage "No resources were specified for deployment"
                Write-InfoMessage "Use -ManagedIdentity, -FunctionApp, or -All to deploy resources"
            }
            else {
                Write-SuccessMessage "Deployed $($deployedResources.Count) resource(s)"
                Write-Host ""
                
                foreach ($resource in $deployedResources) {
                    Write-Host "  $($resource.Type): $($resource.Name) [$($resource.Status)]"
                    if ($resource.Url) {
                        Write-Host "    URL: $($resource.Url)"
                    }
                }
                Write-Host ""
            }
            
            return $deployedResources
        }
        catch {
            Write-ErrorMessage "Deployment failed: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
