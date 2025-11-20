function Set-GlookoTableStorage {
    <#
    .SYNOPSIS
    Creates Azure Storage Tables for GlookoDataWebApp.
    
    .DESCRIPTION
    Creates and configures the UserSettings and ProUsers tables in Azure Table Storage
    with CORS configuration for browser access.
    
    .PARAMETER StorageAccountName
    Storage account name. If not specified, uses value from configuration.
    
    .PARAMETER ResourceGroup
    Azure resource group name. If not specified, uses value from configuration.
    
    .PARAMETER TableName
    Specific table name to create. If not specified, creates both UserSettings and ProUsers tables.
    Valid values: UserSettings, ProUsers
    
    .PARAMETER ConfigFile
    Path to configuration file. Defaults to ~/.glookodata/config.json
    
    .EXAMPLE
    Set-GlookoTableStorage
    
    .EXAMPLE
    Set-GlookoTableStorage -TableName "UserSettings"
    
    .EXAMPLE
    Set-GlookoTableStorage -StorageAccountName "mystorageacct"
    
    .OUTPUTS
    Hashtable containing table details.
    #>
    [CmdletBinding()]
    param(
        [string]$StorageAccountName,
        [string]$ResourceGroup,
        [ValidateSet('UserSettings', 'ProUsers')]
        [string]$TableName,
        [string]$ConfigFile
    )
    
    # Load configuration
    $config = if ($ConfigFile) {
        Load-GlookoConfig -ConfigFile $ConfigFile
    } else {
        Load-GlookoConfig
    }
    
    # Override with parameters
    if ($StorageAccountName) { $config.StorageAccountName = $StorageAccountName }
    if ($ResourceGroup) { $config.ResourceGroup = $ResourceGroup }
    
    # Check prerequisites
    if (-not (Test-AzurePrerequisites)) {
        throw "Prerequisites not met. Please ensure Azure CLI is installed and you are logged in."
    }
    
    Write-Section "Creating Azure Storage Tables"
    
    $storageAccountName = $config.StorageAccountName
    $rgName = $config.ResourceGroup
    
    Write-InfoMessage "Checking if storage account exists..."
    if (-not (Test-GlookoResourceExists -ResourceType "storage-account" -ResourceName $storageAccountName -ResourceGroupName $rgName)) {
        throw "Storage account '$storageAccountName' not found. Please deploy storage account first using: Set-GlookoStorageAccount"
    }
    
    # Get storage account key
    Write-InfoMessage "Getting storage account key..."
    $accountKey = az storage account keys list `
        --account-name $storageAccountName `
        --resource-group $rgName `
        --query "[0].value" -o tsv 2>$null
    
    if (-not $accountKey) {
        throw "Failed to get storage account key"
    }
    
    # Determine which tables to create
    $tablesToCreate = if ($TableName) {
        @($TableName)
    } else {
        @('UserSettings', 'ProUsers')
    }
    
    $results = @{}
    
    foreach ($table in $tablesToCreate) {
        Write-InfoMessage "Creating $table table..."
        
        try {
            az storage table create `
                --name $table `
                --account-name $storageAccountName `
                --account-key $accountKey 2>$null | Out-Null
            Write-SuccessMessage "$table table created successfully"
            $results[$table] = @{ Status = "Created" }
        }
        catch {
            Write-WarningMessage "$table table may already exist (this is normal)"
            $results[$table] = @{ Status = "AlreadyExists" }
        }
    }
    
    # Configure CORS for UserSettings table (needed for browser access)
    if ($tablesToCreate -contains 'UserSettings' -or -not $TableName) {
        Write-InfoMessage "Configuring CORS for browser access..."
        try {
            az storage cors add `
                --services t `
                --methods GET PUT POST DELETE `
                --origins "*" `
                --allowed-headers "*" `
                --exposed-headers "*" `
                --max-age 3600 `
                --account-name $storageAccountName `
                --account-key $accountKey 2>$null | Out-Null
            Write-SuccessMessage "CORS configured successfully"
        }
        catch {
            Write-WarningMessage "CORS may already be configured (this is normal)"
        }
    }
    
    # Display summary
    Write-Section "Deployment Summary"
    
    Write-SuccessMessage "Azure Storage Tables configured successfully!"
    Write-Host ""
    Write-InfoMessage "Table Details:"
    Write-Host "  - Storage Account: $storageAccountName"
    Write-Host "  - Resource Group: $rgName"
    Write-Host "  - Tables Created: $($tablesToCreate -join ', ')"
    Write-Host ""
    
    if ($tablesToCreate -contains 'UserSettings') {
        Write-InfoMessage "UserSettings Table:"
        Write-Host "  - Purpose: Store user preferences and settings"
        Write-Host "  - PartitionKey: User email address"
        Write-Host "  - RowKey: 'settings'"
        Write-Host "  - Columns: ThemeMode, ExportFormat, GlucoseThresholds, etc."
        Write-Host ""
    }
    
    if ($tablesToCreate -contains 'ProUsers') {
        Write-InfoMessage "ProUsers Table:"
        Write-Host "  - Purpose: Store pro user subscriptions"
        Write-Host "  - PartitionKey: User email address"
        Write-Host "  - RowKey: Subscription ID"
        Write-Host ""
    }
    
    # Return results
    return @{
        StorageAccountName = $storageAccountName
        ResourceGroup = $rgName
        Tables = $results
        CorsConfigured = ($tablesToCreate -contains 'UserSettings' -or -not $TableName)
    }
}

# Alias: Set-GTS (Set-GlookoTableStorage)
New-Alias -Name Set-GTS -Value Set-GlookoTableStorage -Force
