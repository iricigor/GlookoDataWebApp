#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Websites

<#
.SYNOPSIS
    Creates or updates an Azure Static Web App for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures an Azure Static Web App for the
    GlookoDataWebApp application. It is idempotent and safe to run multiple times.
    
    The script automatically configures Google authentication if the following
    secrets exist in the configured Key Vault:
    - google-client-id: Google OAuth 2.0 Client ID
    - google-client-secret: Google OAuth 2.0 Client Secret
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER Name
    The name of the Static Web App. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.PARAMETER Sku
    The SKU for the Static Web App (Free, Standard). Default: Standard

.PARAMETER AssignManagedIdentity
    Assign a user-assigned managed identity to the Static Web App.

.EXAMPLE
    Set-GlookoStaticWebApp
    Creates a Static Web App with default configuration.

.EXAMPLE
    Set-GlookoStaticWebApp -Name "my-swa" -Location "westus2"
    Creates a Static Web App with custom name and location.

.EXAMPLE
    Set-GlookoStaticWebApp -Sku "Free"
    Creates a free tier Static Web App.

.EXAMPLE
    Set-GlookoStaticWebApp -AssignManagedIdentity
    Creates a Static Web App with user-assigned managed identity.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    
    Prerequisites:
    - Resource group must exist (or will be created)
    - User-Assigned Managed Identity should exist (for identity assignment)
    - Key Vault with Google auth secrets (optional, for Google authentication):
      * google-client-id
      * google-client-secret
    - Azure CLI must be available in PATH (for setting SWA app settings)
#>
function Set-GlookoStaticWebApp {
    [CmdletBinding()]
    [Alias("Set-GSWA")]
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location,

        [Parameter()]
        [ValidateSet('Free', 'Standard')]
        [string]$Sku = 'Standard',

        [Parameter()]
        [switch]$AssignManagedIdentity
    )

    begin {
        Write-SectionHeader "Azure Static Web App Deployment"
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config > defaults)
        $swaName = if ($Name) { $Name } else { $config.staticWebAppName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
        $identityName = $config.managedIdentityName
        $assignMI = if ($PSBoundParameters.ContainsKey('AssignManagedIdentity')) { $AssignManagedIdentity.IsPresent } else { $config.useManagedIdentity }
        
        # Use SKU from config if not specified
        if (-not $PSBoundParameters.ContainsKey('Sku')) {
            $Sku = if ($config.staticWebAppSku) { $config.staticWebAppSku } else { 'Standard' }
        }
        
        Write-InfoMessage "Static Web App: $swaName"
        Write-InfoMessage "Resource Group: $rg"
        Write-InfoMessage "Location: $loc"
        Write-InfoMessage "SKU: $Sku"
    }

    process {
        try {
            # Check prerequisites
            Write-SectionHeader "Checking Prerequisites"
            
            if (-not (Test-AzureConnection)) {
                throw "Not connected to Azure. Please run 'Connect-AzAccount'"
            }
            Write-SuccessMessage "Connected to Azure"
            
            # Check for managed identity if using MI
            $miExists = $false
            if ($assignMI) {
                if (Test-AzureResource -ResourceType 'identity' -Name $identityName -ResourceGroup $rg) {
                    Write-SuccessMessage "Managed identity '$identityName' exists"
                    $miExists = $true
                }
                else {
                    Write-WarningMessage "Managed identity '$identityName' not found. Identity assignment will be skipped."
                }
            }
            
            # Ensure resource group exists
            Initialize-GlookoResourceGroup -Name $rg -Location $loc -Tags @{
                Application = "GlookoDataWebApp"
                Environment = "Production"
                ManagedBy   = "AzureDeploymentScripts"
            }

            # Create Static Web App
            Write-SectionHeader "Creating Azure Static Web App"
            
            $created = $false
            if (Test-AzureResource -ResourceType 'staticwebapp' -Name $swaName -ResourceGroup $rg) {
                Write-WarningMessage "Static Web App '$swaName' already exists"
                $swa = Get-AzStaticWebApp -ResourceGroupName $rg -Name $swaName
            }
            else {
                Write-InfoMessage "Creating Static Web App '$swaName'..."
                
                $swaParams = @{
                    Name              = $swaName
                    ResourceGroupName = $rg
                    Location          = $loc
                    SkuName           = $Sku
                    Tag               = @{
                        Application = "GlookoDataWebApp"
                        Environment = "Production"
                        ManagedBy   = "AzureDeploymentScripts"
                    }
                }
                
                $swa = New-AzStaticWebApp @swaParams
                
                Write-SuccessMessage "Static Web App created successfully"
                $created = $true
            }

            # Assign managed identity if requested and available
            if ($assignMI -and $miExists) {
                Write-SectionHeader "Configuring User-Assigned Managed Identity"
                
                # Get managed identity
                $identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $identityName
                $identityId = $identity.Id
                
                Write-InfoMessage "Assigning user-assigned managed identity to Static Web App..."
                
                # Check if identity is already assigned
                $swa = Get-AzStaticWebApp -ResourceGroupName $rg -Name $swaName
                $identityAlreadyAssigned = $false
                
                if ($swa.IdentityUserAssignedIdentity) {
                    foreach ($id in $swa.IdentityUserAssignedIdentity.Keys) {
                        if ($id -like "*$identityName*") {
                            $identityAlreadyAssigned = $true
                            break
                        }
                    }
                }
                
                if ($identityAlreadyAssigned) {
                    Write-WarningMessage "User-assigned managed identity already assigned"
                }
                else {
                    # Assign user-assigned managed identity to the Static Web App
                    Update-AzStaticWebApp -Name $swaName -ResourceGroupName $rg -IdentityType UserAssigned -IdentityUserAssignedIdentity @{$identityId = @{}} | Out-Null
                    Write-SuccessMessage "User-assigned managed identity assigned"
                }
            }

            # Configure Google Authentication
            Write-SectionHeader "Configuring Google Authentication"
            
            $keyVaultName = $config.keyVaultName
            $googleAuthConfigured = $false
            
            # Use a status flag to avoid nested if/else (Continuance Pattern)
            $continueGoogleAuth = $true
            
            try {
                # Check if Key Vault exists
                if (-not (Test-AzureResource -ResourceType 'keyvault' -Name $keyVaultName -ResourceGroup $rg)) {
                    Write-WarningMessage "Key Vault '$keyVaultName' not found. Skipping Google authentication configuration."
                    Write-InfoMessage "Run Set-GlookoKeyVault to create the Key Vault first"
                    $continueGoogleAuth = $false
                }
                
                # Retrieve secrets from Key Vault
                if ($continueGoogleAuth) {
                    Write-InfoMessage "Retrieving Google auth secrets from Key Vault '$keyVaultName'..."
                    
                    # Retrieve Google Client ID and Secret from Key Vault
                    # Authentication: Uses the current Azure PowerShell session credentials (from Connect-AzAccount)
                    # Required permissions: "Key Vault Secrets User" role or "Get" permission on secrets in Key Vault access policies
                    # The secrets are retrieved as SecureString objects to minimize exposure in memory
                    $googleClientIdSecretObj = Get-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-id" -ErrorAction SilentlyContinue
                    $googleClientSecretSecretObj = Get-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-secret" -ErrorAction SilentlyContinue
                    
                    # Check if secrets exist
                    if (-not $googleClientIdSecretObj -or -not $googleClientSecretSecretObj) {
                        Write-WarningMessage "Google auth secrets not found in Key Vault"
                        Write-InfoMessage "Expected secrets: 'google-client-id' and 'google-client-secret'"
                        Write-InfoMessage "Add them to Key Vault '$keyVaultName' to enable Google authentication"
                        $continueGoogleAuth = $false
                    }
                }
                
                # Configure Google authentication
                if ($continueGoogleAuth) {
                    Write-InfoMessage "Configuring Google authentication for Static Web App..."
                    
                    # Convert SecureString to plain text only when needed for Azure CLI
                    # Azure CLI is used because Az.Websites module doesn't support Static Web App app settings
                    # Note: The plain text values exist only briefly in memory during the az CLI call
                    $googleClientId = $googleClientIdSecretObj.SecretValue | ConvertFrom-SecureString -AsPlainText
                    $googleClientSecret = $googleClientSecretSecretObj.SecretValue | ConvertFrom-SecureString -AsPlainText
                    
                    # Set SWA application settings using Azure CLI
                    # Authentication: Uses current Azure CLI session (from 'az login')
                    # The az CLI command runs in the same security context as this PowerShell session
                    $azCliResult = az staticwebapp appsettings set `
                        --name $swaName `
                        --resource-group $rg `
                        --setting-names "AUTH_GOOGLE_CLIENT_ID=$googleClientId" "AUTH_GOOGLE_CLIENT_SECRET=$googleClientSecret" `
                        2>&1
                    
                    # Clear sensitive variables from memory
                    $googleClientId = $null
                    $googleClientSecret = $null
                    
                    # Check if Azure CLI command succeeded
                    if ($LASTEXITCODE -eq 0) {
                        Write-SuccessMessage "Google authentication configured successfully"
                        $googleAuthConfigured = $true
                    }
                    else {
                        Write-WarningMessage "Failed to configure Google authentication via Azure CLI: $azCliResult"
                    }
                }
            }
            catch {
                Write-WarningMessage "Failed to configure Google authentication: $_"
                Write-InfoMessage "You can configure it manually later"
            }

            # Get Static Web App details
            $swa = Get-AzStaticWebApp -ResourceGroupName $rg -Name $swaName
            $swaUrl = "https://$($swa.DefaultHostname)"

            # Display summary
            Write-SectionHeader "Deployment Summary"
            
            Write-SuccessMessage "Azure Static Web App deployed successfully!"
            Write-Host ""
            Write-Host "  Resource Group:        $rg"
            Write-Host "  Static Web App Name:   $swaName"
            Write-Host "  Location:              $loc"
            Write-Host "  SKU:                   $Sku"
            Write-Host "  Default URL:           $swaUrl"
            Write-Host ""
            
            if ($assignMI -and $miExists) {
                Write-Host "  Managed Identity:      $identityName"
                Write-Host ""
            }
            
            if ($googleAuthConfigured) {
                Write-Host "  Google Authentication: Enabled"
                Write-Host "  Login URL:             $swaUrl/.auth/login/google"
                Write-Host ""
            }
            
            Write-Host "Next Steps:"
            Write-Host "  1. Deploy your web app code using GitHub Actions or Azure CLI"
            Write-Host "  2. Link a backend using Set-GlookoSwaBackend if needed"
            Write-Host "  3. Configure custom domain if needed"
            if ($googleAuthConfigured) {
                Write-Host "  4. Test Google authentication by visiting $swaUrl/.auth/login/google"
            }
            else {
                Write-Host "  4. Add Google auth secrets to Key Vault to enable Google authentication:"
                Write-Host "     - google-client-id"
                Write-Host "     - google-client-secret"
            }
            Write-Host ""

            # Return deployment details
            return @{
                Name              = $swaName
                ResourceGroup     = $rg
                Location          = $loc
                Sku               = $Sku
                DefaultUrl        = $swaUrl
                Created           = $created
                ManagedIdentity   = if ($assignMI -and $miExists) { $identityName } else { $null }
                GoogleAuthEnabled = $googleAuthConfigured
            }
        }
        catch {
            Write-ErrorMessage "Failed to deploy Static Web App: $_"
            throw
        }
    }

    end {
        Write-SectionHeader "Deployment Complete"
    }
}
