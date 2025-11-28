#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources

<#
.SYNOPSIS
    Creates or updates Azure Resource Group for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures an Azure Resource Group for the
    GlookoDataWebApp application. It is idempotent and safe to run multiple times.
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER Name
    The name of the resource group.
    If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.EXAMPLE
    Set-GlookoResourceGroup
    Creates a resource group with default configuration.

.EXAMPLE
    Set-GlookoResourceGroup -Name "my-rg" -Location "westus2"
    Creates a resource group with custom name and location.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
#>
function Set-GlookoResourceGroup {
    [CmdletBinding()]
    [Alias("Set-GRG")]
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$Location
    )

    begin {
        Write-SectionHeader "Azure Resource Group Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $rgName = if ($Name) { $Name } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        
        Write-InfoMessage "Resource Group: $rgName"
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

            # Create resource group
            Write-SectionHeader "Creating Azure Resource Group"
            
            $created = $false
            if (Test-AzureResource -ResourceType 'group' -Name $rgName) {
                Write-WarningMessage "Resource group '$rgName' already exists"
                
                # Get existing resource group details
                $existingRg = Get-AzResourceGroup -Name $rgName -ErrorAction Stop
                Write-InfoMessage "Existing resource group location: $($existingRg.Location)"
            }
            else {
                Write-InfoMessage "Creating resource group '$rgName' in '$loc'..."
                
                $resourceGroupParams = @{
                    Name     = $rgName
                    Location = $loc
                    Tag      = @{
                        Application = "GlookoDataWebApp"
                        Environment = "Production"
                        ManagedBy   = "AzureDeploymentScripts"
                    }
                }
                
                New-AzResourceGroup @resourceGroupParams | Out-Null
                
                Write-SuccessMessage "Resource group created successfully"
                $created = $true
            }

            # Get resource group details for summary
            $resourceGroup = Get-AzResourceGroup -Name $rgName
            $rgId = $resourceGroup.ResourceId
            $rgLocation = $resourceGroup.Location
            $provisioningState = $resourceGroup.ProvisioningState

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Azure Resource Group configured successfully!"
            Write-Host ""
            Write-Host "  Resource Group:      $rgName"
            Write-Host "  Location:            $rgLocation"
            Write-Host "  Provisioning State:  $provisioningState"
            Write-Host "  Resource ID:         $rgId"
            Write-Host ""
            
            Write-Host "Next Steps:"
            Write-Host "  1. Create storage account using Set-GlookoStorageAccount"
            Write-Host "  2. Create managed identity using Set-GlookoManagedIdentity"
            Write-Host "  3. Create function app using Set-GlookoAzureFunction"
            Write-Host ""

            # Return deployment details
            return @{
                Name              = $rgName
                Location          = $rgLocation
                ProvisioningState = $provisioningState
                ResourceId        = $rgId
                Created           = $created
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy resource group: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
