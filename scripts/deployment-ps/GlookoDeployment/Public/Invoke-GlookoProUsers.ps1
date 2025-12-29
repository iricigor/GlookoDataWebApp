#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage

<#
.SYNOPSIS
    Manages Pro users in the ProUsers Azure Storage Table.

.DESCRIPTION
    This function provides operations to list, add, remove, and check Pro users
    in the ProUsers Azure Storage Table. Users are identified by their email address
    and authentication provider.
    
    The ProUsers table stores professional user information with the following structure:
    - PartitionKey: "ProUser" (constant for all entries)
    - RowKey: Email address (URL-encoded)
    - Email: Email address (original format)
    - Provider: Authentication provider (Microsoft or Google)
    - CreatedAt: ISO 8601 timestamp when the user was added

.PARAMETER Action
    The action to perform. Valid values: List, Add, Remove, Check

.PARAMETER User
    The user identifier in "email;provider" format.
    Examples: "user@example.com;Microsoft" or "user@example.com;Google"
    If provider is not specified (plain email), defaults to "Microsoft".
    Required for Add, Remove, and Check actions.

.PARAMETER StorageAccountName
    The name of the storage account. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.EXAMPLE
    Invoke-GlookoProUsers -Action List
    Lists all Pro users in the ProUsers table in "email;provider" format.

.EXAMPLE
    Invoke-GlookoProUsers -Action Add -User "user@example.com;Microsoft"
    Adds a new Pro user with Microsoft provider.

.EXAMPLE
    Invoke-GlookoProUsers -Action Add -User "user@example.com;Google"
    Adds a new Pro user with Google provider.

.EXAMPLE
    Invoke-GlookoProUsers -Action Add -User "user@example.com"
    Adds a new Pro user with default provider (Microsoft).

.EXAMPLE
    Invoke-GlookoProUsers -Action Remove -User "user@example.com;Microsoft"
    Removes the Pro user with the specified email and provider.

.EXAMPLE
    Invoke-GlookoProUsers -Action Check -User "user@example.com;Google"
    Checks if the specified email with Google provider is a Pro user.

.EXAMPLE
    Invoke-GlookoProUsers List
    Uses positional parameter for action.

.EXAMPLE
    Invoke-GPU Add "user@example.com;Google"
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
        [string]$User,

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
        $ValidProviders = @('Microsoft', 'Google')
        $DefaultProvider = 'Microsoft'
        
        Write-InfoMessage "Storage Account: $storageName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Action: $Action"
        if ($User) {
            Write-InfoMessage "User: $User"
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
            
            # Validate user for actions that require it
            if ($Action -in @('Add', 'Remove', 'Check')) {
                if (-not $User) {
                    throw "User parameter is required for '$Action' action"
                }
                
                # Parse email and provider from "email;provider" format
                # Split only on first semicolon to handle edge cases
                $userParts = $User -split ';', 2
                $emailAddress = $userParts[0].Trim()
                # If there's a provider part, take only the first word (in case of extra semicolons or spaces)
                $provider = if ($userParts.Length -gt 1 -and $userParts[1].Trim()) { 
                    # Take only the first part before any additional semicolon
                    ($userParts[1] -split ';')[0].Trim()
                } else { 
                    $DefaultProvider 
                }
                
                # Validate email is not empty
                if ([string]::IsNullOrWhiteSpace($emailAddress)) {
                    throw "Email address cannot be empty"
                }
                
                # Basic email validation
                if ($emailAddress -notmatch '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') {
                    throw "Invalid email format: $emailAddress"
                }
                
                # Normalize and validate provider (case-insensitive)
                $provider = $provider.Trim()
                # Convert to proper case (Microsoft or Google)
                $matchedProvider = $ValidProviders | Where-Object { $_ -ieq $provider }
                if (-not $matchedProvider) {
                    throw "Invalid provider: $provider. Valid providers are: $($ValidProviders -join ', ')"
                }
                $provider = $matchedProvider
                
                # Normalize email to lowercase for case-insensitive matching
                $emailAddress = $emailAddress.ToLowerInvariant()
                
                Write-InfoMessage "Email: $emailAddress"
                Write-InfoMessage "Provider: $provider"
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
                            $email = if ($user.Properties -and $user.Properties['Email']) { 
                                $user.Properties['Email'].StringValue 
                            } else { 
                                'unknown' 
                            }
                            $userProvider = if ($user.Properties -and $user.Properties['Provider']) { 
                                $user.Properties['Provider'].StringValue 
                            } else { 
                                $DefaultProvider
                            }
                            $createdAt = if ($user.Properties -and $user.Properties['CreatedAt']) { 
                                $user.Properties['CreatedAt'].StringValue 
                            } else { 
                                'unknown' 
                            }
                            Write-Host "  $email;$userProvider  (added: $createdAt)"
                        }
                    }
                    
                    Write-Host ""
                    Write-Host "Total: $($users.Count) Pro user(s)"
                    
                    return @{
                        Action = 'List'
                        Count = $users.Count
                        Users = $users | ForEach-Object {
                            $userProvider = if ($_.Properties -and $_.Properties['Provider']) { 
                                $_.Properties['Provider'].StringValue 
                            } else { 
                                $DefaultProvider
                            }
                            $userEmail = if ($_.Properties -and $_.Properties['Email']) { 
                                $_.Properties['Email'].StringValue 
                            } else { 
                                'unknown' 
                            }
                            @{
                                Email = $userEmail
                                Provider = $userProvider
                                User = "$userEmail;$userProvider"
                                CreatedAt = if ($_.Properties -and $_.Properties['CreatedAt']) { $_.Properties['CreatedAt'].StringValue } else { $null }
                            }
                        }
                    }
                }
                
                'Add' {
                    Write-SectionHeader "Adding Pro User"
                    
                    # URL encode email for RowKey (using .NET Uri class which is always available)
                    $rowKey = [System.Uri]::EscapeDataString($emailAddress)
                    
                    # Check if user already exists
                    $retrieveOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Retrieve($PartitionKey, $rowKey)
                    $result = $cloudTable.Execute($retrieveOp)
                    
                    if ($result.Result) {
                        $existingProvider = if ($result.Result.Properties['Provider']) {
                            $result.Result.Properties['Provider'].StringValue
                        } else {
                            $DefaultProvider
                        }
                        Write-WarningMessage "Pro user '$emailAddress;$existingProvider' already exists"
                        return @{
                            Action = 'Add'
                            Email = $emailAddress
                            Provider = $existingProvider
                            User = "$emailAddress;$existingProvider"
                            Success = $true
                            AlreadyExists = $true
                        }
                    }
                    
                    # Create new entity
                    $entity = [Microsoft.Azure.Cosmos.Table.DynamicTableEntity]::new($PartitionKey, $rowKey)
                    $entity.Properties.Add("Email", [Microsoft.Azure.Cosmos.Table.EntityProperty]::GeneratePropertyForString($emailAddress))
                    $entity.Properties.Add("Provider", [Microsoft.Azure.Cosmos.Table.EntityProperty]::GeneratePropertyForString($provider))
                    # Use UTC timestamp for consistency with bash script
                    $entity.Properties.Add("CreatedAt", [Microsoft.Azure.Cosmos.Table.EntityProperty]::GeneratePropertyForString((Get-Date -AsUTC -Format "o")))
                    
                    # Insert entity
                    $insertOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Insert($entity)
                    $cloudTable.Execute($insertOp) | Out-Null
                    
                    Write-SuccessMessage "Pro user '$emailAddress;$provider' added successfully"
                    
                    return @{
                        Action = 'Add'
                        Email = $emailAddress
                        Provider = $provider
                        User = "$emailAddress;$provider"
                        Success = $true
                        AlreadyExists = $false
                    }
                }
                
                'Remove' {
                    Write-SectionHeader "Removing Pro User"
                    
                    # URL encode email for RowKey (using .NET Uri class which is always available)
                    $rowKey = [System.Uri]::EscapeDataString($emailAddress)
                    
                    # Check if user exists
                    $retrieveOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Retrieve($PartitionKey, $rowKey)
                    $result = $cloudTable.Execute($retrieveOp)
                    
                    if (-not $result.Result) {
                        Write-WarningMessage "Pro user '$emailAddress;$provider' does not exist"
                        return @{
                            Action = 'Remove'
                            Email = $emailAddress
                            Provider = $provider
                            User = "$emailAddress;$provider"
                            Success = $true
                            NotFound = $true
                        }
                    }
                    
                    # Get existing provider for confirmation message
                    $existingProvider = if ($result.Result.Properties['Provider']) {
                        $result.Result.Properties['Provider'].StringValue
                    } else {
                        $DefaultProvider
                    }
                    
                    # Delete entity
                    $entity = $result.Result
                    $deleteOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Delete($entity)
                    $cloudTable.Execute($deleteOp) | Out-Null
                    
                    Write-SuccessMessage "Pro user '$emailAddress;$existingProvider' removed successfully"
                    
                    return @{
                        Action = 'Remove'
                        Email = $emailAddress
                        Provider = $existingProvider
                        User = "$emailAddress;$existingProvider"
                        Success = $true
                        NotFound = $false
                    }
                }
                
                'Check' {
                    Write-SectionHeader "Checking Pro User Status"
                    
                    # URL encode email for RowKey (using .NET Uri class which is always available)
                    $rowKey = [System.Uri]::EscapeDataString($emailAddress)
                    
                    # Check if user exists
                    $retrieveOp = [Microsoft.Azure.Cosmos.Table.TableOperation]::Retrieve($PartitionKey, $rowKey)
                    $result = $cloudTable.Execute($retrieveOp)
                    
                    if ($result.Result) {
                        $entity = $result.Result
                        $existingProvider = if ($entity.Properties['Provider']) {
                            $entity.Properties['Provider'].StringValue
                        } else {
                            $DefaultProvider
                        }
                        $createdAt = if ($entity.Properties['CreatedAt']) { 
                            $entity.Properties['CreatedAt'].StringValue 
                        } else { 
                            'unknown' 
                        }
                        Write-SuccessMessage "'$emailAddress;$existingProvider' is a Pro user (added: $createdAt)"
                        
                        return @{
                            Action = 'Check'
                            Email = $emailAddress
                            Provider = $existingProvider
                            User = "$emailAddress;$existingProvider"
                            IsProUser = $true
                            CreatedAt = $createdAt
                        }
                    }
                    else {
                        Write-InfoMessage "'$emailAddress;$provider' is NOT a Pro user"
                        
                        return @{
                            Action = 'Check'
                            Email = $emailAddress
                            Provider = $provider
                            User = "$emailAddress;$provider"
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
