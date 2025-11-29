#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Functions, Az.Websites

<#
.SYNOPSIS
    Links an Azure Function App as the backend for an Azure Static Web App.

.DESCRIPTION
    This function links an Azure Function App as the backend for an Azure Static
    Web App. This enables /api/* routes on the Static Web App to be proxied to
    the Function App. It is idempotent and safe to run multiple times.
    
    The function:
    - Verifies both the Static Web App and Function App exist
    - Checks if a backend is already linked
    - Unlinks any incorrect backend if necessary
    - Links the correct Function App as backend
    - Verifies the link was successful

.PARAMETER StaticWebAppName
    The name of the Static Web App. If not provided, uses value from configuration.

.PARAMETER FunctionAppName
    The name of the Function App to link. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region for the backend. If not provided, uses value from configuration.

.EXAMPLE
    Set-GlookoSwaBackend
    Links the Function App to Static Web App using default configuration.

.EXAMPLE
    Set-GlookoSwaBackend -StaticWebAppName "my-swa" -FunctionAppName "my-func"
    Links a specific Function App to a specific Static Web App.

.EXAMPLE
    Set-GlookoSwaBackend -Location "westus2"
    Links with a specific backend region.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Static Web App must exist
    - Function App must exist
    
    Why is this needed?
    When a Function App is deployed separately from a Static Web App, the /api/* routes
    won't work until the backend is linked. This function handles that linking.
#>
function Set-GlookoSwaBackend {
    [CmdletBinding()]
    [Alias("Set-GSB")]
    param(
        [Parameter()]
        [string]$StaticWebAppName,

        [Parameter()]
        [string]$FunctionAppName,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location
    )

    begin {
        Write-SectionHeader "Static Web App Backend Linking"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $swaName = if ($StaticWebAppName) { $StaticWebAppName } else { $config.staticWebAppName }
        $funcName = if ($FunctionAppName) { $FunctionAppName } else { $config.functionAppName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        
        Write-InfoMessage "Static Web App: $swaName"
        Write-InfoMessage "Function App: $funcName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Backend Region: $loc"
    }

    process {
        try {
            # Check prerequisites
            Write-SectionHeader "Checking Prerequisites"
            
            if (-not (Test-AzureConnection)) {
                throw "Not connected to Azure. Please run 'Connect-AzAccount'"
            }
            Write-SuccessMessage "Connected to Azure"
            
            # Verify Static Web App exists
            if (-not (Test-AzureResource -ResourceType 'staticwebapp' -Name $swaName -ResourceGroup $rg)) {
                throw "Static Web App '$swaName' not found in resource group '$rg'"
            }
            Write-SuccessMessage "Static Web App '$swaName' exists"
            
            # Verify Function App exists
            if (-not (Test-AzureResource -ResourceType 'functionapp' -Name $funcName -ResourceGroup $rg)) {
                throw "Function App '$funcName' not found in resource group '$rg'. Please run Set-GlookoAzureFunction first."
            }
            Write-SuccessMessage "Function App '$funcName' exists"

            # Get Function App resource ID
            Write-SectionHeader "Linking Backend"
            
            $functionApp = Get-AzFunctionApp -ResourceGroupName $rg -Name $funcName
            $functionResourceId = $functionApp.Id
            
            Write-InfoMessage "Function App Resource ID: $functionResourceId"
            
            # Check if backend is already linked using Azure CLI
            # Note: Az.Websites doesn't have native cmdlets for SWA backends
            # Note: The command is 'show' not 'list' - each SWA can only have one backend
            Write-InfoMessage "Checking existing backend..."
            
            $existingBackendOutput = az staticwebapp backends show `
                --name $swaName `
                --resource-group $rg `
                --query "backendResourceId" `
                --output tsv 2>&1
            
            if ($LASTEXITCODE -ne 0) {
                # No backend linked or command failed - this is normal for new SWAs
                $existingBackend = $null
            }
            else {
                $existingBackend = $existingBackendOutput
            }
            
            $backendLinked = $false
            
            if ($existingBackend) {
                # Check if it's the correct backend using -like for safe string matching
                if ($existingBackend -like "*$funcName*") {
                    Write-WarningMessage "Correct backend already linked: $existingBackend"
                    $backendLinked = $true
                }
                else {
                    Write-WarningMessage "Different backend is linked: $existingBackend"
                    Write-InfoMessage "Unlinking existing backend..."
                    
                    $unlinkResult = az staticwebapp backends unlink `
                        --name $swaName `
                        --resource-group $rg `
                        --output none 2>&1
                    
                    if ($LASTEXITCODE -ne 0) {
                        throw "Failed to unlink existing backend: $unlinkResult"
                    }
                    
                    Write-SuccessMessage "Previous backend unlinked"
                }
            }
            
            # Link the backend if not already linked
            if (-not $backendLinked) {
                Write-InfoMessage "Linking Function App to Static Web App..."
                
                $linkResult = az staticwebapp backends link `
                    --name $swaName `
                    --resource-group $rg `
                    --backend-resource-id $functionResourceId `
                    --backend-region $loc `
                    --output none 2>&1
                
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to link backend: $linkResult"
                }
                
                Write-SuccessMessage "Backend linked successfully!"
            }
            
            # Verify the backend is linked
            Write-SectionHeader "Verifying Backend Link"
            
            $verifyBackendOutput = az staticwebapp backends show `
                --name $swaName `
                --resource-group $rg `
                --query "backendResourceId" `
                --output tsv 2>&1
            
            if ($LASTEXITCODE -ne 0) {
                throw "Backend verification failed - could not query backend: $verifyBackendOutput"
            }
            
            $verifyBackend = $verifyBackendOutput
            
            if (-not $verifyBackend) {
                throw "Backend verification failed - no backend is linked"
            }
            
            # Use -like for safe string matching (avoids regex metacharacter issues)
            if ($verifyBackend -like "*$funcName*") {
                Write-SuccessMessage "Backend verified: $verifyBackend"
            }
            else {
                throw "Backend verification failed - unexpected backend linked: $verifyBackend"
            }

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Static Web App backend configured successfully!"
            Write-Host ""
            Write-Host "  Resource Group:      $rg"
            Write-Host "  Static Web App:      $swaName"
            Write-Host "  Function App:        $funcName"
            Write-Host "  Backend Region:      $loc"
            Write-Host ""
            Write-Host "API endpoints:"
            Write-Host "  The /api/* routes on your Static Web App will now be"
            Write-Host "  proxied to the linked Function App."
            Write-Host ""
            Write-Host "Next Steps:"
            Write-Host "  1. Deploy your function code to the Function App"
            Write-Host "  2. Test the API endpoints via the Static Web App URL"
            Write-Host ""

            # Return deployment details
            return @{
                StaticWebAppName = $swaName
                FunctionAppName  = $funcName
                ResourceGroup    = $rg
                Location         = $loc
                BackendResourceId = $functionResourceId
                Linked           = $true
            }
        }
        catch {
            Write-ErrorMessage "Failed to link backend: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
