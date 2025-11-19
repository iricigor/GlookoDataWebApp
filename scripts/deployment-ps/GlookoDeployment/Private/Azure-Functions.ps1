function Test-AzureCli {
    <#
    .SYNOPSIS
    Checks if Azure CLI is installed and available.
    
    .OUTPUTS
    Boolean indicating if Azure CLI is available.
    #>
    [CmdletBinding()]
    param()
    
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-ErrorMessage "Azure CLI is not installed or not in PATH"
        Write-InfoMessage "Please install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli"
        return $false
    }
    Write-SuccessMessage "Azure CLI is available"
    return $true
}

function Test-AzureLogin {
    <#
    .SYNOPSIS
    Checks if user is logged in to Azure CLI.
    
    .OUTPUTS
    Boolean indicating if user is logged in.
    #>
    [CmdletBinding()]
    param()
    
    Write-InfoMessage "Checking Azure login status..."
    
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if (-not $account) {
            Write-ErrorMessage "Not logged in to Azure"
            Write-InfoMessage "Please run 'az login' first"
            return $false
        }
        
        Write-SuccessMessage "Logged in to Azure"
        Write-InfoMessage "Account: $($account.name)"
        Write-InfoMessage "Subscription ID: $($account.id)"
        return $true
    }
    catch {
        Write-ErrorMessage "Not logged in to Azure"
        Write-InfoMessage "Please run 'az login' first"
        return $false
    }
}

function Test-AzurePrerequisites {
    <#
    .SYNOPSIS
    Runs all prerequisite checks for Azure deployment.
    
    .OUTPUTS
    Boolean indicating if all prerequisites are met.
    #>
    [CmdletBinding()]
    param()
    
    Write-Section "Checking Prerequisites"
    
    if (-not (Test-AzureCli)) {
        return $false
    }
    
    if (-not (Test-AzureLogin)) {
        return $false
    }
    
    return $true
}

function Initialize-GlookoResourceGroup {
    <#
    .SYNOPSIS
    Creates an Azure resource group if it doesn't exist.
    
    .PARAMETER ResourceGroupName
    The name of the resource group.
    
    .PARAMETER Location
    The Azure region for the resource group.
    
    .PARAMETER Tags
    Hashtable of tags to apply to the resource group.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ResourceGroupName,
        
        [Parameter(Mandatory)]
        [string]$Location,
        
        [hashtable]$Tags = @{}
    )
    
    Write-InfoMessage "Checking if resource group exists: $ResourceGroupName"
    
    $exists = az group show --name $ResourceGroupName 2>$null
    if ($exists) {
        Write-SuccessMessage "Resource group '$ResourceGroupName' already exists"
    }
    else {
        Write-InfoMessage "Creating resource group: $ResourceGroupName"
        $tagsString = ($Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "
        if ($tagsString) {
            az group create --name $ResourceGroupName --location $Location --tags $tagsString | Out-Null
        } else {
            az group create --name $ResourceGroupName --location $Location | Out-Null
        }
        Write-SuccessMessage "Resource group created successfully"
    }
}

function Test-GlookoResourceExists {
    <#
    .SYNOPSIS
    Checks if an Azure resource exists.
    
    .PARAMETER ResourceType
    Type of resource to check.
    
    .PARAMETER ResourceName
    Name of the resource.
    
    .PARAMETER ResourceGroupName
    Name of the resource group.
    
    .OUTPUTS
    Boolean indicating if the resource exists.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateSet("storage-account", "identity", "staticwebapp")]
        [string]$ResourceType,
        
        [Parameter(Mandatory)]
        [string]$ResourceName,
        
        [Parameter(Mandatory)]
        [string]$ResourceGroupName
    )
    
    try {
        switch ($ResourceType) {
            "storage-account" {
                $result = az storage account show --name $ResourceName --resource-group $ResourceGroupName 2>$null
            }
            "identity" {
                $result = az identity show --name $ResourceName --resource-group $ResourceGroupName 2>$null
            }
            "staticwebapp" {
                $result = az staticwebapp show --name $ResourceName --resource-group $ResourceGroupName 2>$null
            }
        }
        return $null -ne $result
    }
    catch {
        return $false
    }
}

function Get-GlookoManagedIdentityId {
    <#
    .SYNOPSIS
    Gets the client ID of a managed identity.
    
    .PARAMETER IdentityName
    Name of the managed identity.
    
    .PARAMETER ResourceGroupName
    Name of the resource group.
    
    .OUTPUTS
    String containing the client ID, or null if not found.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$IdentityName,
        
        [Parameter(Mandatory)]
        [string]$ResourceGroupName
    )
    
    try {
        $identity = az identity show --name $IdentityName --resource-group $ResourceGroupName 2>$null | ConvertFrom-Json
        return $identity.clientId
    }
    catch {
        return $null
    }
}

function Get-GlookoManagedIdentityPrincipalId {
    <#
    .SYNOPSIS
    Gets the principal ID of a managed identity.
    
    .PARAMETER IdentityName
    Name of the managed identity.
    
    .PARAMETER ResourceGroupName
    Name of the resource group.
    
    .OUTPUTS
    String containing the principal ID, or null if not found.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$IdentityName,
        
        [Parameter(Mandatory)]
        [string]$ResourceGroupName
    )
    
    try {
        $identity = az identity show --name $IdentityName --resource-group $ResourceGroupName 2>$null | ConvertFrom-Json
        return $identity.principalId
    }
    catch {
        return $null
    }
}
