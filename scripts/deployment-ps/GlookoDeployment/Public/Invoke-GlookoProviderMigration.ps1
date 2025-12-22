#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage

<#
.SYNOPSIS
    Migrates ProUsers and UserSettings tables to add Provider column.

.DESCRIPTION
    This function adds the Provider column to ProUsers and UserSettings tables
    in Azure Table Storage with a default value of "Microsoft" for existing records
    that don't have this column.
    
    Migration Logic:
    - If Provider column exists: No change (preserve existing value)
    - If Provider column missing: Add Provider=Microsoft
    
    Tables Updated:
    - ProUsers: Professional user information
    - UserSettings: User preferences and settings

.PARAMETER StorageAccountName
    The name of the storage account. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER DryRun
    If specified, shows what would be updated without making changes.

.EXAMPLE
    Invoke-GlookoProviderMigration
    Migrates both ProUsers and UserSettings tables with Provider=Microsoft.

.EXAMPLE
    Invoke-GlookoProviderMigration -StorageAccountName "mystorageacct"
    Migrates tables in the specified storage account.

.EXAMPLE
    Invoke-GlookoProviderMigration -DryRun
    Shows what would be updated without making changes.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Storage Account must exist (run Set-GlookoStorageAccount first)
    - ProUsers and UserSettings tables must exist (run Set-GlookoTableStorage first)
    - Current user must have Storage Table Data Contributor role
#>
function Invoke-GlookoProviderMigration {
    [CmdletBinding()]
    [Alias("Invoke-GPM")]
    param(
        [Parameter()]
        [string]$StorageAccountName,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [switch]$DryRun
    )

    begin {
        Write-SectionHeader "Provider Column Migration"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $storageName = if ($StorageAccountName) { $StorageAccountName } else { $config.storageAccountName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        
        # Constants
        $DefaultProvider = "Microsoft"
        
        Write-InfoMessage "Storage Account: $storageName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Default Provider: $DefaultProvider"
        if ($DryRun) {
            Write-WarningMessage "DRY-RUN MODE: No changes will be made"
        }
    }

    process {
        try {
            # Check prerequisites
            Write-SectionHeader "Checking Prerequisites"
            
            if (-not (Test-AzureConnection)) {
                throw "Not connected to Azure. Please run 'Connect-AzAccount'"
            }
            Write-SuccessMessage "Connected to Azure"
            
            # Verify storage account exists
            if (-not (Test-AzureResource -ResourceType 'storage' -Name $storageName -ResourceGroup $rg)) {
                throw "Storage account '$storageName' does not exist in resource group '$rg'. Please run Set-GlookoStorageAccount first."
            }
            Write-SuccessMessage "Storage account '$storageName' exists"

            # Get storage account context
            $storageAccount = Get-AzStorageAccount -ResourceGroupName $rg -Name $storageName
            $ctx = $storageAccount.Context

            # Migrate ProUsers table
            Write-SectionHeader "Migrating ProUsers Table"
            
            $proUsersTable = Get-AzStorageTable -Context $ctx -Name "ProUsers" -ErrorAction SilentlyContinue
            if (-not $proUsersTable) {
                Write-WarningMessage "Table 'ProUsers' does not exist"
                Write-InfoMessage "Skipping ProUsers migration"
                $proUsersUpdated = 0
                $proUsersSkipped = 0
            }
            else {
                # The CloudTable property returns a Microsoft.Azure.Cosmos.Table.CloudTable object
                # This is the standard API provided by Az.Storage module for Azure Table Storage operations
                # Note: Despite the "Cosmos" namespace, this is for Azure Table Storage, not Cosmos DB
                $cloudTable = $proUsersTable.CloudTable
                
                # Query all entities with PartitionKey = "ProUser"
                $query = [Microsoft.Azure.Cosmos.Table.TableQuery]::new()
                $query.FilterString = "PartitionKey eq 'ProUser'"
                
                $entities = $cloudTable.ExecuteQuery($query)
                $allEntities = @($entities)
                $totalCount = $allEntities.Count
                
                if ($totalCount -eq 0) {
                    Write-InfoMessage "No entities found in ProUsers table"
                    $proUsersUpdated = 0
                    $proUsersSkipped = 0
                }
                else {
                    Write-InfoMessage "Found $totalCount entities in ProUsers table"
                    
                    $proUsersUpdated = 0
                    $proUsersSkipped = 0
                    
                    foreach ($entity in $allEntities) {
                        # Note: ProUsers table uses 'Email' (capital E) as per Azure Table Storage schema
                        $email = if ($entity.Properties['Email']) { 
                            $entity.Properties['Email'].StringValue 
                        } else { 
                            'unknown' 
                        }
                        
                        # Check if Provider column exists
                        $hasProvider = $entity.Properties.ContainsKey('Provider')
                        
                        if ($hasProvider) {
                            $providerValue = $entity.Properties['Provider'].StringValue
                            Write-Verbose "Skipping $email`: Provider already set to '$providerValue'"
                            $proUsersSkipped++
                        }
                        else {
                            if ($DryRun) {
                                Write-InfoMessage "[DRY-RUN] Would add Provider=$DefaultProvider to $email"
                                $proUsersUpdated++
                            }
                            else {
                                Write-InfoMessage "Adding Provider=$DefaultProvider to $email"
                                
                                # Add Provider property to existing entity
                                $entity.Properties.Add("Provider", [Microsoft.Azure.Cosmos.Table.EntityProperty]::GeneratePropertyForString($DefaultProvider))
                                
                                # Update entity using Replace operation
                                $replaceOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Replace($entity)
                                $cloudTable.Execute($replaceOp) | Out-Null
                                
                                $proUsersUpdated++
                            }
                        }
                    }
                    
                    if ($DryRun) {
                        Write-SuccessMessage "[DRY-RUN] Would update $proUsersUpdated entities in ProUsers"
                    }
                    else {
                        Write-SuccessMessage "Updated $proUsersUpdated entities in ProUsers"
                    }
                    Write-InfoMessage "Skipped $proUsersSkipped entities (already have Provider)"
                }
            }

            # Migrate UserSettings table
            Write-SectionHeader "Migrating UserSettings Table"
            
            $userSettingsTable = Get-AzStorageTable -Context $ctx -Name "UserSettings" -ErrorAction SilentlyContinue
            if (-not $userSettingsTable) {
                Write-WarningMessage "Table 'UserSettings' does not exist"
                Write-InfoMessage "Skipping UserSettings migration"
                $userSettingsUpdated = 0
                $userSettingsSkipped = 0
            }
            else {
                # The CloudTable property returns a Microsoft.Azure.Cosmos.Table.CloudTable object
                # This is the standard API provided by Az.Storage module for Azure Table Storage operations
                # Note: Despite the "Cosmos" namespace, this is for Azure Table Storage, not Cosmos DB
                $cloudTable = $userSettingsTable.CloudTable
                
                # Query all entities with PartitionKey = "users"
                $query = [Microsoft.Azure.Cosmos.Table.TableQuery]::new()
                $query.FilterString = "PartitionKey eq 'users'"
                
                $entities = $cloudTable.ExecuteQuery($query)
                $allEntities = @($entities)
                $totalCount = $allEntities.Count
                
                if ($totalCount -eq 0) {
                    Write-InfoMessage "No entities found in UserSettings table"
                    $userSettingsUpdated = 0
                    $userSettingsSkipped = 0
                }
                else {
                    Write-InfoMessage "Found $totalCount entities in UserSettings table"
                    
                    $userSettingsUpdated = 0
                    $userSettingsSkipped = 0
                    
                    foreach ($entity in $allEntities) {
                        # Note: UserSettings table uses 'email' (lowercase e) as per Azure Table Storage schema
                        $email = if ($entity.Properties['email']) { 
                            $entity.Properties['email'].StringValue 
                        } else { 
                            'unknown' 
                        }
                        
                        $userId = $entity.RowKey
                        
                        # Check if Provider column exists
                        $hasProvider = $entity.Properties.ContainsKey('Provider')
                        
                        if ($hasProvider) {
                            $providerValue = $entity.Properties['Provider'].StringValue
                            Write-Verbose "Skipping $email (userId: $userId): Provider already set to '$providerValue'"
                            $userSettingsSkipped++
                        }
                        else {
                            if ($DryRun) {
                                Write-InfoMessage "[DRY-RUN] Would add Provider=$DefaultProvider to $email (userId: $userId)"
                                $userSettingsUpdated++
                            }
                            else {
                                Write-InfoMessage "Adding Provider=$DefaultProvider to $email (userId: $userId)"
                                
                                # Add Provider property to existing entity
                                $entity.Properties.Add("Provider", [Microsoft.Azure.Cosmos.Table.EntityProperty]::GeneratePropertyForString($DefaultProvider))
                                
                                # Update entity using Replace operation
                                $replaceOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Replace($entity)
                                $cloudTable.Execute($replaceOp) | Out-Null
                                
                                $userSettingsUpdated++
                            }
                        }
                    }
                    
                    if ($DryRun) {
                        Write-SuccessMessage "[DRY-RUN] Would update $userSettingsUpdated entities in UserSettings"
                    }
                    else {
                        Write-SuccessMessage "Updated $userSettingsUpdated entities in UserSettings"
                    }
                    Write-InfoMessage "Skipped $userSettingsSkipped entities (already have Provider)"
                }
            }

            # Display summary
            Write-SectionHeader "Migration Summary"
            
            if ($DryRun) {
                Write-SuccessMessage "Provider column migration completed (DRY-RUN mode)!"
                Write-Host ""
                Write-Host "  Resource Group:      $rg"
                Write-Host "  Storage Account:     $storageName"
                Write-Host "  Default Provider:    $DefaultProvider"
                Write-Host "  Mode:                DRY-RUN (no changes made)"
                Write-Host ""
                Write-Host "Run without -DryRun to apply the changes."
            }
            else {
                Write-SuccessMessage "Provider column migration completed successfully!"
                Write-Host ""
                Write-Host "  Resource Group:      $rg"
                Write-Host "  Storage Account:     $storageName"
                Write-Host "  Default Provider:    $DefaultProvider"
                Write-Host ""
                Write-Host "Migration Details:"
                Write-Host "  - ProUsers table: Updated $proUsersUpdated entities (skipped $proUsersSkipped)"
                Write-Host "  - UserSettings table: Updated $userSettingsUpdated entities (skipped $userSettingsSkipped)"
                Write-Host "  - Existing Provider values: Preserved (not modified)"
            }
            Write-Host ""

            # Return migration results
            return @{
                StorageAccountName      = $storageName
                ResourceGroup          = $rg
                DefaultProvider        = $DefaultProvider
                DryRun                = $DryRun.IsPresent
                ProUsersUpdated       = $proUsersUpdated
                ProUsersSkipped       = $proUsersSkipped
                UserSettingsUpdated   = $userSettingsUpdated
                UserSettingsSkipped   = $userSettingsSkipped
            }
        }
        catch {
            Write-ErrorMessage "Failed to migrate Provider column: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Migration Complete"
    }
}
