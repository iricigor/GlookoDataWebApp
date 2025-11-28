#Requires -Version 7.0

<#
.SYNOPSIS
    Private helper functions for output formatting

.DESCRIPTION
    These functions provide consistent output formatting for the GlookoDeployment module
#>

# Output colors
$script:InfoColor = 'Cyan'
$script:SuccessColor = 'Green'
$script:WarningColor = 'Yellow'
$script:ErrorColor = 'Red'

function Write-InfoMessage {
    <#
    .SYNOPSIS
        Writes an info message to the console
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Message
    )
    
    Write-Host "ℹ️  $Message" -ForegroundColor $script:InfoColor
}

function Write-SuccessMessage {
    <#
    .SYNOPSIS
        Writes a success message to the console
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Message
    )
    
    Write-Host "✅ $Message" -ForegroundColor $script:SuccessColor
}

function Write-WarningMessage {
    <#
    .SYNOPSIS
        Writes a warning message to the console
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Message
    )
    
    Write-Host "⚠️  $Message" -ForegroundColor $script:WarningColor
}

function Write-ErrorMessage {
    <#
    .SYNOPSIS
        Writes an error message to the console
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Message
    )
    
    Write-Host "❌ $Message" -ForegroundColor $script:ErrorColor
}

function Write-SectionHeader {
    <#
    .SYNOPSIS
        Writes a section header to the console
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Title
    )
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════════════════════" -ForegroundColor $script:InfoColor
    Write-Host "  $Title" -ForegroundColor $script:InfoColor
    Write-Host "════════════════════════════════════════════════════════════════════════════════" -ForegroundColor $script:InfoColor
    Write-Host ""
}
