#Requires -Version 7.4
#Requires -Modules Az.Accounts, Az.Resources, Az.Storage, Az.Functions, Az.KeyVault, Az.ManagedServiceIdentity, Az.Websites

<#
.SYNOPSIS
    Tests and verifies the Azure deployment state for GlookoDataWebApp.

.DESCRIPTION
    This function verifies the current deployment state of Azure resources for the
    GlookoDataWebApp application. For each resource, it reports one of three states:
    - not existing
    - existing, misconfigured
    - existing, configured properly
    
    This script uses native Azure PowerShell cmdlets (Az module) for:
    1. Native PowerShell experience in Azure Cloud Shell PowerShell flavor
    2. Better integration with PowerShell objects and pipeline
    3. Consistent with PowerShell best practices
    4. Full support for PowerShell error handling and verbose output

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER OutputFormat
    Output format: 'Console' for human-readable output or 'Object' for PowerShell objects.
    Default: Console

.PARAMETER Verbose
    Enable verbose output with additional details about misconfigured resources.

.EXAMPLE
    Test-GlookoDeployment
    Verifies all resources with default configuration.

.EXAMPLE
    Test-GlookoDeployment -ResourceGroup "my-rg"
    Verifies resources in the specified resource group.

.EXAMPLE
    Test-GlookoDeployment -OutputFormat Object
    Returns results as a PowerShell object for pipeline processing.

.EXAMPLE
    Test-GlookoDeployment | ConvertTo-Json
    Outputs verification results as JSON.

.NOTES
    Requires Az PowerShell modules to be installed.
    Run in Azure Cloud Shell (PowerShell) for best experience.
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
#>
function Test-GlookoDeployment {
    [CmdletBinding()]
    [Alias("Test-GD")]
    param(
        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [ValidateSet('Console', 'Object')]
        [string]$OutputFormat = 'Console'
    )

    begin {
        # Status constants
        $STATUS_NOT_EXISTING = "not existing"
        $STATUS_MISCONFIGURED = "existing, misconfigured"
        $STATUS_CONFIGURED = "existing, configured properly"

        # Results collection
        $results = @{
            Summary = @{
                Total = 0
                Existing = 0
                Configured = 0
                Misconfigured = 0
                Missing = 0
            }
            Resources = @{}
            Configuration = @{}
        }

        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence (params > config)
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $storageAccountName = $config.storageAccountName
        $managedIdentityName = $config.managedIdentityName
        $functionAppName = $config.functionAppName
        $keyVaultName = $config.keyVaultName
        $staticWebAppName = $config.staticWebAppName
        $staticWebAppSku = $config.staticWebAppSku
        $webAppUrl = $config.webAppUrl
        $useManagedIdentity = $config.useManagedIdentity
        $location = $config.location

        # Store configuration in results
        $results.Configuration = @{
            resourceGroup = $rg
            location = $location
            storageAccountName = $storageAccountName
            managedIdentityName = $managedIdentityName
            functionAppName = $functionAppName
            keyVaultName = $keyVaultName
            staticWebAppName = $staticWebAppName
        }

        # Helper function to record results
        function Record-Result {
            param(
                [string]$ResourceName,
                [string]$ResourceType,
                [string]$Status,
                [string]$Details = ""
            )
            
            $results.Summary.Total++
            
            switch ($Status) {
                $STATUS_NOT_EXISTING {
                    $results.Summary.Missing++
                }
                $STATUS_MISCONFIGURED {
                    $results.Summary.Existing++
                    $results.Summary.Misconfigured++
                }
                $STATUS_CONFIGURED {
                    $results.Summary.Existing++
                    $results.Summary.Configured++
                }
            }
            
            $results.Resources[$ResourceType] = @{
                Name = $ResourceName
                Status = $Status
                Details = $Details
            }
            
            if ($OutputFormat -eq 'Console') {
                switch ($Status) {
                    $STATUS_NOT_EXISTING {
                        Write-ErrorMessage "${ResourceName}: ${Status}"
                    }
                    $STATUS_MISCONFIGURED {
                        Write-WarningMessage "${ResourceName}: ${Status}"
                        if ($Details -and $VerbosePreference -eq 'Continue') {
                            Write-Host "    Details: $Details" -ForegroundColor Yellow
                        }
                    }
                    $STATUS_CONFIGURED {
                        Write-SuccessMessage "${ResourceName}: ${Status}"
                    }
                }
            }
        }

        if ($OutputFormat -eq 'Console') {
            Write-SectionHeader "Azure Deployment Verification"
            Write-InfoMessage "Resource Group: $rg"
            Write-InfoMessage "Location: $location"
        }
    }

    process {
        try {
            # Check prerequisites
            if ($OutputFormat -eq 'Console') {
                Write-SectionHeader "Checking Prerequisites"
            }
            
            if (-not (Test-AzureConnection)) {
                throw "Not connected to Azure. Please run 'Connect-AzAccount'"
            }
            
            if ($OutputFormat -eq 'Console') {
                Write-SuccessMessage "Connected to Azure"
                Write-SectionHeader "Verifying Resources"
            }

            # Verify Resource Group
            try {
                $rgResource = Get-AzResourceGroup -Name $rg -ErrorAction Stop
                if ($rgResource.Tags -and $rgResource.Tags.Count -gt 0) {
                    Record-Result -ResourceName "Resource Group '$rg'" -ResourceType "resourceGroup" -Status $STATUS_CONFIGURED
                }
                else {
                    Record-Result -ResourceName "Resource Group '$rg'" -ResourceType "resourceGroup" -Status $STATUS_MISCONFIGURED -Details "Missing tags"
                }
            }
            catch {
                Record-Result -ResourceName "Resource Group '$rg'" -ResourceType "resourceGroup" -Status $STATUS_NOT_EXISTING
            }

            # Verify Storage Account
            try {
                $storage = Get-AzStorageAccount -ResourceGroupName $rg -Name $storageAccountName -ErrorAction Stop
                $issues = @()
                
                if ($storage.MinimumTlsVersion -ne 'TLS1_2') {
                    $issues += "TLS version is $($storage.MinimumTlsVersion), expected TLS1_2"
                }
                if ($storage.AllowBlobPublicAccess -eq $true) {
                    $issues += "Public blob access is enabled"
                }
                if ($storage.EnableHttpsTrafficOnly -ne $true) {
                    $issues += "HTTPS-only traffic not enforced"
                }
                
                if ($issues.Count -gt 0) {
                    Record-Result -ResourceName "Storage Account '$storageAccountName'" -ResourceType "storageAccount" -Status $STATUS_MISCONFIGURED -Details ($issues -join "; ")
                }
                else {
                    Record-Result -ResourceName "Storage Account '$storageAccountName'" -ResourceType "storageAccount" -Status $STATUS_CONFIGURED
                }
            }
            catch {
                Record-Result -ResourceName "Storage Account '$storageAccountName'" -ResourceType "storageAccount" -Status $STATUS_NOT_EXISTING
            }

            # Verify Managed Identity
            try {
                $identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $managedIdentityName -ErrorAction Stop
                
                if ([string]::IsNullOrEmpty($identity.ClientId) -or [string]::IsNullOrEmpty($identity.PrincipalId)) {
                    Record-Result -ResourceName "Managed Identity '$managedIdentityName'" -ResourceType "managedIdentity" -Status $STATUS_MISCONFIGURED -Details "Missing client ID or principal ID"
                }
                else {
                    Record-Result -ResourceName "Managed Identity '$managedIdentityName'" -ResourceType "managedIdentity" -Status $STATUS_CONFIGURED
                }
            }
            catch {
                Record-Result -ResourceName "Managed Identity '$managedIdentityName'" -ResourceType "managedIdentity" -Status $STATUS_NOT_EXISTING
            }

            # Verify Function App
            try {
                $funcApp = Get-AzFunctionApp -ResourceGroupName $rg -Name $functionAppName -ErrorAction Stop
                $issues = @()
                
                # Check managed identity assignment
                if ($useManagedIdentity) {
                    if (-not $funcApp.IdentityUserAssignedIdentity -or $funcApp.IdentityUserAssignedIdentity.Count -eq 0) {
                        $issues += "No managed identity assigned"
                    }
                    else {
                        $identityAssigned = $false
                        foreach ($id in $funcApp.IdentityUserAssignedIdentity.Keys) {
                            if ($id -like "*$managedIdentityName*") {
                                $identityAssigned = $true
                                break
                            }
                        }
                        if (-not $identityAssigned) {
                            $issues += "Expected managed identity not assigned"
                        }
                    }
                }
                
                # Check CORS configuration
                if ($funcApp.CorsAllowedOrigin) {
                    if (-not ($funcApp.CorsAllowedOrigin -contains $webAppUrl)) {
                        $issues += "Web app URL not in CORS origins"
                    }
                }
                else {
                    $issues += "No CORS origins configured"
                }
                
                if ($issues.Count -gt 0) {
                    Record-Result -ResourceName "Function App '$functionAppName'" -ResourceType "functionApp" -Status $STATUS_MISCONFIGURED -Details ($issues -join "; ")
                }
                else {
                    Record-Result -ResourceName "Function App '$functionAppName'" -ResourceType "functionApp" -Status $STATUS_CONFIGURED
                }
            }
            catch {
                Record-Result -ResourceName "Function App '$functionAppName'" -ResourceType "functionApp" -Status $STATUS_NOT_EXISTING
            }

            # Verify Key Vault
            try {
                $kv = Get-AzKeyVault -ResourceGroupName $rg -VaultName $keyVaultName -ErrorAction Stop
                $issues = @()
                
                if (-not $kv.EnableRbacAuthorization) {
                    $issues += "RBAC authorization not enabled"
                }
                if (-not $kv.EnableSoftDelete) {
                    $issues += "Soft delete not enabled"
                }
                
                if ($issues.Count -gt 0) {
                    Record-Result -ResourceName "Key Vault '$keyVaultName'" -ResourceType "keyVault" -Status $STATUS_MISCONFIGURED -Details ($issues -join "; ")
                }
                else {
                    Record-Result -ResourceName "Key Vault '$keyVaultName'" -ResourceType "keyVault" -Status $STATUS_CONFIGURED
                }
            }
            catch {
                Record-Result -ResourceName "Key Vault '$keyVaultName'" -ResourceType "keyVault" -Status $STATUS_NOT_EXISTING
            }

            # Verify Static Web App
            try {
                $swa = Get-AzStaticWebApp -ResourceGroupName $rg -Name $staticWebAppName -ErrorAction Stop
                $issues = @()
                
                if ($swa.SkuName -ne $staticWebAppSku) {
                    $issues += "SKU is $($swa.SkuName), expected $staticWebAppSku"
                }
                
                if ($issues.Count -gt 0) {
                    Record-Result -ResourceName "Static Web App '$staticWebAppName'" -ResourceType "staticWebApp" -Status $STATUS_MISCONFIGURED -Details ($issues -join "; ")
                }
                else {
                    Record-Result -ResourceName "Static Web App '$staticWebAppName'" -ResourceType "staticWebApp" -Status $STATUS_CONFIGURED
                }
            }
            catch {
                Record-Result -ResourceName "Static Web App '$staticWebAppName'" -ResourceType "staticWebApp" -Status $STATUS_NOT_EXISTING
            }

            # Verify RBAC Role Assignments
            try {
                $identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $managedIdentityName -ErrorAction Stop
                $principalId = $identity.PrincipalId
                $issues = @()
                
                # Check storage account role assignments
                try {
                    $storage = Get-AzStorageAccount -ResourceGroupName $rg -Name $storageAccountName -ErrorAction Stop
                    $storageId = $storage.Id
                    
                    # Check for Storage Table Data Contributor
                    $tableRole = Get-AzRoleAssignment -ObjectId $principalId -Scope $storageId -RoleDefinitionName "Storage Table Data Contributor" -ErrorAction SilentlyContinue
                    if (-not $tableRole) {
                        $issues += "Missing Storage Table Data Contributor role"
                    }
                    
                    # Check for Storage Blob Data Contributor
                    $blobRole = Get-AzRoleAssignment -ObjectId $principalId -Scope $storageId -RoleDefinitionName "Storage Blob Data Contributor" -ErrorAction SilentlyContinue
                    if (-not $blobRole) {
                        $issues += "Missing Storage Blob Data Contributor role"
                    }
                }
                catch {
                    # Storage account doesn't exist, skip role check
                }
                
                # Check key vault role assignments
                try {
                    $kv = Get-AzKeyVault -ResourceGroupName $rg -VaultName $keyVaultName -ErrorAction Stop
                    $kvId = $kv.ResourceId
                    
                    # Check for Key Vault Secrets User
                    $kvRole = Get-AzRoleAssignment -ObjectId $principalId -Scope $kvId -RoleDefinitionName "Key Vault Secrets User" -ErrorAction SilentlyContinue
                    if (-not $kvRole) {
                        $issues += "Missing Key Vault Secrets User role"
                    }
                }
                catch {
                    # Key vault doesn't exist, skip role check
                }
                
                if ($issues.Count -gt 0) {
                    Record-Result -ResourceName "RBAC Role Assignments" -ResourceType "rbacRoles" -Status $STATUS_MISCONFIGURED -Details ($issues -join "; ")
                }
                else {
                    Record-Result -ResourceName "RBAC Role Assignments" -ResourceType "rbacRoles" -Status $STATUS_CONFIGURED
                }
            }
            catch {
                # Managed identity doesn't exist, skip RBAC check
            }

            # Display summary
            if ($OutputFormat -eq 'Console') {
                Write-SectionHeader "Verification Summary"
                
                Write-Host "  Total Resources Checked:    $($results.Summary.Total)"
                Write-Host "  Existing Resources:         $($results.Summary.Existing)"
                Write-Host "  Properly Configured:        $($results.Summary.Configured)"
                Write-Host "  Misconfigured:              $($results.Summary.Misconfigured)"
                Write-Host "  Missing:                    $($results.Summary.Missing)"
                Write-Host ""
                
                if ($results.Summary.Missing -eq 0 -and $results.Summary.Misconfigured -eq 0) {
                    Write-SuccessMessage "All resources are properly configured!"
                }
                elseif ($results.Summary.Missing -gt 0) {
                    Write-WarningMessage "Some resources are missing. Run deployment scripts to create them."
                }
                elseif ($results.Summary.Misconfigured -gt 0) {
                    Write-WarningMessage "Some resources are misconfigured. Use -Verbose for details."
                }
            }

            # Return results object if requested
            if ($OutputFormat -eq 'Object') {
                return [PSCustomObject]$results
            }

            # Return success/failure
            return ($results.Summary.Missing -eq 0 -and $results.Summary.Misconfigured -eq 0)
        }
        catch {
            Write-ErrorMessage "Verification failed: $_"
            throw
        }
    }

    end {
        if ($OutputFormat -eq 'Console') {
            Write-SectionHeader "Verification Complete"
        }
    }
}
