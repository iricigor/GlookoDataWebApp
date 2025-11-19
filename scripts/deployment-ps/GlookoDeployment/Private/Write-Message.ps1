function Write-InfoMessage {
    <#
    .SYNOPSIS
    Writes an informational message with icon and color.
    
    .PARAMETER Message
    The message to display.
    #>
    [CmdletBinding()]
    param([string]$Message)
    
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-SuccessMessage {
    <#
    .SYNOPSIS
    Writes a success message with icon and color.
    
    .PARAMETER Message
    The message to display.
    #>
    [CmdletBinding()]
    param([string]$Message)
    
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-WarningMessage {
    <#
    .SYNOPSIS
    Writes a warning message with icon and color.
    
    .PARAMETER Message
    The message to display.
    #>
    [CmdletBinding()]
    param([string]$Message)
    
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-ErrorMessage {
    <#
    .SYNOPSIS
    Writes an error message with icon and color.
    
    .PARAMETER Message
    The message to display.
    #>
    [CmdletBinding()]
    param([string]$Message)
    
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Section {
    <#
    .SYNOPSIS
    Writes a section header with decorative border.
    
    .PARAMETER Title
    The section title to display.
    #>
    [CmdletBinding()]
    param([string]$Title)
    
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host ("=" * 70) -ForegroundColor Blue
    Write-Host ""
}
