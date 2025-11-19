#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    Installs or updates the GlookoDeployment PowerShell module.

.DESCRIPTION
    This script downloads and installs the GlookoDeployment module from GitHub.
    It can be run directly or via one-liner: iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

.PARAMETER Scope
    Installation scope: CurrentUser or AllUsers. Default is CurrentUser.

.PARAMETER LocalPath
    Install from a local path instead of downloading from GitHub.

.PARAMETER Branch
    GitHub branch to download from. Default is 'main'.

.PARAMETER Force
    Force reinstall even if module is already installed.

.EXAMPLE
    Install-GlookoDeploymentModule.ps1
    Installs the module for the current user from the main branch.

.EXAMPLE
    Install-GlookoDeploymentModule.ps1 -Force
    Reinstalls the module even if it's already installed.

.EXAMPLE
    Install-GlookoDeploymentModule.ps1 -LocalPath ./GlookoDeployment
    Installs the module from a local directory.

.EXAMPLE
    iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)
    One-liner to download and install the module directly.
#>

[CmdletBinding()]
param(
    [ValidateSet('CurrentUser', 'AllUsers')]
    [string]$Scope = 'CurrentUser',
    
    [string]$LocalPath,
    
    [string]$Branch = 'main',
    
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

# Module information
$ModuleName = 'GlookoDeployment'
$GitHubRepo = 'iricigor/GlookoDataWebApp'
$GitHubRawBase = "https://raw.githubusercontent.com/$GitHubRepo/$Branch/scripts/deployment-ps/GlookoDeployment"

# Determine installation path
if ($Scope -eq 'AllUsers') {
    $installPath = "$env:ProgramFiles\PowerShell\Modules\$ModuleName"
} else {
    # Use $HOME/.local/share/powershell/Modules on Linux, ~/Documents/PowerShell/Modules on Windows
    $docsPath = [Environment]::GetFolderPath('MyDocuments')
    if ([string]::IsNullOrEmpty($docsPath)) {
        # Linux/macOS fallback
        $installPath = Join-Path $HOME ".local/share/powershell/Modules/$ModuleName"
    } else {
        # Windows
        $installPath = Join-Path $docsPath "PowerShell\Modules\$ModuleName"
    }
}

# Helper functions
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-ModuleInstalled {
    $module = Get-Module -ListAvailable -Name $ModuleName | Select-Object -First 1
    return $null -ne $module
}

function Remove-ExistingModule {
    Write-ColorMessage "Removing existing module..." -Color Yellow
    
    # Remove from all possible locations
    $docsPath = [Environment]::GetFolderPath('MyDocuments')
    $possiblePaths = @(
        "$env:ProgramFiles\PowerShell\Modules\$ModuleName",
        (Join-Path $HOME ".local/share/powershell/Modules/$ModuleName")
    )
    
    # Add Windows path if available
    if (-not [string]::IsNullOrEmpty($docsPath)) {
        $possiblePaths += (Join-Path $docsPath "PowerShell\Modules\$ModuleName")
    }
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force
            Write-ColorMessage "  Removed: $path" -Color Gray
        }
    }
}

function Install-FromGitHub {
    Write-ColorMessage "`nDownloading module from GitHub..." -Color Cyan
    Write-ColorMessage "  Repository: $GitHubRepo" -Color Gray
    Write-ColorMessage "  Branch: $Branch" -Color Gray
    
    # Create module directory
    if (-not (Test-Path $installPath)) {
        New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    }
    
    # Create subdirectories
    $publicPath = Join-Path $installPath "Public"
    $privatePath = Join-Path $installPath "Private"
    New-Item -ItemType Directory -Path $publicPath -Force | Out-Null
    New-Item -ItemType Directory -Path $privatePath -Force | Out-Null
    
    # Files to download
    $files = @(
        @{ Path = 'GlookoDeployment.psd1'; Destination = $installPath }
        @{ Path = 'GlookoDeployment.psm1'; Destination = $installPath }
        @{ Path = 'Public/Config-Management.ps1'; Destination = $publicPath }
        @{ Path = 'Public/Set-GlookoManagedIdentity.ps1'; Destination = $publicPath }
        @{ Path = 'Public/Set-GlookoStorageAccount.ps1'; Destination = $publicPath }
        @{ Path = 'Public/Invoke-GlookoDeployment.ps1'; Destination = $publicPath }
        @{ Path = 'Private/Write-Message.ps1'; Destination = $privatePath }
        @{ Path = 'Private/Config-Functions.ps1'; Destination = $privatePath }
        @{ Path = 'Private/Azure-Functions.ps1'; Destination = $privatePath }
    )
    
    # Download each file
    foreach ($file in $files) {
        $url = "$GitHubRawBase/$($file.Path)"
        $destination = Join-Path $file.Destination (Split-Path $file.Path -Leaf)
        
        Write-ColorMessage "  Downloading: $($file.Path)" -Color Gray
        
        try {
            Invoke-WebRequest -Uri $url -OutFile $destination -UseBasicParsing
        }
        catch {
            Write-ColorMessage "  Failed to download $($file.Path): $_" -Color Red
            throw
        }
    }
    
    Write-ColorMessage "Download completed!" -Color Green
}

function Install-FromLocal {
    param([string]$SourcePath)
    
    Write-ColorMessage "`nInstalling module from local path..." -Color Cyan
    Write-ColorMessage "  Source: $SourcePath" -Color Gray
    
    if (-not (Test-Path $SourcePath)) {
        throw "Local path not found: $SourcePath"
    }
    
    # Create module directory
    if (-not (Test-Path $installPath)) {
        New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    }
    
    # Copy module files
    Copy-Item -Path (Join-Path $SourcePath "*") -Destination $installPath -Recurse -Force
    
    Write-ColorMessage "Installation completed!" -Color Green
}

function Show-PostInstallInfo {
    Write-ColorMessage "`n================================" -Color Cyan
    Write-ColorMessage "Installation Complete!" -Color Green
    Write-ColorMessage "================================" -Color Cyan
    
    Write-ColorMessage "`nModule Location:" -Color White
    Write-ColorMessage "  $installPath" -Color Gray
    
    Write-ColorMessage "`nTo get started:" -Color White
    Write-ColorMessage "  1. Import the module:" -Color Gray
    Write-ColorMessage "     Import-Module $ModuleName" -Color Yellow
    
    Write-ColorMessage "`n  2. Initialize configuration:" -Color Gray
    Write-ColorMessage "     Initialize-GlookoConfig" -Color Yellow
    
    Write-ColorMessage "`n  3. View available commands:" -Color Gray
    Write-ColorMessage "     Get-Command -Module $ModuleName" -Color Yellow
    
    Write-ColorMessage "`n  4. Get help for a command:" -Color Gray
    Write-ColorMessage "     Get-Help Set-GlookoStorageAccount -Full" -Color Yellow
    
    Write-ColorMessage "`nAvailable Commands:" -Color White
    Write-ColorMessage "  - Get-GlookoConfig          (Get-GC)    - Get current configuration" -Color Gray
    Write-ColorMessage "  - Set-GlookoConfig          (Set-GC)    - Set configuration values" -Color Gray
    Write-ColorMessage "  - Test-GlookoConfig         (Test-GC)   - Validate configuration" -Color Gray
    Write-ColorMessage "  - Initialize-GlookoConfig   (Init-GC)   - Create new configuration" -Color Gray
    Write-ColorMessage "  - Set-GlookoManagedIdentity (Set-GMI)   - Deploy managed identity" -Color Gray
    Write-ColorMessage "  - Set-GlookoStorageAccount  (Set-GSA)   - Deploy storage account" -Color Gray
    Write-ColorMessage "  - Invoke-GlookoDeployment   (Invoke-GD) - Deploy all resources" -Color Gray
    
    Write-ColorMessage "`nConfiguration file will be created at:" -Color White
    Write-ColorMessage "  ~/.glookodata/config.json" -Color Gray
    
    Write-ColorMessage "`nFor more information:" -Color White
    Write-ColorMessage "  https://github.com/$GitHubRepo" -Color Cyan
    Write-ColorMessage ""
}

# Main execution
try {
    Write-ColorMessage "`n================================" -Color Cyan
    Write-ColorMessage "GlookoDeployment Module Installer" -Color Cyan
    Write-ColorMessage "================================" -Color Cyan
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        throw "This module requires PowerShell 7.0 or higher. Current version: $($PSVersionTable.PSVersion)"
    }
    
    # Check if module is already installed
    if ((Test-ModuleInstalled) -and -not $Force) {
        Write-ColorMessage "`nModule is already installed!" -Color Yellow
        Write-ColorMessage "Use -Force to reinstall" -Color Gray
        
        $module = Get-Module -ListAvailable -Name $ModuleName | Select-Object -First 1
        Write-ColorMessage "`nInstalled version: $($module.Version)" -Color Gray
        Write-ColorMessage "Location: $($module.ModuleBase)" -Color Gray
        
        exit 0
    }
    
    # Remove existing module if Force is specified
    if ($Force -and (Test-ModuleInstalled)) {
        Remove-ExistingModule
    }
    
    # Install module
    if ($LocalPath) {
        Install-FromLocal -SourcePath $LocalPath
    } else {
        Install-FromGitHub
    }
    
    # Verify installation
    if (Test-Path (Join-Path $installPath "$ModuleName.psd1")) {
        Write-ColorMessage "`nVerifying installation..." -Color Cyan
        
        # Try to import the module
        Import-Module $ModuleName -Force
        $module = Get-Module $ModuleName
        
        if ($module) {
            Write-ColorMessage "Module loaded successfully! Version: $($module.Version)" -Color Green
        } else {
            Write-ColorMessage "Warning: Module files installed but failed to load" -Color Yellow
        }
    } else {
        throw "Installation failed: Module manifest not found"
    }
    
    # Show post-install information
    Show-PostInstallInfo
    
} catch {
    Write-ColorMessage "`nInstallation failed: $_" -Color Red
    exit 1
}
