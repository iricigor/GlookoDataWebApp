#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage

<#
.SYNOPSIS
    Creates or updates Azure Storage Tables for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures Azure Storage Tables for the
    GlookoDataWebApp application. It is idempotent and safe to run multiple times.
    
    By default, creates the following tables:
    - UserSettings: Stores user preferences and settings
    - ProUsers: Stores professional user information
    - AIQueryLogs: Stores AI query rate limiting data
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER StorageAccountName
    The name of the storage account. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER TableNames
    Array of table names to create. Default: @('UserSettings', 'ProUsers', 'AIQueryLogs')

.PARAMETER AssignIdentity
    If specified, assigns Storage Table Data Contributor role to the managed identity
    if a unique managed identity exists in the resource group.

.EXAMPLE
    Set-GlookoTableStorage
    Creates default tables (UserSettings, ProUsers, AIQueryLogs) in the configured storage account.

.EXAMPLE
    Set-GlookoTableStorage -StorageAccountName "mystorageacct"
    Creates default tables in the specified storage account.

.EXAMPLE
    Set-GlookoTableStorage -TableNames @('CustomTable1', 'CustomTable2')
    Creates custom tables instead of the defaults.

.EXAMPLE
    Set-GlookoTableStorage -AssignIdentity
    Creates tables and assigns RBAC to the unique managed identity in the resource group.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Storage Account must exist (run Set-GlookoStorageAccount first)
    - Current user must have Storage Table Data Contributor role or account key access
#>
function Set-GlookoTableStorage {
    [CmdletBinding()]
    [Alias("Set-GTS")]
    param(
        [Parameter()]
        [string]$StorageAccountName,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string[]]$TableNames = @('UserSettings', 'ProUsers', 'AIQueryLogs'),

        [Parameter()]
        [switch]$AssignIdentity
    )

    begin {
        Write-SectionHeader "Azure Storage Tables Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $storageName = if ($StorageAccountName) { $StorageAccountName } else { $config.storageAccountName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        
        Write-InfoMessage "Storage Account: $storageName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Tables to create: $($TableNames -join ', ')"
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

            # Create tables
            Write-SectionHeader "Creating Azure Storage Tables"
            
            $createdTables = @()
            $existingTables = @()
            
            foreach ($tableName in $TableNames) {
                # Validate table name (3-63 alphanumeric, starting with letter)
                if ($tableName -notmatch '^[A-Za-z][A-Za-z0-9]{2,62}$') {
                    throw "Table name '$tableName' is invalid. Must be 3-63 alphanumeric characters, starting with a letter."
                }
                
                Write-InfoMessage "Creating table '$tableName'..."
                
                # Check if table already exists
                $existingTable = Get-AzStorageTable -Context $ctx -Name $tableName -ErrorAction SilentlyContinue
                
                if ($existingTable) {
                    Write-WarningMessage "Table '$tableName' already exists"
                    $existingTables += $tableName
                }
                else {
                    New-AzStorageTable -Context $ctx -Name $tableName | Out-Null
                    Write-SuccessMessage "Table '$tableName' created successfully"
                    $createdTables += $tableName
                }
            }

            # Assign RBAC to managed identity if requested
            $identityAssigned = $false
            $identityName = $null
            
            if ($AssignIdentity) {
                Write-SectionHeader "Configuring Managed Identity Access"
                
                # Find unique managed identity in resource group
                $identities = Get-AzUserAssignedIdentity -ResourceGroupName $rg -ErrorAction SilentlyContinue
                
                if ($identities -and $identities.Count -eq 1) {
                    $identity = $identities[0]
                    $identityName = $identity.Name
                    $principalId = $identity.PrincipalId
                    
                    Write-InfoMessage "Found managed identity: $identityName"
                    
                    # Get storage account resource ID
                    $storageId = $storageAccount.Id
                    
                    # Check if role assignment already exists
                    $roleName = "Storage Table Data Contributor"
                    $existingAssignment = Get-AzRoleAssignment `
                        -ObjectId $principalId `
                        -RoleDefinitionName $roleName `
                        -Scope $storageId `
                        -ErrorAction SilentlyContinue
                    
                    if ($existingAssignment) {
                        Write-WarningMessage "Role assignment already exists"
                    }
                    else {
                        Write-InfoMessage "Assigning '$roleName' role to managed identity..."
                        
                        New-AzRoleAssignment `
                            -ObjectId $principalId `
                            -RoleDefinitionName $roleName `
                            -Scope $storageId | Out-Null
                        
                        Write-SuccessMessage "Role assignment created successfully"
                    }
                    
                    Write-SuccessMessage "Managed identity '$identityName' configured with table access"
                    $identityAssigned = $true
                }
                elseif ($identities -and $identities.Count -gt 1) {
                    Write-WarningMessage "Multiple managed identities found in resource group '$rg'"
                    Write-InfoMessage "Skipping RBAC assignment. Please specify the identity manually."
                }
                else {
                    Write-WarningMessage "No managed identity found in resource group '$rg'"
                    Write-InfoMessage "Skipping RBAC assignment. Run Set-GlookoManagedIdentity first."
                }
            }

            # List all tables
            Write-SectionHeader "Storage Tables"
            
            $allTables = Get-AzStorageTable -Context $ctx
            if ($allTables) {
                Write-SuccessMessage "Tables in '$storageName':"
                foreach ($table in $allTables) {
                    Write-Host "  - $($table.Name)"
                }
            }
            else {
                Write-InfoMessage "No tables found in storage account"
            }

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Azure Storage Tables deployed successfully!"
            Write-Host ""
            Write-Host "  Resource Group:      $rg"
            Write-Host "  Storage Account:     $storageName"
            Write-Host ""
            Write-Host "  Tables created:      $($createdTables.Count)"
            foreach ($t in $createdTables) {
                Write-Host "    - $t (new)"
            }
            foreach ($t in $existingTables) {
                Write-Host "    - $t (existing)"
            }
            Write-Host ""
            
            if ($AssignIdentity) {
                if ($identityAssigned) {
                    Write-Host "  Managed Identity:    $identityName (RBAC assigned)"
                }
                else {
                    Write-Host "  Managed Identity:    Not configured (no unique identity found)"
                }
            }
            else {
                Write-Host "  Managed Identity:    Not configured (use -AssignIdentity to enable)"
            }
            Write-Host ""
            
            Write-Host "Next Steps:"
            Write-Host "  1. Create managed identity using Set-GlookoManagedIdentity (if not exists)"
            Write-Host "  2. Assign RBAC roles manually or rerun with -AssignIdentity"
            Write-Host "  3. Deploy Azure Function App using Set-GlookoAzureFunction"
            Write-Host ""

            # Return deployment details
            return @{
                StorageAccountName = $storageName
                ResourceGroup      = $rg
                TablesCreated      = $createdTables
                TablesExisting     = $existingTables
                IdentityAssigned   = $identityAssigned
                IdentityName       = $identityName
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy storage tables: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
