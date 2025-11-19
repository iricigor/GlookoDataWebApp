function Set-GlookoManagedIdentity {
    <#
    .SYNOPSIS
    Creates or updates a user-assigned managed identity for GlookoDataWebApp.
    
    .DESCRIPTION
    Creates and configures a user-assigned managed identity for secure authentication
    to Azure resources without managing secrets. Optionally assigns storage roles if
    a storage account exists.
    
    .PARAMETER Name
    Name of the managed identity. If not specified, uses value from configuration.
    
    .PARAMETER ResourceGroup
    Azure resource group name. If not specified, uses value from configuration.
    
    .PARAMETER Location
    Azure region. If not specified, uses value from configuration.
    
    .PARAMETER AssignStorageRoles
    Assign storage roles to the managed identity if storage account exists.
    
    .PARAMETER ConfigFile
    Path to configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Set-GlookoManagedIdentity
    
    .EXAMPLE
    Set-GlookoManagedIdentity -Name "my-identity" -Location "westus2"
    
    .EXAMPLE
    Set-GlookoManagedIdentity -AssignStorageRoles
    
    .OUTPUTS
    Hashtable containing managed identity details (clientId, principalId, resourceId).
    #>
    [CmdletBinding()]
    param(
        [string]$Name,
        [string]$ResourceGroup,
        [string]$Location,
        [switch]$AssignStorageRoles,
        [string]$ConfigFile
    )
    
    # Load configuration
    $config = if ($ConfigFile) {
        Load-GlookoConfig -ConfigFile $ConfigFile
    } else {
        Load-GlookoConfig
    }
    
    # Override with parameters
    if ($Name) { $config.ManagedIdentityName = $Name }
    if ($ResourceGroup) { $config.ResourceGroup = $ResourceGroup }
    if ($Location) { $config.Location = $Location }
    
    # Check prerequisites
    if (-not (Test-AzurePrerequisites)) {
        throw "Prerequisites not met. Please ensure Azure CLI is installed and you are logged in."
    }
    
    # Ensure resource group exists
    Initialize-GlookoResourceGroup -ResourceGroupName $config.ResourceGroup -Location $config.Location -Tags $config.Tags
    
    # Create managed identity
    Write-Section "Creating User-Assigned Managed Identity"
    
    $identityName = $config.ManagedIdentityName
    $rgName = $config.ResourceGroup
    $loc = $config.Location
    
    Write-InfoMessage "Checking if managed identity exists: $identityName"
    
    $identityExists = Test-GlookoResourceExists -ResourceType identity -ResourceName $identityName -ResourceGroupName $rgName
    
    if ($identityExists) {
        Write-WarningMessage "Managed identity '$identityName' already exists"
    }
    else {
        Write-InfoMessage "Creating managed identity: $identityName"
        $tagsString = ($config.Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "
        az identity create --name $identityName --resource-group $rgName --location $loc --tags $tagsString | Out-Null
        Write-SuccessMessage "Managed identity created successfully"
    }
    
    # Get identity details
    Write-Section "Retrieving Managed Identity Details"
    
    Write-InfoMessage "Getting managed identity information..."
    
    $clientId = Get-GlookoManagedIdentityId -IdentityName $identityName -ResourceGroupName $rgName
    $principalId = Get-GlookoManagedIdentityPrincipalId -IdentityName $identityName -ResourceGroupName $rgName
    
    $identityJson = az identity show --name $identityName --resource-group $rgName 2>$null
    $resourceId = $null
    if ($identityJson) {
        $identity = $identityJson | ConvertFrom-Json
        $resourceId = $identity.id
    }
    
    if (-not $clientId -or -not $principalId) {
        throw "Failed to retrieve managed identity details"
    }
    
    Write-SuccessMessage "Managed identity details retrieved"
    
    # Assign storage roles if requested
    if ($AssignStorageRoles) {
        Write-Section "Configuring Storage Account Access"
        
        $storageAccount = $config.StorageAccountName
        
        # Check if storage account exists
        if (-not (Test-GlookoResourceExists -ResourceType "storage-account" -ResourceName $storageAccount -ResourceGroupName $rgName)) {
            Write-WarningMessage "Storage account '$storageAccount' not found"
            Write-InfoMessage "Storage role assignment will be skipped"
            Write-InfoMessage "Deploy storage account first, then run this command with -AssignStorageRoles"
        }
        else {
            Write-InfoMessage "Assigning roles to managed identity for storage account..."
            
            # Get storage account scope
            $storageJson = az storage account show --name $storageAccount --resource-group $rgName 2>$null
            if ($storageJson) {
                $storage = $storageJson | ConvertFrom-Json
                $storageScope = $storage.id
                
                # Assign Storage Blob Data Contributor role
                Write-InfoMessage "Assigning 'Storage Blob Data Contributor' role..."
                try {
                    az role assignment create `
                        --assignee $principalId `
                        --role "Storage Blob Data Contributor" `
                        --scope $storageScope 2>$null | Out-Null
                    Write-SuccessMessage "Storage Blob Data Contributor role assigned"
                }
                catch {
                    Write-WarningMessage "Role may already be assigned (this is normal)"
                }
                
                # Assign Storage Table Data Contributor role
                Write-InfoMessage "Assigning 'Storage Table Data Contributor' role..."
                try {
                    az role assignment create `
                        --assignee $principalId `
                        --role "Storage Table Data Contributor" `
                        --scope $storageScope 2>$null | Out-Null
                    Write-SuccessMessage "Storage Table Data Contributor role assigned"
                }
                catch {
                    Write-WarningMessage "Role may already be assigned (this is normal)"
                }
                
                Write-SuccessMessage "Storage account roles configured"
            }
        }
    }
    
    # Display summary
    Write-Section "Deployment Summary"
    
    Write-SuccessMessage "User-Assigned Managed Identity configured successfully!"
    Write-Host ""
    Write-InfoMessage "Managed Identity Details:"
    Write-Host "  - Name: $identityName"
    Write-Host "  - Resource Group: $rgName"
    Write-Host "  - Location: $loc"
    Write-Host "  - Client ID: $clientId"
    Write-Host "  - Principal ID: $principalId"
    Write-Host "  - Resource ID: $resourceId"
    Write-Host ""
    
    if ($identityExists) {
        Write-InfoMessage "Note: Managed identity already existed (not created)"
    }
    
    # Return identity details
    return @{
        Name = $identityName
        ResourceGroup = $rgName
        Location = $loc
        ClientId = $clientId
        PrincipalId = $principalId
        ResourceId = $resourceId
        Existed = $identityExists
    }
}

# Alias: Set-GMI (Set-GlookoManagedIdentity)
New-Alias -Name Set-GMI -Value Set-GlookoManagedIdentity -Force
