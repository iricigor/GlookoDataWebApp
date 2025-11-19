function Set-GlookoStorageAccount {
    <#
    .SYNOPSIS
    Creates or updates an Azure Storage Account for GlookoDataWebApp.
    
    .DESCRIPTION
    Creates and configures an Azure Storage Account with secure settings for
    GlookoDataWebApp. Supports both connection string and managed identity authentication.
    
    .PARAMETER Name
    Storage account name (must be globally unique). If not specified, uses value from configuration.
    
    .PARAMETER ResourceGroup
    Azure resource group name. If not specified, uses value from configuration.
    
    .PARAMETER Location
    Azure region. If not specified, uses value from configuration.
    
    .PARAMETER UseManagedIdentity
    Configure for managed identity authentication instead of connection strings.
    
    .PARAMETER ShowConnectionString
    Display the storage account connection string (for troubleshooting).
    
    .PARAMETER ConfigFile
    Path to configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Set-GlookoStorageAccount
    
    .EXAMPLE
    Set-GlookoStorageAccount -Name "mystorageacct" -Location "westus2"
    
    .EXAMPLE
    Set-GlookoStorageAccount -UseManagedIdentity
    
    .OUTPUTS
    Hashtable containing storage account details.
    #>
    [CmdletBinding()]
    param(
        [string]$Name,
        [string]$ResourceGroup,
        [string]$Location,
        [switch]$UseManagedIdentity,
        [switch]$ShowConnectionString,
        [string]$ConfigFile
    )
    
    # Load configuration
    $config = if ($ConfigFile) {
        Load-GlookoConfig -ConfigFile $ConfigFile
    } else {
        Load-GlookoConfig
    }
    
    # Override with parameters
    if ($Name) { $config.StorageAccountName = $Name }
    if ($ResourceGroup) { $config.ResourceGroup = $ResourceGroup }
    if ($Location) { $config.Location = $Location }
    if ($UseManagedIdentity) { $config.UseManagedIdentity = "true" }
    
    # Check prerequisites
    if (-not (Test-AzurePrerequisites)) {
        throw "Prerequisites not met. Please ensure Azure CLI is installed and you are logged in."
    }
    
    # Ensure resource group exists
    Initialize-GlookoResourceGroup -ResourceGroupName $config.ResourceGroup -Location $config.Location -Tags $config.Tags
    
    # Create storage account
    Write-Section "Creating Azure Storage Account"
    
    $storageAccountName = $config.StorageAccountName
    $rgName = $config.ResourceGroup
    $loc = $config.Location
    
    Write-InfoMessage "Checking if storage account exists: $storageAccountName"
    
    $storageExists = Test-GlookoResourceExists -ResourceType "storage-account" -ResourceName $storageAccountName -ResourceGroupName $rgName
    
    if ($storageExists) {
        Write-WarningMessage "Storage account '$storageAccountName' already exists"
    }
    else {
        Write-InfoMessage "Creating storage account: $storageAccountName"
        Write-InfoMessage "This may take a few minutes..."
        
        $tagsString = ($config.Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "
        
        az storage account create `
            --name $storageAccountName `
            --resource-group $rgName `
            --location $loc `
            --sku Standard_LRS `
            --kind StorageV2 `
            --https-only true `
            --min-tls-version TLS1_2 `
            --allow-blob-public-access false `
            --tags $tagsString | Out-Null
        
        Write-SuccessMessage "Storage account created successfully"
    }
    
    # Get connection string if needed
    $connectionString = $null
    if (-not $UseManagedIdentity -or $ShowConnectionString) {
        $connectionString = az storage account show-connection-string `
            --name $storageAccountName `
            --resource-group $rgName `
            --query connectionString -o tsv 2>$null
    }
    
    # Display summary
    Write-Section "Deployment Summary"
    
    Write-SuccessMessage "Azure Storage Account configured successfully!"
    Write-Host ""
    Write-InfoMessage "Storage Account Details:"
    Write-Host "  - Name: $storageAccountName"
    Write-Host "  - Resource Group: $rgName"
    Write-Host "  - Location: $loc"
    Write-Host "  - SKU: Standard_LRS"
    Write-Host "  - Authentication: $(if ($UseManagedIdentity) { 'Managed Identity' } else { 'Connection String' })"
    Write-Host ""
    
    if ($storageExists) {
        Write-InfoMessage "Note: Storage account already existed (not created)"
    }
    
    if ((-not $UseManagedIdentity -or $ShowConnectionString) -and $connectionString) {
        Write-InfoMessage "Connection String:"
        Write-Host "  $connectionString"
        Write-Host ""
        Write-WarningMessage "Keep the connection string secure - never commit to source control!"
    }
    
    if ($UseManagedIdentity) {
        Write-InfoMessage "Managed Identity Configuration:"
        Write-Host "  The storage account is configured to use managed identity."
        Write-Host "  No connection string needed in your application code."
        Write-Host ""
    }
    
    # Return storage account details
    return @{
        Name = $storageAccountName
        ResourceGroup = $rgName
        Location = $loc
        ConnectionString = $connectionString
        UseManagedIdentity = $UseManagedIdentity.IsPresent
        Existed = $storageExists
    }
}

# Alias: Set-GSA (Set-GlookoStorageAccount)
New-Alias -Name Set-GSA -Value Set-GlookoStorageAccount -Force
