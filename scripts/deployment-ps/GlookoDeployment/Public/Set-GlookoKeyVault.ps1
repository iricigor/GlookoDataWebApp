#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.KeyVault, Az.ManagedServiceIdentity

<#
.SYNOPSIS
    Creates or updates Azure Key Vault for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures an Azure Key Vault for the
    GlookoDataWebApp application. It is idempotent and safe to run multiple times.
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER Name
    The name of the Key Vault. Must be 3-24 characters, alphanumeric and hyphens only.
    If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.PARAMETER AssignIdentity
    Assign Key Vault Secrets User role to managed identity if it exists.

.EXAMPLE
    Set-GlookoKeyVault
    Creates a Key Vault with default configuration.

.EXAMPLE
    Set-GlookoKeyVault -Name "my-keyvault" -Location "westus2"
    Creates a Key Vault with custom name and location.

.EXAMPLE
    Set-GlookoKeyVault -AssignIdentity
    Creates a Key Vault and assigns RBAC roles to the managed identity.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    After deployment, add secrets manually:
    Set-AzKeyVaultSecret -VaultName "<name>" -Name "SecretName" -SecretValue (ConvertTo-SecureString "secret-value" -AsPlainText -Force)
#>
function Set-GlookoKeyVault {
    [CmdletBinding()]
    [Alias("Set-GKV")]
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location,

        [Parameter()]
        [switch]$AssignIdentity
    )

    begin {
        Write-SectionHeader "Azure Key Vault Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $keyVaultName = if ($Name) { $Name } else { $config.keyVaultName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        $managedIdentityName = $config.managedIdentityName
        
        Write-InfoMessage "Key Vault: $keyVaultName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Location: $loc"
    }

    process {
        try {
            # Check prerequisites
            Write-SectionHeader "Checking Prerequisites"
            
            if (-not (Test-AzureConnection)) {
                throw "Not connected to Azure. Please run 'Connect-AzAccount'"
            }
            Write-SuccessMessage "Connected to Azure"
            
            # Validate Key Vault name
            # Key Vault names must be 3-24 characters, alphanumeric and hyphens only
            # Must start with a letter and end with a letter or number
            $kvLength = $keyVaultName.Length
            if ($kvLength -lt 3 -or $kvLength -gt 24) {
                throw "Key Vault name must be 3-24 characters (current: $kvLength). Name: $keyVaultName"
            }
            # Check format: starts with letter, contains only alphanumeric and hyphens, ends with alphanumeric
            if ($keyVaultName -notmatch '^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$' -and $keyVaultName -notmatch '^[a-zA-Z][a-zA-Z0-9]?$') {
                throw "Key Vault name must start with a letter, contain only alphanumeric and hyphens, and end with a letter or number. Current name: $keyVaultName"
            }
            Write-SuccessMessage "Key Vault name is valid"

            # Ensure resource group exists
            Initialize-GlookoResourceGroup -Name $rg -Location $loc -Tags @{
                Application = "GlookoDataWebApp"
                Environment = "Production"
                ManagedBy   = "AzureDeploymentScripts"
            }

            # Create Key Vault
            Write-SectionHeader "Creating Azure Key Vault"
            
            $created = $false
            if (Test-AzureResource -ResourceType 'keyvault' -Name $keyVaultName -ResourceGroup $rg) {
                Write-WarningMessage "Key Vault '$keyVaultName' already exists"
            }
            else {
                Write-InfoMessage "Creating Key Vault '$keyVaultName'..."
                
                $keyVaultParams = @{
                    ResourceGroupName      = $rg
                    VaultName              = $keyVaultName
                    Location               = $loc
                    EnableRbacAuthorization = $true
                    SoftDeleteRetentionInDays = 90
                    Sku                    = 'Standard'
                    Tag                    = @{
                        Application = "GlookoDataWebApp"
                        Environment = "Production"
                        ManagedBy   = "AzureDeploymentScripts"
                    }
                }
                
                New-AzKeyVault @keyVaultParams | Out-Null
                
                Write-SuccessMessage "Key Vault created successfully"
                $created = $true
            }

            # Assign RBAC roles if requested
            if ($AssignIdentity) {
                Write-SectionHeader "Assigning RBAC Roles"
                
                try {
                    $identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $managedIdentityName -ErrorAction Stop
                    $principalId = $identity.PrincipalId
                    
                    # Get Key Vault resource ID
                    $kv = Get-AzKeyVault -ResourceGroupName $rg -VaultName $keyVaultName
                    $kvId = $kv.ResourceId
                    
                    # Check if role already assigned
                    $existingRole = Get-AzRoleAssignment -ObjectId $principalId -Scope $kvId -RoleDefinitionName "Key Vault Secrets User" -ErrorAction SilentlyContinue
                    
                    if ($existingRole) {
                        Write-InfoMessage "Role 'Key Vault Secrets User' already assigned"
                    }
                    else {
                        Write-InfoMessage "Assigning 'Key Vault Secrets User' role to managed identity..."
                        
                        New-AzRoleAssignment `
                            -ObjectId $principalId `
                            -RoleDefinitionName "Key Vault Secrets User" `
                            -Scope $kvId | Out-Null
                        
                        Write-SuccessMessage "Role 'Key Vault Secrets User' assigned successfully"
                    }
                }
                catch {
                    Write-WarningMessage "Managed identity '$managedIdentityName' not found, skipping RBAC assignment"
                }
            }

            # Get Key Vault details for summary
            $kv = Get-AzKeyVault -ResourceGroupName $rg -VaultName $keyVaultName
            $vaultUri = $kv.VaultUri

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Azure Key Vault deployed successfully!"
            Write-Host ""
            Write-Host "  Resource Group:      $rg"
            Write-Host "  Key Vault:           $keyVaultName"
            Write-Host "  Location:            $loc"
            Write-Host "  Vault URI:           $vaultUri"
            Write-Host "  RBAC Authorization:  Enabled"
            Write-Host "  Soft Delete:         Enabled (90 days)"
            Write-Host ""
            
            Write-Host "Next Steps:"
            Write-Host "  1. Add secrets manually using PowerShell or Portal:"
            Write-Host "     `$secret = ConvertTo-SecureString 'secret-value' -AsPlainText -Force"
            Write-Host "     Set-AzKeyVaultSecret -VaultName '$keyVaultName' -Name 'SecretName' -SecretValue `$secret"
            Write-Host ""
            Write-Host "  2. Expected secrets for GlookoDataWebApp:"
            Write-Host "     - PerplexityApiKey: API key for Perplexity AI"
            Write-Host "     - GeminiApiKey: API key for Google Gemini AI"
            Write-Host ""
            Write-Host "  3. Grant access to Azure Function App (if using managed identity):"
            Write-Host "     - Run Set-GlookoAzureFunction to auto-configure RBAC"
            Write-Host "     - Or manually assign 'Key Vault Secrets User' role"
            Write-Host ""

            # Return deployment details
            return @{
                Name          = $keyVaultName
                ResourceGroup = $rg
                Location      = $loc
                VaultUri      = $vaultUri
                Created       = $created
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy Key Vault: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
