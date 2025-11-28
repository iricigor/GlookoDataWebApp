#Requires -Version 7.0

<#
.SYNOPSIS
    Installs the GlookoDeployment PowerShell module.

.DESCRIPTION
    Downloads and installs the GlookoDeployment module from GitHub or a local path.
    The module is installed to the user's PowerShell modules directory.

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

# Colors for output
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

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
    Write-Warn "Module already installed at: $InstallPath"
    Write-Info "Use -Force to overwrite"
    return
}

# Remove existing installation if Force
if ((Test-Path $InstallPath) -and $Force) {
    Write-Info "Removing existing installation..."
    Remove-Item -Path $InstallPath -Recurse -Force
}

# Create modules directory if it doesn't exist
if (-not (Test-Path $ModulesPath)) {
    Write-Info "Creating modules directory: $ModulesPath"
    New-Item -ItemType Directory -Path $ModulesPath -Force | Out-Null
}

if ($LocalPath) {
    # Install from local path
    Write-Info "Installing from local path: $LocalPath"
    
    if (-not (Test-Path $LocalPath)) {
        Write-Err "Local path not found: $LocalPath"
        return
    }
    
    Copy-Item -Path $LocalPath -Destination $InstallPath -Recurse -Force
}
else {
    # Download from GitHub
    Write-Info "Downloading from GitHub: $GitHubRepo (branch: $Branch)"
    
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
            Write-Info "Downloading: $($File.Path)"
            $content = Invoke-RestMethod -Uri $Url -ErrorAction Stop
            $content | Out-File -FilePath $DestPath -Encoding UTF8 -Force
        }
        catch {
            Write-Err "Failed to download: $($File.Path)"
            Write-Err $_.Exception.Message
            
            # Clean up partial installation
            if (Test-Path $InstallPath) {
                Remove-Item -Path $InstallPath -Recurse -Force
            }
            return
        }
    }
}

Write-Success "Module installed successfully!"
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
    Write-Success "Module imported successfully!"
}
catch {
    Write-Warn "Module installed but could not be imported automatically."
    Write-Info "Run: Import-Module GlookoDeployment"
}
