#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.ManagedServiceIdentity

<#
.SYNOPSIS
    Creates or updates a User-Assigned Managed Identity for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures a user-assigned managed identity for the
    GlookoDataWebApp application. The managed identity provides passwordless
    authentication for Azure resources like Function Apps and Static Web Apps.
    
    It is idempotent and safe to run multiple times.
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER Name
    The name of the managed identity. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.EXAMPLE
    Set-GlookoManagedIdentity
    Creates a managed identity with default configuration.

.EXAMPLE
    Set-GlookoManagedIdentity -Name "my-identity" -Location "westus2"
    Creates a managed identity with custom name and location.

.EXAMPLE
    Set-GlookoManagedIdentity -ResourceGroup "my-rg"
    Creates a managed identity in a custom resource group.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    The managed identity created by this script should be used by:
    - Azure Function Apps (for accessing Storage Account and Key Vault)
    - Azure Static Web Apps (if backend authentication is needed)
    - Any other Azure resource needing passwordless authentication
#>
function Set-GlookoManagedIdentity {
    [CmdletBinding()]
    [Alias("Set-GMI")]
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location
    )

    begin {
        Write-SectionHeader "Azure User-Assigned Managed Identity Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $identityName = if ($Name) { $Name } else { $config.managedIdentityName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        
        Write-InfoMessage "Managed Identity: $identityName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Location: $loc"
    }

    process {
        try {
            # Check prerequisites
            Write-SectionHeader "Checking Prerequisites"
            
            if (-not (Test-AzureConnection)) {
                throw "Not connected to Azure. Please run 'Connect-AzAccount'"
            }
            Write-SuccessMessage "Connected to Azure"

            # Ensure resource group exists
            Initialize-GlookoResourceGroup -Name $rg -Location $loc -Tags @{
                Application = "GlookoDataWebApp"
                Environment = "Production"
                ManagedBy   = "AzureDeploymentScripts"
            }

            # Create managed identity
            Write-SectionHeader "Creating User-Assigned Managed Identity"
            
            $created = $false
            $identity = $null
            
            if (Test-AzureResource -ResourceType 'identity' -Name $identityName -ResourceGroup $rg) {
                Write-WarningMessage "Managed identity '$identityName' already exists"
                $identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $identityName
            }
            else {
                Write-InfoMessage "Creating managed identity '$identityName'..."
                
                $identity = New-AzUserAssignedIdentity `
                    -ResourceGroupName $rg `
                    -Name $identityName `
                    -Location $loc `
                    -Tag @{
                        Application = "GlookoDataWebApp"
                        Environment = "Production"
                        ManagedBy   = "AzureDeploymentScripts"
                    }
                
                Write-SuccessMessage "Managed identity created successfully"
                $created = $true
            }

            # Get identity properties
            Write-SectionHeader "Managed Identity Properties"
            
            $clientId = $identity.ClientId
            $principalId = $identity.PrincipalId
            $resourceId = $identity.Id
            
            Write-SuccessMessage "Managed identity properties retrieved"
            Write-Host ""
            Write-Host "  Client ID:     $clientId"
            Write-Host "  Principal ID:  $principalId"
            Write-Host "  Resource ID:   $resourceId"
            Write-Host ""

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "User-Assigned Managed Identity deployed successfully!"
            Write-Host ""
            Write-Host "  Resource Group:        $rg"
            Write-Host "  Managed Identity Name: $identityName"
            Write-Host "  Location:              $loc"
            Write-Host ""
            Write-Host "  Client ID:             $clientId"
            Write-Host "  Principal ID:          $principalId"
            Write-Host ""
            Write-Host "Next Steps:"
            Write-Host "  1. Deploy the Azure Function App: Set-GlookoAzureFunction"
            Write-Host "  2. Assign RBAC roles to the identity as needed"
            Write-Host ""
            Write-Host "Usage in other scripts:"
            Write-Host "  The managed identity will be automatically used by Set-GlookoAzureFunction"
            Write-Host "  to configure passwordless authentication to Storage Account and Key Vault."
            Write-Host ""

            # Return deployment details
            return @{
                Name         = $identityName
                ResourceGroup = $rg
                Location     = $loc
                ClientId     = $clientId
                PrincipalId  = $principalId
                ResourceId   = $resourceId
                Created      = $created
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy managed identity: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
