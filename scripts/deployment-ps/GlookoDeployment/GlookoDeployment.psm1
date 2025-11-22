#Requires -Version 7.0

# GlookoDeployment PowerShell Module
# Provides functions for deploying GlookoDataWebApp Azure resources

# Get public and private function definition files
$Public = @(Get-ChildItem -Path $PSScriptRoot\Public\*.ps1 -ErrorAction SilentlyContinue)
$Private = @(Get-ChildItem -Path $PSScriptRoot\Private\*.ps1 -ErrorAction SilentlyContinue)

# Dot source the files
foreach ($import in @($Public + $Private)) {
    try {
        . $import.FullName
    }
    catch {
        Write-Error "Failed to import function $($import.FullName): $_"
    }
}

# Export public functions explicitly
Export-ModuleMember -Function @(
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
) -Alias *
