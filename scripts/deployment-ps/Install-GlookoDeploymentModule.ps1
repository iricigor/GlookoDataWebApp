#Requires -Version 7.4

<#
.SYNOPSIS
    Installs the GlookoDeployment PowerShell module to the user's modules directory.

.DESCRIPTION
    Downloads the GlookoDeployment module from GitHub and copies it to the user's
    PowerShell modules directory, making it available for import with Import-Module.
    
    This is an INSTALLATION script (not import). It:
    1. Downloads module files from GitHub (or copies from local path)
    2. Places them in the PowerShell modules directory (~/.local/share/powershell/Modules on Linux)
    3. After installation, you can import the module with: Import-Module GlookoDeployment
    
    PowerShell Version: Requires 7.4+ for security (earlier versions have known vulnerabilities)
    Reference: https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle

.PARAMETER LocalPath
    Install from a local directory instead of downloading from GitHub.

.PARAMETER Force
    Overwrite existing installation.

.PARAMETER Branch
    GitHub branch to download from. Default: main

.EXAMPLE
    # Install from GitHub (one-liner)
    iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

.EXAMPLE
    # Force reinstall from GitHub (one-liner)
    $env:GLOOKO_INSTALL_FORCE=1; iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

.EXAMPLE
    # Install from local path
    ./Install-GlookoDeploymentModule.ps1 -LocalPath ./GlookoDeployment

.EXAMPLE
    # Force reinstall
    ./Install-GlookoDeploymentModule.ps1 -Force

.NOTES
    After installation, import the module with:
    Import-Module GlookoDeployment
#>

param(
    [Parameter()]
    [string]$LocalPath,

    [Parameter()]
    [switch]$Force,

    [Parameter()]
    [string]$Branch = 'main'
)

# Configuration
$ModuleName = 'GlookoDeployment'
$GitHubRepo = 'iricigor/GlookoDataWebApp'
$GitHubBasePath = "scripts/deployment-ps/GlookoDeployment"

# Support -Force via environment variable for iex (irm ...) usage
# When using iex, parameters can't be passed directly, so use $env:GLOOKO_INSTALL_FORCE=1
if ($env:GLOOKO_INSTALL_FORCE) {
    $Force = $true
    # Clear the environment variable after reading it
    $env:GLOOKO_INSTALL_FORCE = $null
}

# Simple output functions (standalone - not using module's functions since module isn't installed yet)
function Write-InstallInfo { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-InstallSuccess { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-InstallWarning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-InstallError { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Get module installation path
$ModulesPath = if ($IsWindows) {
    Join-Path $HOME "Documents\PowerShell\Modules"
} else {
    Join-Path $HOME ".local/share/powershell/Modules"
}

$InstallPath = Join-Path $ModulesPath $ModuleName

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GlookoDeployment Module Installer" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if module already exists
if ((Test-Path $InstallPath) -and -not $Force) {
    Write-InstallWarning "Module already installed at: $InstallPath"
    Write-InstallInfo 'Use -Force to overwrite, or for iex usage: $env:GLOOKO_INSTALL_FORCE=1; iex (irm ...)'
    return
}

# Remove existing installation if Force
if ((Test-Path $InstallPath) -and $Force) {
    Write-InstallInfo "Removing existing installation..."
    Remove-Item -Path $InstallPath -Recurse -Force
}

# Create modules directory if it doesn't exist
if (-not (Test-Path $ModulesPath)) {
    Write-InstallInfo "Creating modules directory: $ModulesPath"
    New-Item -ItemType Directory -Path $ModulesPath -Force | Out-Null
}

if ($LocalPath) {
    # Install from local path
    Write-InstallInfo "Installing from local path: $LocalPath"
    
    if (-not (Test-Path $LocalPath)) {
        Write-InstallError "Local path not found: $LocalPath"
        return
    }
    
    Copy-Item -Path $LocalPath -Destination $InstallPath -Recurse -Force
}
else {
    # Download from GitHub
    Write-InstallInfo "Downloading from GitHub: $GitHubRepo (branch: $Branch)"
    
    # Create install directory
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $InstallPath "Public") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $InstallPath "Private") -Force | Out-Null
    
    $BaseUrl = "https://raw.githubusercontent.com/$GitHubRepo/$Branch/$GitHubBasePath"
    
    # Files to download
    $Files = @(
        @{ Path = "GlookoDeployment.psd1"; Dest = "" }
        @{ Path = "GlookoDeployment.psm1"; Dest = "" }
        @{ Path = "Public/Config-Functions.ps1"; Dest = "Public" }
        @{ Path = "Public/Set-GlookoManagedIdentity.ps1"; Dest = "Public" }
        @{ Path = "Public/Set-GlookoAzureFunction.ps1"; Dest = "Public" }
        @{ Path = "Public/Invoke-GlookoDeployment.ps1"; Dest = "Public" }
        @{ Path = "Private/Output-Functions.ps1"; Dest = "Private" }
        @{ Path = "Private/Azure-Helpers.ps1"; Dest = "Private" }
    )
    
    foreach ($File in $Files) {
        $Url = "$BaseUrl/$($File.Path)"
        $DestDir = if ($File.Dest) { Join-Path $InstallPath $File.Dest } else { $InstallPath }
        $DestPath = Join-Path $DestDir (Split-Path $File.Path -Leaf)
        
        try {
            Write-InstallInfo "Downloading: $($File.Path)"
            $content = Invoke-RestMethod -Uri $Url -ErrorAction Stop
            $content | Out-File -FilePath $DestPath -Encoding UTF8 -Force
        }
        catch {
            Write-InstallError "Failed to download: $($File.Path)"
            Write-InstallError $_.Exception.Message
            
            # Clean up partial installation
            if (Test-Path $InstallPath) {
                Remove-Item -Path $InstallPath -Recurse -Force
            }
            return
        }
    }
}

Write-InstallSuccess "Module installed successfully!"
Write-Host ""
Write-Host "  Installation path: $InstallPath"
Write-Host ""
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  Import-Module GlookoDeployment"
Write-Host "  Initialize-GlookoConfig"
Write-Host "  Set-GlookoAzureFunction"
Write-Host ""
Write-Host "Quick reference:" -ForegroundColor Yellow
Write-Host "  Get-GC    - Get configuration (alias)"
Write-Host "  Set-GC    - Set configuration (alias)"
Write-Host "  Set-GAF   - Deploy Azure Function (alias)"
Write-Host "  Invoke-GD - Full deployment (alias)"
Write-Host ""

# Try to import the module
try {
    Import-Module GlookoDeployment -Force -ErrorAction Stop
    Write-InstallSuccess "Module imported successfully!"
}
catch {
    Write-InstallWarning "Module installed but could not be imported automatically."
    Write-InstallInfo "Run: Import-Module GlookoDeployment"
}
