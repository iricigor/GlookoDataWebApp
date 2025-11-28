#Requires -Version 7.4

<#
.SYNOPSIS
    Private helper functions for Azure CLI validation

.DESCRIPTION
    These functions validate Azure CLI installation and authentication.
    
    This module uses Azure CLI (az) instead of Azure PowerShell cmdlets because:
    1. Azure CLI is pre-installed in Azure Cloud Shell (primary target environment)
    2. Consistent syntax between bash and PowerShell versions of scripts
    3. Azure CLI has better cross-platform support for local development
    4. Easier to maintain single set of Azure commands across both script types
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
#>

function Test-AzureCli {
    <#
    .SYNOPSIS
        Tests if Azure CLI is installed and available
    #>
    [CmdletBinding()]
    param()
    
    try {
        $null = & az --version 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function Test-AzureLogin {
    <#
    .SYNOPSIS
        Tests if user is logged in to Azure
    #>
    [CmdletBinding()]
    param()
    
    try {
        $account = & az account show --output json 2>&1 | ConvertFrom-Json
        return $null -ne $account.id
    }
    catch {
        return $false
    }
}

function Test-AzureResource {
    <#
    .SYNOPSIS
        Tests if an Azure resource exists
    
    .PARAMETER ResourceType
        The type of resource (storage, functionapp, keyvault, identity, group)
    
    .PARAMETER Name
        The name of the resource
    
    .PARAMETER ResourceGroup
        The resource group name (not required for 'group' type)
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateSet('storage', 'functionapp', 'keyvault', 'identity', 'group', 'staticwebapp')]
        [string]$ResourceType,
        
        [Parameter(Mandatory)]
        [string]$Name,
        
        [Parameter()]
        [string]$ResourceGroup
    )
    
    try {
        $result = switch ($ResourceType) {
            'storage' {
                & az storage account show --name $Name --resource-group $ResourceGroup --output json 2>&1
            }
            'functionapp' {
                & az functionapp show --name $Name --resource-group $ResourceGroup --output json 2>&1
            }
            'keyvault' {
                & az keyvault show --name $Name --resource-group $ResourceGroup --output json 2>&1
            }
            'identity' {
                & az identity show --name $Name --resource-group $ResourceGroup --output json 2>&1
            }
            'staticwebapp' {
                & az staticwebapp show --name $Name --resource-group $ResourceGroup --output json 2>&1
            }
            'group' {
                & az group show --name $Name --output json 2>&1
            }
        }
        
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Initialize-GlookoResourceGroup {
    <#
    .SYNOPSIS
        Ensures the resource group exists, creating it if necessary
    
    .PARAMETER Name
        The resource group name
    
    .PARAMETER Location
        The Azure region for the resource group
    
    .PARAMETER Tags
        Tags to apply to the resource group
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name,
        
        [Parameter(Mandatory)]
        [string]$Location,
        
        [Parameter()]
        [hashtable]$Tags
    )
    
    if (Test-AzureResource -ResourceType 'group' -Name $Name) {
        Write-InfoMessage "Resource group '$Name' already exists"
    }
    else {
        Write-InfoMessage "Creating resource group '$Name' in '$Location'..."
        
        $tagString = if ($Tags) {
            ($Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ' '
        }
        else {
            ""
        }
        
        if ($tagString) {
            & az group create --name $Name --location $Location --tags $tagString --output none
        }
        else {
            & az group create --name $Name --location $Location --output none
        }
        
        Write-SuccessMessage "Resource group created"
    }
}
