@{
    # Script module or binary module file associated with this manifest
    RootModule = 'GlookoDeployment.psm1'
    
    # Version number of this module
    ModuleVersion = '1.0.0'
    
    # ID used to uniquely identify this module
    GUID = '8b5c3d2e-1f4a-4b6c-9d8e-7f6a5b4c3d2e'
    
    # Author of this module
    Author = 'Igor Iric'
    
    # Company or vendor of this module
    CompanyName = 'GlookoDataWebApp'
    
    # Copyright statement for this module
    Copyright = '(c) 2024 Igor Iric. All rights reserved.'
    
    # Description of the functionality provided by this module
    Description = 'PowerShell module for deploying and managing GlookoDataWebApp Azure resources. Provides functions for creating storage accounts, managed identities, static web apps, and more with centralized configuration management.'
    
    # Minimum version of the PowerShell engine required by this module
    PowerShellVersion = '7.0'
    
    # Functions to export from this module
    FunctionsToExport = @(
        'Get-GlookoConfig',
        'Set-GlookoConfig',
        'Test-GlookoConfig',
        'Initialize-GlookoConfig',
        'Set-GlookoManagedIdentity',
        'Set-GlookoStorageAccount',
        'Set-GlookoTableStorage',
        'Set-GlookoAppRegistration',
        'Set-GlookoStaticWebApp',
        'Invoke-GlookoDeployment'
    )
    
    # Cmdlets to export from this module
    CmdletsToExport = @()
    
    # Variables to export from this module
    VariablesToExport = @()
    
    # Aliases to export from this module
    AliasesToExport = @(
        'Get-GC',
        'Set-GC',
        'Test-GC',
        'Initialize-GC',
        'Set-GMI',
        'Set-GSA',
        'Set-GTS',
        'Set-GAR',
        'Set-GSWA',
        'Invoke-GD'
    )
    
    # Private data to pass to the module specified in RootModule/ModuleToProcess
    PrivateData = @{
        PSData = @{
            # Tags applied to this module to aid in module discovery
            Tags = @('Azure', 'Deployment', 'Glooko', 'Storage', 'ManagedIdentity', 'StaticWebApp')
            
            # A URL to the license for this module
            LicenseUri = 'https://github.com/iricigor/GlookoDataWebApp/blob/main/LICENSE'
            
            # A URL to the main website for this project
            ProjectUri = 'https://github.com/iricigor/GlookoDataWebApp'
            
            # ReleaseNotes of this module
            ReleaseNotes = @'
# Version 1.0.0 (2024-12-19)

## New Features
- Initial release of GlookoDeployment module
- Configuration management functions (Get/Set/Test/Initialize-GlookoConfig)
- Managed identity deployment (Set-GlookoManagedIdentity)
- Storage account deployment (Set-GlookoStorageAccount)
- Master orchestration function (Invoke-GlookoDeployment)
- Support for both managed identity and connection string authentication
- Centralized configuration file (~/.glookodata/config.json)
- Configuration precedence: parameters > env vars > config file > defaults

## Requirements
- PowerShell 7.0 or higher
- Azure CLI installed and configured
- Appropriate Azure permissions
'@
        }
    }
}
