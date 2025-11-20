function Set-GlookoStaticWebApp {
    <#
    .SYNOPSIS
    Creates or updates Azure Static Web App for GlookoDataWebApp.
    
    .DESCRIPTION
    Creates and configures Azure Static Web App with optional managed identity support.
    Standard SKU is required for managed identity functionality.
    
    .PARAMETER Name
    Static Web App name. If not specified, uses value from configuration.
    
    .PARAMETER ResourceGroup
    Azure resource group name. If not specified, uses value from configuration.
    
    .PARAMETER Location
    Azure region. If not specified, uses value from configuration.
    
    .PARAMETER Sku
    Static Web App SKU (Free or Standard). If not specified, uses value from configuration.
    
    .PARAMETER AssignManagedIdentity
    Assign managed identity to the Static Web App (requires Standard SKU).
    
    .PARAMETER ConfigFile
    Path to configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Set-GlookoStaticWebApp
    
    .EXAMPLE
    Set-GlookoStaticWebApp -Sku Standard -AssignManagedIdentity
    
    .EXAMPLE
    Set-GlookoStaticWebApp -Name "myapp-swa" -Location "westus2"
    
    .OUTPUTS
    Hashtable containing Static Web App details.
    #>
    [CmdletBinding()]
    param(
        [string]$Name,
        [string]$ResourceGroup,
        [string]$Location,
        [ValidateSet('Free', 'Standard')]
        [string]$Sku,
        [switch]$AssignManagedIdentity,
        [string]$ConfigFile
    )
    
    # Load configuration
    $config = if ($ConfigFile) {
        Load-GlookoConfig -ConfigFile $ConfigFile
    } else {
        Load-GlookoConfig
    }
    
    # Override with parameters
    if ($Name) { $config.StaticWebAppName = $Name }
    if ($ResourceGroup) { $config.ResourceGroup = $ResourceGroup }
    if ($Location) { $config.Location = $Location }
    if ($Sku) { $config.StaticWebAppSku = $Sku }
    
    # Validate managed identity requirements
    if ($AssignManagedIdentity -and $config.StaticWebAppSku -eq "Free") {
        throw "Managed identity requires Standard SKU. Please use -Sku Standard with -AssignManagedIdentity"
    }
    
    # Check prerequisites
    if (-not (Test-AzurePrerequisites)) {
        throw "Prerequisites not met. Please ensure Azure CLI is installed and you are logged in."
    }
    
    # Ensure resource group exists
    Initialize-GlookoResourceGroup -ResourceGroupName $config.ResourceGroup -Location $config.Location -Tags $config.Tags
    
    Write-Section "Creating Azure Static Web App"
    
    $swaName = $config.StaticWebAppName
    $rgName = $config.ResourceGroup
    $location = $config.Location
    $skuValue = $config.StaticWebAppSku
    
    Write-InfoMessage "Checking if Static Web App exists: $swaName"
    
    $swaExists = Test-GlookoResourceExists -ResourceType "staticwebapp" -ResourceName $swaName -ResourceGroupName $rgName
    
    if ($swaExists) {
        Write-WarningMessage "Static Web App '$swaName' already exists"
    }
    else {
        Write-InfoMessage "Creating Static Web App: $swaName"
        Write-InfoMessage "SKU: $skuValue"
        Write-InfoMessage "Location: $location"
        
        try {
            az staticwebapp create `
                --name $swaName `
                --resource-group $rgName `
                --location $location `
                --sku $skuValue 2>$null | Out-Null
            
            Write-SuccessMessage "Static Web App created successfully"
        }
        catch {
            throw "Failed to create Static Web App: $_"
        }
    }
    
    # Assign managed identity if requested
    $identityAssigned = $false
    if ($AssignManagedIdentity) {
        Write-Section "Configuring Managed Identity"
        
        $identityName = $config.ManagedIdentityName
        Write-InfoMessage "Looking for managed identity: $identityName"
        
        $identityId = Get-GlookoManagedIdentityId -IdentityName $identityName -ResourceGroupName $rgName
        
        if ($identityId) {
            Write-InfoMessage "Assigning managed identity to Static Web App..."
            try {
                az staticwebapp identity assign `
                    --name $swaName `
                    --resource-group $rgName `
                    --identities $identityId 2>$null | Out-Null
                Write-SuccessMessage "Managed identity assigned successfully"
                $identityAssigned = $true
            }
            catch {
                Write-WarningMessage "Failed to assign managed identity: $_"
            }
        }
        else {
            Write-WarningMessage "Managed identity '$identityName' not found"
            Write-InfoMessage "Please deploy managed identity first using: Set-GlookoManagedIdentity"
        }
    }
    
    # Get deployment token
    Write-InfoMessage "Getting deployment token..."
    $token = az staticwebapp secrets list `
        --name $swaName `
        --resource-group $rgName `
        --query "properties.apiKey" -o tsv 2>$null
    
    # Display summary
    Write-Section "Deployment Summary"
    
    Write-SuccessMessage "Azure Static Web App configured successfully!"
    Write-Host ""
    Write-InfoMessage "Static Web App Details:"
    Write-Host "  - Name: $swaName"
    Write-Host "  - SKU: $skuValue"
    Write-Host "  - Resource Group: $rgName"
    Write-Host "  - Location: $location"
    if ($AssignManagedIdentity) {
        Write-Host "  - Managed Identity: $(if ($identityAssigned) { 'Enabled' } else { 'Not Assigned' })"
    }
    Write-Host ""
    
    if ($swaExists) {
        Write-InfoMessage "Note: Static Web App already existed (not created)"
    }
    
    if ($token) {
        Write-InfoMessage "Deployment Token (for GitHub Actions):"
        Write-Host "  $token"
        Write-Host ""
        Write-InfoMessage "Add this to GitHub repository secrets as AZURE_STATIC_WEB_APPS_API_TOKEN"
        Write-Host ""
    }
    
    # Return Static Web App details
    return @{
        Name = $swaName
        ResourceGroup = $rgName
        Location = $location
        Sku = $skuValue
        ManagedIdentityAssigned = $identityAssigned
        DeploymentToken = $token
        Existed = $swaExists
    }
}

# Alias: Set-GSWA (Set-GlookoStaticWebApp)
New-Alias -Name Set-GSWA -Value Set-GlookoStaticWebApp -Force
