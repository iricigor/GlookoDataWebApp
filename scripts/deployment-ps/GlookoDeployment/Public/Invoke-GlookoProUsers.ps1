#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage

<#
.SYNOPSIS
    Manages Pro users in the ProUsers Azure Storage Table.

.DESCRIPTION
    This function provides operations to list, add, remove, and check Pro users
    in the ProUsers Azure Storage Table. Users are identified by their email address.
    
    The ProUsers table stores professional user information with the following structure:
    - PartitionKey: "ProUser" (constant for all entries)
    - RowKey: Email address (URL-encoded)
    - Email: Email address (original format)
    - CreatedAt: ISO 8601 timestamp when the user was added

.PARAMETER Action
    The action to perform. Valid values: List, Add, Remove, Check

.PARAMETER Email
    The email address of the user. Required for Add, Remove, and Check actions.

.PARAMETER StorageAccountName
    The name of the storage account. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.EXAMPLE
    Invoke-GlookoProUsers -Action List
    Lists all Pro users in the ProUsers table.

.EXAMPLE
    Invoke-GlookoProUsers -Action Add -Email "user@example.com"
    Adds a new Pro user with the specified email.

.EXAMPLE
    Invoke-GlookoProUsers -Action Remove -Email "user@example.com"
    Removes the Pro user with the specified email.

.EXAMPLE
    Invoke-GlookoProUsers -Action Check -Email "user@example.com"
    Checks if the specified email is a Pro user.

.EXAMPLE
    Invoke-GlookoProUsers List
    Uses positional parameter for action.

.EXAMPLE
    Invoke-GPU Add user@example.com
    Uses alias and positional parameters.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Storage Account must exist (run Set-GlookoStorageAccount first)
    - ProUsers table must exist (run Set-GlookoTableStorage first)
    - Current user must have Storage Table Data Contributor role
#>
function Invoke-GlookoProUsers {
    [CmdletBinding()]
    [Alias("Invoke-GPU")]
    param(
        [Parameter(Mandatory, Position = 0)]
        [ValidateSet('List', 'Add', 'Remove', 'Check')]
        [string]$Action,

        [Parameter(Position = 1)]
        [string]$Email,

        [Parameter()]
        [string]$StorageAccountName,

        [Parameter()]
        [string]$ResourceGroup
    )

    begin {
        Write-SectionHeader "Pro Users Management"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $storageName = if ($StorageAccountName) { $StorageAccountName } else { $config.storageAccountName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        
        # Constants
        $TableName = "ProUsers"
        $PartitionKey = "ProUser"
        
        Write-InfoMessage "Storage Account: $storageName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Action: $Action"
        if ($Email) {
            Write-InfoMessage "Email: $Email"
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

            # Verify ProUsers table exists
            $table = Get-AzStorageTable -Context $ctx -Name $TableName -ErrorAction SilentlyContinue
            if (-not $table) {
                throw "Table '$TableName' does not exist. Please run Set-GlookoTableStorage first."
            }
            Write-SuccessMessage "Table '$TableName' exists"
            
            # Validate email for actions that require it
            if ($Action -in @('Add', 'Remove', 'Check')) {
                if (-not $Email) {
                    throw "Email parameter is required for '$Action' action"
                }
                
                # Basic email validation
                if ($Email -notmatch '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') {
                    throw "Invalid email format: $Email"
                }
                
                # Normalize email to lowercase for case-insensitive matching
                $Email = $Email.ToLowerInvariant()
            }

            # Get cloud table reference for entity operations
            $cloudTable = $table.CloudTable

            # Execute the requested action
            switch ($Action) {
                'List' {
                    Write-SectionHeader "Pro Users"
                    
                    # Query all entities with PartitionKey = "ProUser"
                    $query = [Microsoft.Azure.Cosmos.Table.TableQuery]::new()
                    $query.FilterString = "PartitionKey eq '$PartitionKey'"
                    
                    $entities = $cloudTable.ExecuteQuery($query)
                    $users = @($entities)
                    
                    if ($users.Count -eq 0) {
                        Write-InfoMessage "No Pro users found"
                    }
                    else {
                        Write-SuccessMessage "Found $($users.Count) Pro user(s):"
                        Write-Host ""
                        foreach ($user in $users) {
                            $email = $user.Properties['Email'].StringValue
                            $createdAt = if ($user.Properties['CreatedAt']) { 
                                $user.Properties['CreatedAt'].StringValue 
                            } else { 
                                'unknown' 
                            }
                            Write-Host "  $email  (added: $createdAt)"
                        }
                    }
                    
                    Write-Host ""
                    Write-Host "Total: $($users.Count) Pro user(s)"
                    
                    return @{
                        Action = 'List'
                        Count = $users.Count
                        Users = $users | ForEach-Object {
                            @{
                                Email = $_.Properties['Email'].StringValue
                                CreatedAt = if ($_.Properties['CreatedAt']) { $_.Properties['CreatedAt'].StringValue } else { $null }
                            }
                        }
                    }
                }
                
                'Add' {
                    Write-SectionHeader "Adding Pro User"
                    
                    # URL encode email for RowKey (using .NET Uri class which is always available)
                    $rowKey = [System.Uri]::EscapeDataString($Email)
                    
                    # Check if user already exists
                    $retrieveOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Retrieve($PartitionKey, $rowKey)
                    $result = $cloudTable.Execute($retrieveOp)
                    
                    if ($result.Result) {
                        Write-WarningMessage "Pro user '$Email' already exists"
                        return @{
                            Action = 'Add'
                            Email = $Email
                            Success = $true
                            AlreadyExists = $true
                        }
                    }
                    
                    # Create new entity
                    $entity = [Microsoft.Azure.Cosmos.Table.DynamicTableEntity]::new($PartitionKey, $rowKey)
                    $entity.Properties.Add("Email", [Microsoft.Azure.Cosmos.Table.EntityProperty]::GeneratePropertyForString($Email))
                    # Use UTC timestamp for consistency with bash script
                    $entity.Properties.Add("CreatedAt", [Microsoft.Azure.Cosmos.Table.EntityProperty]::GeneratePropertyForString((Get-Date -AsUTC -Format "o")))
                    
                    # Insert entity
                    $insertOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Insert($entity)
                    $cloudTable.Execute($insertOp) | Out-Null
                    
                    Write-SuccessMessage "Pro user '$Email' added successfully"
                    
                    return @{
                        Action = 'Add'
                        Email = $Email
                        Success = $true
                        AlreadyExists = $false
                    }
                }
                
                'Remove' {
                    Write-SectionHeader "Removing Pro User"
                    
                    # URL encode email for RowKey (using .NET Uri class which is always available)
                    $rowKey = [System.Uri]::EscapeDataString($Email)
                    
                    # Check if user exists
                    $retrieveOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Retrieve($PartitionKey, $rowKey)
                    $result = $cloudTable.Execute($retrieveOp)
                    
                    if (-not $result.Result) {
                        Write-WarningMessage "Pro user '$Email' does not exist"
                        return @{
                            Action = 'Remove'
                            Email = $Email
                            Success = $true
                            NotFound = $true
                        }
                    }
                    
                    # Delete entity
                    $entity = $result.Result
                    $deleteOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Delete($entity)
                    $cloudTable.Execute($deleteOp) | Out-Null
                    
                    Write-SuccessMessage "Pro user '$Email' removed successfully"
                    
                    return @{
                        Action = 'Remove'
                        Email = $Email
                        Success = $true
                        NotFound = $false
                    }
                }
                
                'Check' {
                    Write-SectionHeader "Checking Pro User Status"
                    
                    # URL encode email for RowKey (using .NET Uri class which is always available)
                    $rowKey = [System.Uri]::EscapeDataString($Email)
                    
                    # Check if user exists
                    $retrieveOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Retrieve($PartitionKey, $rowKey)
                    $result = $cloudTable.Execute($retrieveOp)
                    
                    if ($result.Result) {
                        $entity = $result.Result
                        $createdAt = if ($entity.Properties['CreatedAt']) { 
                            $entity.Properties['CreatedAt'].StringValue 
                        } else { 
                            'unknown' 
                        }
                        Write-SuccessMessage "'$Email' is a Pro user (added: $createdAt)"
                        
                        return @{
                            Action = 'Check'
                            Email = $Email
                            IsProUser = $true
                            CreatedAt = $createdAt
                        }
                    }
                    else {
                        Write-InfoMessage "'$Email' is NOT a Pro user"
                        
                        return @{
                            Action = 'Check'
                            Email = $Email
                            IsProUser = $false
                            CreatedAt = $null
                        }
                    }
                }
            }
        }
        catch {
            Write-ErrorMessage "Failed to manage Pro users: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Complete"
    }
}
