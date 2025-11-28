#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage, Az.Functions, Az.KeyVault, Az.ManagedServiceIdentity

<#
.SYNOPSIS
    Private helper functions for Azure PowerShell validation

.DESCRIPTION
    These functions validate Azure PowerShell module availability and authentication.
    
    This module uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
#>

function Test-AzureConnection {
    <#
    .SYNOPSIS
        Tests if Az module is available and user is logged in to Azure
    #>
    [CmdletBinding()]
    param()
    
    try {
        $context = Get-AzContext -ErrorAction Stop
        return $null -ne $context -and $null -ne $context.Account
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
                Get-AzStorageAccount -ResourceGroupName $ResourceGroup -Name $Name -ErrorAction Stop
            }
            'functionapp' {
                Get-AzFunctionApp -ResourceGroupName $ResourceGroup -Name $Name -ErrorAction Stop
            }
            'keyvault' {
                Get-AzKeyVault -ResourceGroupName $ResourceGroup -VaultName $Name -ErrorAction Stop
            }
            'identity' {
                Get-AzUserAssignedIdentity -ResourceGroupName $ResourceGroup -Name $Name -ErrorAction Stop
            }
            'staticwebapp' {
                Get-AzStaticWebApp -ResourceGroupName $ResourceGroup -Name $Name -ErrorAction Stop
            }
            'group' {
                Get-AzResourceGroup -Name $Name -ErrorAction Stop
            }
        }
        
        return $null -ne $result
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
        
        $params = @{
            Name     = $Name
            Location = $Location
        }
        
        if ($Tags -and $Tags.Count -gt 0) {
            $params['Tag'] = $Tags
        }
        
        New-AzResourceGroup @params | Out-Null
        
        Write-SuccessMessage "Resource group created"
    }
}
