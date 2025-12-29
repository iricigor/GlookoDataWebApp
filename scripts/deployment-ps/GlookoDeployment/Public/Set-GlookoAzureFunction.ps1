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

.PARAMETER AppClientId
    The App Registration Client ID for JWT audience validation. This is required
    for API security - tokens will be validated against this audience.
    Find it in Azure Portal: App Registrations > Your App > Application (client) ID

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

.EXAMPLE
    Set-GlookoAzureFunction -AppClientId "656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c"
    Creates a function app with explicit App Registration Client ID for JWT validation.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Storage Account must exist
    - User-Assigned Managed Identity should exist (for RBAC authentication)
    - Key Vault is optional but recommended
    - App Registration Client ID for JWT validation
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
        [string]$AppClientId,

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
        $appClientIdValue = if ($AppClientId) { $AppClientId } else { $config.appRegistrationClientId }
        $appRegistrationName = $config.appRegistrationName
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
                
                # Configure Key Vault reference identity to use the user-assigned managed identity
                # This tells Azure which identity to use when resolving Key Vault references in app settings
                # Default behavior is to use system-assigned identity, but we need to explicitly specify UAMI
                Write-InfoMessage "Configuring Key Vault reference identity..."
                
                # Get Function App resource ID for az resource update command
                $functionApp = Get-AzFunctionApp -ResourceGroupName $rg -Name $functionName
                $functionAppResourceId = $functionApp.Id
                
                # Set keyVaultReferenceIdentity property using Azure CLI
                # This property cannot be set directly via PowerShell Az.Functions module
                # We use 'az resource update' to set the property at the ARM resource level
                $azResult = az resource update `
                    --ids $functionAppResourceId `
                    --set properties.keyVaultReferenceIdentity="$identityId" `
                    --output none 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-SuccessMessage "Key Vault reference identity configured to use UAMI"
                }
                else {
                    Write-WarningMessage "Failed to configure Key Vault reference identity: $azResult"
                    Write-InfoMessage "Key Vault references may still work but might use system-assigned identity if present"
                }
                
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
                    
                    # Configure Key Vault references for Google OAuth credentials
                    # These references will be resolved at runtime by the Function App using the managed identity
                    # Format: @Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/<secret-name>)
                    $keyVault = Get-AzKeyVault -ResourceGroupName $rg -VaultName $keyVaultName
                    $vaultUri = $keyVault.VaultUri.TrimEnd('/')
                    
                    # Check if Google OAuth secrets exist in Key Vault before creating references
                    # Store results for reuse to avoid redundant API calls
                    $script:googleClientIdSecret = Get-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-id" -ErrorAction SilentlyContinue
                    $script:googleClientSecretSecret = Get-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-secret" -ErrorAction SilentlyContinue
                    
                    if ($script:googleClientIdSecret -and $script:googleClientSecretSecret) {
                        Write-InfoMessage "Configuring Key Vault references for Google OAuth credentials..."
                        $appSettings["GOOGLE_CLIENT_ID"] = "@Microsoft.KeyVault(SecretUri=$vaultUri/secrets/google-client-id)"
                        $appSettings["GOOGLE_CLIENT_SECRET"] = "@Microsoft.KeyVault(SecretUri=$vaultUri/secrets/google-client-secret)"
                        Write-SuccessMessage "Google OAuth Key Vault references configured"
                    }
                    else {
                        Write-InfoMessage "Google OAuth secrets not found in Key Vault (optional)"
                        Write-InfoMessage "Add 'google-client-id' and 'google-client-secret' to enable Google OAuth"
                    }
                }
            }
            
            # Add App Registration Client ID for JWT audience validation
            # This is required for verifying that JWT tokens are issued for this application.
            # Get the client ID from Azure Portal > App Registrations > Your App > Application (client) ID
            if ($appClientIdValue) {
                $appSettings["AZURE_AD_CLIENT_ID"] = $appClientIdValue
                Write-InfoMessage "App Registration Client ID: $appClientIdValue"
            }
            else {
                Write-WarningMessage "AZURE_AD_CLIENT_ID not configured."
                Write-WarningMessage "JWT audience validation requires the App Registration Client ID."
                Write-WarningMessage "Set 'appRegistrationClientId' in config or use -AppClientId parameter."
                Write-WarningMessage "Find it in Azure Portal: App Registrations > $appRegistrationName > Application (client) ID"
            }
            
            if ($appSettings.Count -gt 0) {
                Write-InfoMessage "Setting application configuration..."
                # Suppress the warning about redacted app settings by using -WarningAction SilentlyContinue
                Update-AzFunctionAppSetting -Name $functionName -ResourceGroupName $rg -AppSetting $appSettings -WarningAction SilentlyContinue | Out-Null
                Write-SuccessMessage "Application settings configured"
            }

            # Configure CORS
            # Note: The Az.Websites module's Set-AzWebApp cmdlet does not have a direct
            # parameter for CORS configuration. We use Azure CLI for CORS settings as it
            # provides a reliable and well-documented approach (same as the bash scripts).
            Write-SectionHeader "Configuring CORS"
            
            Write-InfoMessage "Setting CORS allowed origins..."
            $corsResult = az functionapp cors add `
                --name $functionName `
                --resource-group $rg `
                --allowed-origins $webAppUrl `
                --output none 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-SuccessMessage "CORS configured for $webAppUrl"
            }
            else {
                Write-WarningMessage "Failed to configure CORS: $corsResult"
            }

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
                    
                    # Check if Google OAuth Key Vault references were configured (reuse earlier check)
                    if ($script:googleClientIdSecret -and $script:googleClientSecretSecret) {
                        Write-Host "  Google OAuth:       Configured with Key Vault references"
                    }
                }
                Write-Host ""
            }
            
            Write-Host "Next Steps:"
            Write-Host "  1. Deploy your function code using Azure Functions Core Tools or CI/CD"
            Write-Host "  2. Configure any additional application settings as needed"
            Write-Host "  3. Test the function endpoints"
            
            # Check if Google OAuth secrets exist and show guidance (reuse earlier check)
            if ($kvExists) {
                if (-not $script:googleClientIdSecret -or -not $script:googleClientSecretSecret) {
                    Write-Host "  4. Add Google OAuth secrets to Key Vault to enable Google authentication:"
                    Write-Host "     `$clientId = ConvertTo-SecureString '<your-google-client-id>' -AsPlainText -Force"
                    Write-Host "     Set-AzKeyVaultSecret -VaultName '$keyVaultName' -Name 'google-client-id' -SecretValue `$clientId"
                    Write-Host "     `$clientSecret = ConvertTo-SecureString '<your-google-client-secret>' -AsPlainText -Force"
                    Write-Host "     Set-AzKeyVaultSecret -VaultName '$keyVaultName' -Name 'google-client-secret' -SecretValue `$clientSecret"
                }
                else {
                    Write-Host "  4. Verify Key Vault references in Azure Portal (Environment tab):"
                    Write-Host "     Green checkmark should appear next to GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
                }
            }
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
