@{
    # Module manifest for GlookoDeployment
    # Generated for GlookoDataWebApp Azure infrastructure deployment

    # Script module or binary module file associated with this manifest
    RootModule = 'GlookoDeployment.psm1'

    # Version number of this module
    # NOTE: Bump this version when adding/updating scripts (see copilot-instructions.md)
    ModuleVersion = '1.0.13'

    # ID used to uniquely identify this module
    GUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

    # Author of this module
    Author = 'GlookoDataWebApp Team'

    # Company or vendor of this module
    CompanyName = 'GlookoDataWebApp'

    # Copyright statement for this module
    Copyright = '(c) 2024 GlookoDataWebApp. All rights reserved.'

    # Description of the functionality provided by this module
    Description = 'PowerShell module for deploying Azure infrastructure for GlookoDataWebApp'

    # Minimum version of the PowerShell engine required by this module
    # PowerShell 7.4+ required for security (earlier versions have known vulnerabilities)
    # Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle
    PowerShellVersion = '7.4'

    # Modules that must be imported into the global environment prior to importing this module
    RequiredModules = @(
        @{ ModuleName = 'Az.Accounts'; ModuleVersion = '2.0.0' }
        @{ ModuleName = 'Az.Resources'; ModuleVersion = '6.0.0' }
        @{ ModuleName = 'Az.Storage'; ModuleVersion = '5.0.0' }
        @{ ModuleName = 'Az.Functions'; ModuleVersion = '4.0.0' }
        @{ ModuleName = 'Az.KeyVault'; ModuleVersion = '4.0.0' }
        @{ ModuleName = 'Az.ManagedServiceIdentity'; ModuleVersion = '1.0.0' }
        @{ ModuleName = 'Az.Websites'; ModuleVersion = '3.0.0' }
    )

    # Functions to export from this module
    FunctionsToExport = @(
        'Get-GlookoConfig',
        'Set-GlookoConfig',
        'Test-GlookoConfig',
        'Initialize-GlookoConfig',
        'Set-GlookoResourceGroup',
        'Set-GlookoStorageAccount',
        'Set-GlookoTableStorage',
        'Set-GlookoManagedIdentity',
        'Set-GlookoKeyVault',
        'Set-GlookoAzureFunction',
        'Set-GlookoSwaBackend',
        'Invoke-GlookoDeployment',
        'Test-GlookoDeployment'
    )

    # Aliases to export from this module
    AliasesToExport = @(
        'Get-GC',
        'Set-GC',
        'Test-GC',
        'Initialize-GC',
        'Set-GRG',
        'Set-GSA',
        'Set-GTS',
        'Set-GMI',
        'Set-GKV',
        'Set-GAF',
        'Set-GSB',
        'Invoke-GD',
        'Test-GD'
    )

    # Variables to export from this module
    VariablesToExport = @()

    # Cmdlets to export from this module
    CmdletsToExport = @()

    # Private data to pass to the module specified in RootModule/ModuleToProcess
    PrivateData = @{
        PSData = @{
            # Tags applied to this module
            Tags = @('Azure', 'Deployment', 'GlookoDataWebApp', 'Functions', 'Infrastructure')

            # A URL to the license for this module
            LicenseUri = 'https://github.com/iricigor/GlookoDataWebApp/blob/main/LICENSE'

            # A URL to the main website for this project
            ProjectUri = 'https://github.com/iricigor/GlookoDataWebApp'

            # ReleaseNotes of this module
            ReleaseNotes = @"
v1.0.13 - Added Set-GlookoKeyVault for Azure Key Vault deployment with RBAC and managed identity support
v1.0.12 - Added SWA backend linking verification to Test-GlookoDeployment
v1.0.11 - Added Set-GlookoSwaBackend for linking Azure Function App to Static Web App as backend
v1.0.10 - Added version display when downloading/installing the module
v1.0.9 - Fixed Set-GlookoResourceGroup and Initialize-GlookoResourceGroup to add missing tags on existing resource groups
v1.0.8 - Added Set-GlookoResourceGroup for creating Azure Resource Groups
v1.0.7 - Fixed CORS configuration in Set-GlookoAzureFunction using Azure CLI instead of non-existent Set-AzWebApp parameter
v1.0.6 - Fixed Install-GlookoDeploymentModule to download all public functions including Test-GlookoDeployment, Set-GlookoStorageAccount, and Set-GlookoTableStorage
v1.0.5 - Added Test-GlookoDeployment for verifying Azure deployment state
v1.0.4 - Added Set-GlookoTableStorage for Azure Storage Tables deployment with managed identity RBAC support
v1.0.3 - Added Set-GlookoStorageAccount for Azure Storage Account deployment
v1.0.2 - Added Set-GlookoManagedIdentity function for creating user-assigned managed identities
v1.0.1 - Migrated from Azure CLI to native Az PowerShell cmdlets, added versioning guidelines, PowerShell 7.4+ requirement
v1.0.0 - Initial release with Azure Function App deployment support
"@
        }
    }
}
