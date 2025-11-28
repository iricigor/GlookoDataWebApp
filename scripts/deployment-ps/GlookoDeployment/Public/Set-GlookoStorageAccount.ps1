#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage

<#
.SYNOPSIS
    Creates or updates Azure Storage Account for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures an Azure Storage Account for the
    GlookoDataWebApp application. It is idempotent and safe to run multiple times.
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER Name
    The name of the storage account. Must be 3-24 lowercase letters and numbers only.
    If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.PARAMETER Sku
    The storage SKU. Default: Standard_LRS
    Valid values: Standard_LRS, Standard_GRS, Standard_RAGRS, Standard_ZRS, Premium_LRS, Premium_ZRS

.PARAMETER Kind
    The storage kind. Default: StorageV2
    Valid values: Storage, StorageV2, BlobStorage, BlockBlobStorage, FileStorage

.PARAMETER AccessTier
    The access tier for blob storage. Default: Hot
    Valid values: Hot, Cool

.EXAMPLE
    Set-GlookoStorageAccount
    Creates a storage account with default configuration.

.EXAMPLE
    Set-GlookoStorageAccount -Name "mystorageacct" -Location "westus2"
    Creates a storage account with custom name and location.

.EXAMPLE
    Set-GlookoStorageAccount -Sku "Standard_GRS" -AccessTier "Cool"
    Creates a storage account with geo-redundant storage and cool access tier.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
#>
function Set-GlookoStorageAccount {
    [CmdletBinding()]
    [Alias("Set-GSA")]
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location,

        [Parameter()]
        [ValidateSet('Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Standard_ZRS', 'Premium_LRS', 'Premium_ZRS')]
        [string]$Sku = 'Standard_LRS',

        [Parameter()]
        [ValidateSet('Storage', 'StorageV2', 'BlobStorage', 'BlockBlobStorage', 'FileStorage')]
        [string]$Kind = 'StorageV2',

        [Parameter()]
        [ValidateSet('Hot', 'Cool')]
        [string]$AccessTier = 'Hot'
    )

    begin {
        Write-SectionHeader "Azure Storage Account Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $storageName = if ($Name) { $Name } else { $config.storageAccountName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        
        Write-InfoMessage "Storage Account: $storageName"
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
            
            # Validate storage account name
            if ($storageName -notmatch '^[a-z0-9]{3,24}$') {
                throw "Storage account name must be 3-24 lowercase letters and numbers only. Current name: $storageName"
            }
            Write-SuccessMessage "Storage account name is valid"

            # Ensure resource group exists
            Initialize-GlookoResourceGroup -Name $rg -Location $loc -Tags @{
                Application = "GlookoDataWebApp"
                Environment = "Production"
                ManagedBy   = "AzureDeploymentScripts"
            }

            # Create storage account
            Write-SectionHeader "Creating Azure Storage Account"
            
            $created = $false
            if (Test-AzureResource -ResourceType 'storage' -Name $storageName -ResourceGroup $rg) {
                Write-WarningMessage "Storage account '$storageName' already exists"
            }
            else {
                Write-InfoMessage "Creating storage account '$storageName'..."
                
                $storageAccountParams = @{
                    ResourceGroupName      = $rg
                    Name                   = $storageName
                    Location               = $loc
                    SkuName                = $Sku
                    Kind                   = $Kind
                    AccessTier             = $AccessTier
                    MinimumTlsVersion      = 'TLS1_2'
                    AllowBlobPublicAccess  = $false
                    EnableHttpsTrafficOnly = $true
                    Tag                    = @{
                        Application = "GlookoDataWebApp"
                        Environment = "Production"
                        ManagedBy   = "AzureDeploymentScripts"
                    }
                }
                
                New-AzStorageAccount @storageAccountParams | Out-Null
                
                Write-SuccessMessage "Storage account created successfully"
                $created = $true
            }

            # Configure storage account
            Write-SectionHeader "Configuring Storage Account"
            
            # Enable blob soft delete for data protection
            Write-InfoMessage "Configuring blob service properties..."
            try {
                $storageAccount = Get-AzStorageAccount -ResourceGroupName $rg -Name $storageName
                $ctx = $storageAccount.Context
                
                Enable-AzStorageBlobDeleteRetentionPolicy -Context $ctx -RetentionDays 7 | Out-Null
                Write-SuccessMessage "Blob delete retention enabled (7 days)"
            }
            catch {
                Write-WarningMessage "Could not configure blob retention: $_"
            }

            # Get storage account details for summary
            $storageAccount = Get-AzStorageAccount -ResourceGroupName $rg -Name $storageName
            $blobEndpoint = $storageAccount.PrimaryEndpoints.Blob

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Azure Storage Account deployed successfully!"
            Write-Host ""
            Write-Host "  Resource Group:      $rg"
            Write-Host "  Storage Account:     $storageName"
            Write-Host "  Location:            $loc"
            Write-Host "  SKU:                 $Sku"
            Write-Host "  Kind:                $Kind"
            Write-Host "  Access Tier:         $AccessTier"
            Write-Host "  Min TLS Version:     TLS1_2"
            Write-Host "  Blob Endpoint:       $blobEndpoint"
            Write-Host ""
            
            Write-Host "Next Steps:"
            Write-Host "  1. Create tables using Set-GlookoTableStorage"
            Write-Host "  2. Create managed identity using Set-GlookoManagedIdentity"
            Write-Host "  3. Assign RBAC roles for managed identity access"
            Write-Host ""

            # Return deployment details
            return @{
                Name          = $storageName
                ResourceGroup = $rg
                Location      = $loc
                Sku           = $Sku
                Kind          = $Kind
                AccessTier    = $AccessTier
                BlobEndpoint  = $blobEndpoint
                Created       = $created
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy storage account: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
