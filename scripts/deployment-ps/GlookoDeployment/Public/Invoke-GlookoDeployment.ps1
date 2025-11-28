#Requires -Version 7.4

<#
.SYNOPSIS
    Orchestrates the complete deployment of GlookoDataWebApp Azure infrastructure.

.DESCRIPTION
    This function orchestrates the deployment of all Azure resources needed for
    GlookoDataWebApp. It can deploy individual resources or all resources in the
    correct dependency order.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)

.PARAMETER FunctionApp
    Deploy only the Azure Function App.

.PARAMETER All
    Deploy all resources in dependency order.

.PARAMETER DryRun
    Show what would be deployed without actually deploying.

.PARAMETER SkipPrerequisites
    Skip prerequisite checks (use with caution).

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
    Requires Azure CLI to be installed and logged in.
    Run in Azure Cloud Shell for best experience.
#>
function Invoke-GlookoDeployment {
    [CmdletBinding()]
    [Alias("Invoke-GD")]
    param(
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
                
                if (-not (Test-AzureCli)) {
                    throw "Azure CLI is not available. Please install Azure CLI."
                }
                Write-SuccessMessage "Azure CLI is installed"
                
                if (-not (Test-AzureLogin)) {
                    throw "Not logged in to Azure. Please run 'az login'"
                }
                Write-SuccessMessage "Logged in to Azure"
                
                # Validate configuration
                if (-not (Test-GlookoConfig)) {
                    throw "Configuration validation failed. Please run Initialize-GlookoConfig"
                }
            }
            
            # Track what will be/was deployed
            $deployedResources = @()
            
            if ($DryRun) {
                Write-SectionHeader "Deployment Plan"
                
                if ($All -or $FunctionApp) {
                    Write-InfoMessage "Would deploy: Azure Function App ($($config.functionAppName))"
                }
                
                Write-Host ""
                Write-InfoMessage "Run without -DryRun to execute deployment"
                return
            }
            
            # Deploy resources
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
                Write-InfoMessage "Use -FunctionApp or -All to deploy resources"
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
