#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage, Az.Functions, Az.KeyVault, Az.ManagedServiceIdentity

<#
.SYNOPSIS
    Creates or updates Azure Function App for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures an Azure Function App for the
    GlookoDataWebApp application. The function app serves as the API backend
    for the Static Web App. It is idempotent and safe to run multiple times.
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER Name
    The name of the function app. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.PARAMETER Runtime
    The function runtime (node, dotnet, python, java). Default: node

.PARAMETER RuntimeVersion
    The runtime version. Default: 20 (for Node.js)

.PARAMETER UseManagedIdentity
    Configure the function app to use a user-assigned managed identity for authentication.
    The identity must be pre-created (see managedIdentityName in configuration).

.PARAMETER SkipRbacAssignment
    Skip RBAC role assignments (useful if you want to manage RBAC separately).

.EXAMPLE
    Set-GlookoAzureFunction
    Creates a function app with default configuration.

.EXAMPLE
    Set-GlookoAzureFunction -Name "my-api-func" -Location "westus2"
    Creates a function app with custom name and location.

.EXAMPLE
    Set-GlookoAzureFunction -Runtime "dotnet" -RuntimeVersion "8"
    Creates a .NET 8 function app.

.EXAMPLE
    Set-GlookoAzureFunction -UseManagedIdentity
    Creates a function app with user-assigned managed identity configured.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Storage Account must exist
    - User-Assigned Managed Identity should exist (for RBAC authentication)
    - Key Vault is optional but recommended
#>
function Set-GlookoAzureFunction {
    [CmdletBinding()]
    [Alias("Set-GAF")]
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location,

        [Parameter()]
        [ValidateSet('node', 'dotnet', 'python', 'java')]
        [string]$Runtime = 'node',

        [Parameter()]
        [string]$RuntimeVersion = '20',

        [Parameter()]
        [switch]$UseManagedIdentity,

        [Parameter()]
        [switch]$SkipRbacAssignment
    )

    begin {
        Write-SectionHeader "Azure Function App Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $functionName = if ($Name) { $Name } else { $config.functionAppName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        $storageName = $config.storageAccountName
        $identityName = $config.managedIdentityName
        $keyVaultName = $config.keyVaultName
        $webAppUrl = $config.webAppUrl
        $useMI = if ($PSBoundParameters.ContainsKey('UseManagedIdentity')) { $UseManagedIdentity.IsPresent } else { $config.useManagedIdentity }
        
        Write-InfoMessage "Function App: $functionName"
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
            
            # Verify storage account exists
            if (-not (Test-AzureResource -ResourceType 'storage' -Name $storageName -ResourceGroup $rg)) {
                throw "Storage account '$storageName' not found in resource group '$rg'. Please create it first."
            }
            Write-SuccessMessage "Storage account '$storageName' exists"
            
            # Check for managed identity if using MI
            $miExists = $false
            if ($useMI) {
                if (Test-AzureResource -ResourceType 'identity' -Name $identityName -ResourceGroup $rg) {
                    Write-SuccessMessage "Managed identity '$identityName' exists"
                    $miExists = $true
                }
                else {
                    Write-WarningMessage "Managed identity '$identityName' not found. RBAC configuration will be skipped."
                }
            }
            
            # Check for Key Vault
            $kvExists = Test-AzureResource -ResourceType 'keyvault' -Name $keyVaultName -ResourceGroup $rg
            if ($kvExists) {
                Write-SuccessMessage "Key Vault '$keyVaultName' exists"
            }
            else {
                Write-WarningMessage "Key Vault '$keyVaultName' not found (optional)"
            }

            # Ensure resource group exists
            Initialize-GlookoResourceGroup -Name $rg -Location $loc -Tags @{
                Application = "GlookoDataWebApp"
                Environment = "Production"
                ManagedBy   = "AzureDeploymentScripts"
            }

            # Create function app
            Write-SectionHeader "Creating Azure Function App"
            
            $created = $false
            if (Test-AzureResource -ResourceType 'functionapp' -Name $functionName -ResourceGroup $rg) {
                Write-WarningMessage "Function app '$functionName' already exists"
            }
            else {
                Write-InfoMessage "Creating function app '$functionName'..."
                
                # Get storage account for connection
                $storageAccount = Get-AzStorageAccount -ResourceGroupName $rg -Name $storageName
                
                $functionAppParams = @{
                    Name                       = $functionName
                    ResourceGroupName          = $rg
                    Location                   = $loc
                    StorageAccountName         = $storageName
                    Runtime                    = $Runtime
                    RuntimeVersion             = $RuntimeVersion
                    FunctionsVersion           = '4'
                    OSType                     = 'Linux'
                    Tag                        = @{
                        Application = "GlookoDataWebApp"
                        Environment = "Production"
                        ManagedBy   = "AzureDeploymentScripts"
                    }
                }
                
                New-AzFunctionApp @functionAppParams | Out-Null
                
                Write-SuccessMessage "Function app created successfully"
                $created = $true
            }

            # Assign managed identity
            # This script uses USER-ASSIGNED managed identity for these reasons:
            # 1. Can be pre-created and shared across multiple resources
            # 2. RBAC roles can be assigned before the function app is created
            # 3. Identity lifecycle is independent of the function app
            # 4. Easier to manage in IaC scenarios
            #
            # Alternative: SYSTEM-ASSIGNED managed identity
            # - Created automatically with the resource
            # - Tied to the resource lifecycle (deleted when resource is deleted)
            # - To use system-assigned, you would:
            #   - Use Update-AzFunctionApp -IdentityType SystemAssigned
            #   - Get principal ID from the response to assign RBAC roles
            # - Security: Both types are equally secure; choice depends on management preference
            if ($useMI -and $miExists) {
                Write-SectionHeader "Configuring User-Assigned Managed Identity"
                
                # Get managed identity
                $identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $identityName
                $identityId = $identity.Id
                $principalId = $identity.PrincipalId
                $clientId = $identity.ClientId
                
                Write-InfoMessage "Assigning user-assigned managed identity to function app..."
                
                # Assign user-assigned managed identity to the function app
                Update-AzFunctionApp -Name $functionName -ResourceGroupName $rg -IdentityType UserAssigned -IdentityId $identityId | Out-Null
                
                Write-SuccessMessage "User-assigned managed identity assigned"
                
                # Configure RBAC roles
                if (-not $SkipRbacAssignment) {
                    Write-SectionHeader "Configuring RBAC Roles"
                    
                    # Get storage account ID
                    $storageAccount = Get-AzStorageAccount -ResourceGroupName $rg -Name $storageName
                    $storageId = $storageAccount.Id
                    
                    # Assign Storage Table Data Contributor
                    Write-InfoMessage "Assigning 'Storage Table Data Contributor' role..."
                    try {
                        $existingAssignment = Get-AzRoleAssignment -ObjectId $principalId -RoleDefinitionName "Storage Table Data Contributor" -Scope $storageId -ErrorAction SilentlyContinue
                        if ($existingAssignment) {
                            Write-WarningMessage "Storage Table Data Contributor role already assigned"
                        }
                        else {
                            New-AzRoleAssignment -ObjectId $principalId -RoleDefinitionName "Storage Table Data Contributor" -Scope $storageId | Out-Null
                            Write-SuccessMessage "Storage Table Data Contributor role assigned"
                        }
                    }
                    catch {
                        Write-WarningMessage "Failed to assign Storage Table Data Contributor role: $_"
                    }
                    
                    # Assign Storage Blob Data Contributor
                    Write-InfoMessage "Assigning 'Storage Blob Data Contributor' role..."
                    try {
                        $existingAssignment = Get-AzRoleAssignment -ObjectId $principalId -RoleDefinitionName "Storage Blob Data Contributor" -Scope $storageId -ErrorAction SilentlyContinue
                        if ($existingAssignment) {
                            Write-WarningMessage "Storage Blob Data Contributor role already assigned"
                        }
                        else {
                            New-AzRoleAssignment -ObjectId $principalId -RoleDefinitionName "Storage Blob Data Contributor" -Scope $storageId | Out-Null
                            Write-SuccessMessage "Storage Blob Data Contributor role assigned"
                        }
                    }
                    catch {
                        Write-WarningMessage "Failed to assign Storage Blob Data Contributor role: $_"
                    }
                    
                    # Assign Key Vault access if KV exists
                    if ($kvExists) {
                        $keyVault = Get-AzKeyVault -ResourceGroupName $rg -VaultName $keyVaultName
                        $kvId = $keyVault.ResourceId
                        
                        Write-InfoMessage "Assigning 'Key Vault Secrets User' role..."
                        try {
                            $existingAssignment = Get-AzRoleAssignment -ObjectId $principalId -RoleDefinitionName "Key Vault Secrets User" -Scope $kvId -ErrorAction SilentlyContinue
                            if ($existingAssignment) {
                                Write-WarningMessage "Key Vault Secrets User role already assigned"
                            }
                            else {
                                New-AzRoleAssignment -ObjectId $principalId -RoleDefinitionName "Key Vault Secrets User" -Scope $kvId | Out-Null
                                Write-SuccessMessage "Key Vault Secrets User role assigned"
                            }
                        }
                        catch {
                            Write-WarningMessage "Failed to assign Key Vault Secrets User role: $_"
                        }
                    }
                }
            }

            # Configure app settings
            Write-SectionHeader "Configuring Application Settings"
            
            $appSettings = @{
                "CORS_ALLOWED_ORIGINS" = $webAppUrl
            }
            
            if ($useMI -and $miExists) {
                $appSettings["AZURE_CLIENT_ID"] = $clientId
                $appSettings["STORAGE_ACCOUNT_NAME"] = $storageName
                
                if ($kvExists) {
                    $appSettings["KEY_VAULT_NAME"] = $keyVaultName
                }
            }
            
            if ($appSettings.Count -gt 0) {
                Write-InfoMessage "Setting application configuration..."
                Update-AzFunctionAppSetting -Name $functionName -ResourceGroupName $rg -AppSetting $appSettings | Out-Null
                Write-SuccessMessage "Application settings configured"
            }

            # Configure CORS
            Write-SectionHeader "Configuring CORS"
            
            Write-InfoMessage "Setting CORS allowed origins..."
            # Get current web app configuration
            $webApp = Get-AzWebApp -ResourceGroupName $rg -Name $functionName
            $corsSettings = $webApp.SiteConfig.Cors
            
            if ($null -eq $corsSettings) {
                $corsSettings = New-Object Microsoft.Azure.Management.WebSites.Models.CorsSettings
                $corsSettings.AllowedOrigins = @($webAppUrl)
            }
            elseif ($corsSettings.AllowedOrigins -notcontains $webAppUrl) {
                $corsSettings.AllowedOrigins += $webAppUrl
            }
            
            Set-AzWebApp -ResourceGroupName $rg -Name $functionName -CorsAllowedOrigin @($webAppUrl) | Out-Null
            
            Write-SuccessMessage "CORS configured for $webAppUrl"

            # Get function app URL
            $functionApp = Get-AzFunctionApp -ResourceGroupName $rg -Name $functionName
            $functionUrl = $functionApp.DefaultHostName

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Azure Function App deployed successfully!"
            Write-Host ""
            Write-Host "  Resource Group:     $rg"
            Write-Host "  Function App Name:  $functionName"
            Write-Host "  Location:           $loc"
            Write-Host "  Runtime:            $Runtime $RuntimeVersion"
            Write-Host "  Function URL:       https://$functionUrl"
            Write-Host ""
            
            if ($useMI -and $miExists) {
                Write-Host "  Managed Identity:   $identityName"
                Write-Host "  RBAC Roles:         Storage Table Data Contributor"
                Write-Host "                      Storage Blob Data Contributor"
                if ($kvExists) {
                    Write-Host "                      Key Vault Secrets User"
                }
                Write-Host ""
            }
            
            Write-Host "Next Steps:"
            Write-Host "  1. Deploy your function code using Azure Functions Core Tools or CI/CD"
            Write-Host "  2. Configure any additional application settings as needed"
            Write-Host "  3. Test the function endpoints"
            Write-Host ""

            # Return deployment details
            return @{
                Name              = $functionName
                ResourceGroup     = $rg
                Location          = $loc
                Runtime           = $Runtime
                RuntimeVersion    = $RuntimeVersion
                FunctionUrl       = "https://$functionUrl"
                Created           = $created
                ManagedIdentity   = if ($useMI -and $miExists) { $identityName } else { $null }
                KeyVaultConfigured = $kvExists
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy function app: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
