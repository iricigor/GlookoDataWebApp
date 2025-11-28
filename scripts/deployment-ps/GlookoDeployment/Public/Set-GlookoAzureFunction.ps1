#Requires -Version 7.4

<#
.SYNOPSIS
    Creates or updates Azure Function App for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures an Azure Function App for the
    GlookoDataWebApp application. The function app serves as the API backend
    for the Static Web App. It is idempotent and safe to run multiple times.
    
    This script uses Azure CLI (az) instead of Azure PowerShell cmdlets because:
    1. Azure CLI is pre-installed in Azure Cloud Shell (primary target environment)
    2. Consistent syntax between bash and PowerShell versions of scripts
    3. Azure CLI has better cross-platform support for local development
    4. Easier to maintain single set of Azure commands across both script types
    
    To use Azure PowerShell cmdlets instead, you would replace:
    - `az functionapp create` → `New-AzFunctionApp`
    - `az identity show` → `Get-AzUserAssignedIdentity`
    - `az role assignment create` → `New-AzRoleAssignment`
    - etc.

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
    Requires Azure CLI to be installed and logged in.
    Run in Azure Cloud Shell for best experience.
    
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
            
            if (-not (Test-AzureCli)) {
                throw "Azure CLI is not available. Please install Azure CLI."
            }
            Write-SuccessMessage "Azure CLI is installed"
            
            if (-not (Test-AzureLogin)) {
                throw "Not logged in to Azure. Please run 'az login'"
            }
            Write-SuccessMessage "Logged in to Azure"
            
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
                
                & az functionapp create `
                    --name $functionName `
                    --resource-group $rg `
                    --storage-account $storageName `
                    --consumption-plan-location $loc `
                    --runtime $Runtime `
                    --runtime-version $RuntimeVersion `
                    --functions-version "4" `
                    --os-type "Linux" `
                    --tags Application=GlookoDataWebApp Environment=Production ManagedBy=AzureDeploymentScripts `
                    --output none
                
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to create function app"
                }
                
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
            #   - Use `az functionapp identity assign --name $functionName --resource-group $rg` (no --identities param)
            #   - Get principal ID from the response to assign RBAC roles
            # - Security: Both types are equally secure; choice depends on management preference
            if ($useMI -and $miExists) {
                Write-SectionHeader "Configuring User-Assigned Managed Identity"
                
                # Get managed identity resource ID (user-assigned identity)
                $identityId = & az identity show `
                    --name $identityName `
                    --resource-group $rg `
                    --query id `
                    --output tsv
                
                Write-InfoMessage "Assigning user-assigned managed identity to function app..."
                
                # Assign user-assigned managed identity to the function app
                # The --identities parameter specifies user-assigned identity (vs system-assigned)
                & az functionapp identity assign `
                    --name $functionName `
                    --resource-group $rg `
                    --identities $identityId `
                    --output none
                
                Write-SuccessMessage "User-assigned managed identity assigned"
                
                # Configure RBAC roles
                if (-not $SkipRbacAssignment) {
                    Write-SectionHeader "Configuring RBAC Roles"
                    
                    # Get principal ID
                    $principalId = & az identity show `
                        --name $identityName `
                        --resource-group $rg `
                        --query principalId `
                        --output tsv
                    
                    # Get storage account ID
                    $storageId = & az storage account show `
                        --name $storageName `
                        --resource-group $rg `
                        --query id `
                        --output tsv
                    
                    # Assign Storage Table Data Contributor
                    Write-InfoMessage "Assigning 'Storage Table Data Contributor' role..."
                    $result = & az role assignment create `
                        --assignee $principalId `
                        --role "Storage Table Data Contributor" `
                        --scope $storageId `
                        --output json 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-SuccessMessage "Storage Table Data Contributor role assigned"
                    }
                    elseif ($result -match "already exists") {
                        Write-WarningMessage "Storage Table Data Contributor role already assigned"
                    }
                    else {
                        Write-WarningMessage "Failed to assign Storage Table Data Contributor role"
                    }
                    
                    # Assign Storage Blob Data Contributor
                    Write-InfoMessage "Assigning 'Storage Blob Data Contributor' role..."
                    $result = & az role assignment create `
                        --assignee $principalId `
                        --role "Storage Blob Data Contributor" `
                        --scope $storageId `
                        --output json 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-SuccessMessage "Storage Blob Data Contributor role assigned"
                    }
                    elseif ($result -match "already exists") {
                        Write-WarningMessage "Storage Blob Data Contributor role already assigned"
                    }
                    else {
                        Write-WarningMessage "Failed to assign Storage Blob Data Contributor role"
                    }
                    
                    # Assign Key Vault access if KV exists
                    if ($kvExists) {
                        $kvId = & az keyvault show `
                            --name $keyVaultName `
                            --resource-group $rg `
                            --query id `
                            --output tsv
                        
                        Write-InfoMessage "Assigning 'Key Vault Secrets User' role..."
                        $result = & az role assignment create `
                            --assignee $principalId `
                            --role "Key Vault Secrets User" `
                            --scope $kvId `
                            --output json 2>&1
                        if ($LASTEXITCODE -eq 0) {
                            Write-SuccessMessage "Key Vault Secrets User role assigned"
                        }
                        elseif ($result -match "already exists") {
                            Write-WarningMessage "Key Vault Secrets User role already assigned"
                        }
                        else {
                            Write-WarningMessage "Failed to assign Key Vault Secrets User role"
                        }
                    }
                }
            }

            # Configure app settings
            Write-SectionHeader "Configuring Application Settings"
            
            $settings = @()
            
            if ($useMI -and $miExists) {
                $clientId = & az identity show `
                    --name $identityName `
                    --resource-group $rg `
                    --query clientId `
                    --output tsv
                
                $settings += "AZURE_CLIENT_ID=$clientId"
                $settings += "STORAGE_ACCOUNT_NAME=$storageName"
                
                if ($kvExists) {
                    $settings += "KEY_VAULT_NAME=$keyVaultName"
                }
            }
            
            $settings += "CORS_ALLOWED_ORIGINS=$webAppUrl"
            
            if ($settings.Count -gt 0) {
                Write-InfoMessage "Setting application configuration..."
                & az functionapp config appsettings set `
                    --name $functionName `
                    --resource-group $rg `
                    --settings @settings `
                    --output none
                
                Write-SuccessMessage "Application settings configured"
            }

            # Configure CORS
            Write-SectionHeader "Configuring CORS"
            
            Write-InfoMessage "Setting CORS allowed origins..."
            & az functionapp cors add `
                --name $functionName `
                --resource-group $rg `
                --allowed-origins $webAppUrl `
                --output none 2>$null
            
            Write-SuccessMessage "CORS configured for $webAppUrl"

            # Get function app URL
            $functionUrl = & az functionapp show `
                --name $functionName `
                --resource-group $rg `
                --query defaultHostName `
                --output tsv

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
