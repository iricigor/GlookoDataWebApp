#Requires -Version 7.0

<#
.SYNOPSIS
    GlookoDeployment PowerShell Module Loader

.DESCRIPTION
    This module provides functions for deploying Azure infrastructure for GlookoDataWebApp.
    It includes functions for managing configuration, deploying Azure resources, and
    orchestrating complete deployments.

.NOTES
    Requires PowerShell 7.0 or later
    Requires Azure CLI to be installed and logged in
#>

# Get the module path
$ModulePath = $PSScriptRoot

# Import private functions
$PrivateFunctions = Get-ChildItem -Path "$ModulePath\Private\*.ps1" -ErrorAction SilentlyContinue
foreach ($Function in $PrivateFunctions) {
    try {
        . $Function.FullName
        Write-Verbose "Imported private function: $($Function.BaseName)"
    }
    catch {
        Write-Warning "Failed to import private function: $($Function.FullName)"
        Write-Warning $_.Exception.Message
    }
}

# Import public functions
$PublicFunctions = Get-ChildItem -Path "$ModulePath\Public\*.ps1" -ErrorAction SilentlyContinue
foreach ($Function in $PublicFunctions) {
    try {
        . $Function.FullName
        Write-Verbose "Imported public function: $($Function.BaseName)"
    }
    catch {
        Write-Warning "Failed to import public function: $($Function.FullName)"
        Write-Warning $_.Exception.Message
    }
}

# Export public functions
Export-ModuleMember -Function @(
    'Get-GlookoConfig',
    'Set-GlookoConfig',
    'Test-GlookoConfig',
    'Initialize-GlookoConfig',
    'Set-GlookoStorageAccount',
    'Set-GlookoAzureFunction',
    'Invoke-GlookoDeployment'
)

# Export aliases
Export-ModuleMember -Alias @(
    'Get-GC',
    'Set-GC',
    'Test-GC',
    'Initialize-GC',
    'Set-GSA',
    'Set-GAF',
    'Invoke-GD'
)
