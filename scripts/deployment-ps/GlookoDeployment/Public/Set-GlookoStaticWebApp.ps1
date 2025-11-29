#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Websites

<#
.SYNOPSIS
    Creates or updates an Azure Static Web App for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures an Azure Static Web App for the
    GlookoDataWebApp application. It is idempotent and safe to run multiple times.
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER Name
    The name of the Static Web App. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.PARAMETER Sku
    The SKU for the Static Web App (Free, Standard). Default: Standard

.PARAMETER AssignManagedIdentity
    Assign a user-assigned managed identity to the Static Web App.

.EXAMPLE
    Set-GlookoStaticWebApp
    Creates a Static Web App with default configuration.

.EXAMPLE
    Set-GlookoStaticWebApp -Name "my-swa" -Location "westus2"
    Creates a Static Web App with custom name and location.

.EXAMPLE
    Set-GlookoStaticWebApp -Sku "Free"
    Creates a free tier Static Web App.

.EXAMPLE
    Set-GlookoStaticWebApp -AssignManagedIdentity
    Creates a Static Web App with user-assigned managed identity.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Resource group must exist (or will be created)
    - User-Assigned Managed Identity should exist (for identity assignment)
#>
function Set-GlookoStaticWebApp {
    [CmdletBinding()]
    [Alias("Set-GSWA")]
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location,

        [Parameter()]
        [ValidateSet('Free', 'Standard')]
        [string]$Sku = 'Standard',

        [Parameter()]
        [switch]$AssignManagedIdentity
    )

    begin {
        Write-SectionHeader "Azure Static Web App Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $swaName = if ($Name) { $Name } else { $config.staticWebAppName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        $identityName = $config.managedIdentityName
        $assignMI = if ($PSBoundParameters.ContainsKey('AssignManagedIdentity')) { $AssignManagedIdentity.IsPresent } else { $config.useManagedIdentity }
        
        # Use SKU from config if not specified
        if (-not $PSBoundParameters.ContainsKey('Sku')) {
            $Sku = if ($config.staticWebAppSku) { $config.staticWebAppSku } else { 'Standard' }
        }
        
        Write-InfoMessage "Static Web App: $swaName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Location: $loc"
        Write-InfoMessage "SKU: $Sku"
    }

    process {
        try {
            # Check prerequisites
            Write-SectionHeader "Checking Prerequisites"
            
            if (-not (Test-AzureConnection)) {
                throw "Not connected to Azure. Please run 'Connect-AzAccount'"
            }
            Write-SuccessMessage "Connected to Azure"
            
            # Check for managed identity if using MI
            $miExists = $false
            if ($assignMI) {
                if (Test-AzureResource -ResourceType 'identity' -Name $identityName -ResourceGroup $rg) {
                    Write-SuccessMessage "Managed identity '$identityName' exists"
                    $miExists = $true
                }
                else {
                    Write-WarningMessage "Managed identity '$identityName' not found. Identity assignment will be skipped."
                }
            }
            
            # Ensure resource group exists
            Initialize-GlookoResourceGroup -Name $rg -Location $loc -Tags @{
                Application = "GlookoDataWebApp"
                Environment = "Production"
                ManagedBy   = "AzureDeploymentScripts"
            }

            # Create Static Web App
            Write-SectionHeader "Creating Azure Static Web App"
            
            $created = $false
            if (Test-AzureResource -ResourceType 'staticwebapp' -Name $swaName -ResourceGroup $rg) {
                Write-WarningMessage "Static Web App '$swaName' already exists"
                $swa = Get-AzStaticWebApp -ResourceGroupName $rg -Name $swaName
            }
            else {
                Write-InfoMessage "Creating Static Web App '$swaName'..."
                
                $swaParams = @{
                    Name              = $swaName
                    ResourceGroupName = $rg
                    Location          = $loc
                    SkuName           = $Sku
                    Tag               = @{
                        Application = "GlookoDataWebApp"
                        Environment = "Production"
                        ManagedBy   = "AzureDeploymentScripts"
                    }
                }
                
                $swa = New-AzStaticWebApp @swaParams
                
                Write-SuccessMessage "Static Web App created successfully"
                $created = $true
            }

            # Assign managed identity if requested and available
            if ($assignMI -and $miExists) {
                Write-SectionHeader "Configuring User-Assigned Managed Identity"
                
                # Get managed identity
                $identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $identityName
                $identityId = $identity.Id
                
                Write-InfoMessage "Assigning user-assigned managed identity to Static Web App..."
                
                # Check if identity is already assigned
                $swa = Get-AzStaticWebApp -ResourceGroupName $rg -Name $swaName
                $identityAlreadyAssigned = $false
                
                if ($swa.IdentityUserAssignedIdentity) {
                    foreach ($id in $swa.IdentityUserAssignedIdentity.Keys) {
                        if ($id -like "*$identityName*") {
                            $identityAlreadyAssigned = $true
                            break
                        }
                    }
                }
                
                if ($identityAlreadyAssigned) {
                    Write-WarningMessage "User-assigned managed identity already assigned"
                }
                else {
                    # Assign user-assigned managed identity to the Static Web App
                    Update-AzStaticWebApp -Name $swaName -ResourceGroupName $rg -IdentityType UserAssigned -IdentityUserAssignedIdentity @{$identityId = @{}} | Out-Null
                    Write-SuccessMessage "User-assigned managed identity assigned"
                }
            }

            # Get Static Web App details
            $swa = Get-AzStaticWebApp -ResourceGroupName $rg -Name $swaName
            $swaUrl = "https://$($swa.DefaultHostname)"

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Azure Static Web App deployed successfully!"
            Write-Host ""
            Write-Host "  Resource Group:        $rg"
            Write-Host "  Static Web App Name:   $swaName"
            Write-Host "  Location:              $loc"
            Write-Host "  SKU:                   $Sku"
            Write-Host "  Default URL:           $swaUrl"
            Write-Host ""
            
            if ($assignMI -and $miExists) {
                Write-Host "  Managed Identity:      $identityName"
                Write-Host ""
            }
            
            Write-Host "Next Steps:"
            Write-Host "  1. Deploy your web app code using GitHub Actions or Azure CLI"
            Write-Host "  2. Link a backend using Set-GlookoSwaBackend if needed"
            Write-Host "  3. Configure custom domain if needed"
            Write-Host ""

            # Return deployment details
            return @{
                Name              = $swaName
                ResourceGroup     = $rg
                Location          = $loc
                Sku               = $Sku
                DefaultUrl        = $swaUrl
                Created           = $created
                ManagedIdentity   = if ($assignMI -and $miExists) { $identityName } else { $null }
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy Static Web App: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
