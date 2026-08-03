<#
.SYNOPSIS
    Reports Entire observability metrics for the current session/branch.

.DESCRIPTION
    Collects and reports data points about the Entire integration:
      - Entire CLI availability and version
      - Whether Entire is enabled in the repo
      - Whether the current HEAD commit carries an Entire-Checkpoint trailer
      - Session linkage status (resolved via Resolve-CopilotSession.ps1)
      - Git hooks installation

    The -Stage parameter labels the context in which the check is performed
    (e.g. 'manual', 'pre-push', 'post-merge').

.PARAMETER Stage
    Label for the observability stage. Does not alter behavior.
    Typical values: manual, pre-push, post-merge, finalize.

.PARAMETER Json
    Emit results as JSON instead of a human-readable table.

.EXAMPLE
    .\scripts\entire-integration\Invoke-EntireObservability.ps1 -Stage manual
    .\scripts\entire-integration\Invoke-EntireObservability.ps1 -Stage pre-push -Json
#>

[CmdletBinding()]
param(
    [string]$Stage = "manual",
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
$resolverScript = Join-Path $scriptDir "Resolve-CopilotSession.ps1"

function Get-CommandTextOutput {
    param([string]$Name, [string[]]$CommandArgs = @())
    try {
        $null = Get-Command $Name -ErrorAction Stop
        return (& $Name @CommandArgs 2>&1 | Out-String).Trim()
    } catch {
        return $null
    }
}

function Add-Check {
    param(
        [System.Collections.Generic.List[object]]$List,
        [string]$Area, [string]$Name, [string]$Value,
        [string]$Status, [string]$Notes = ""
    )
    $List.Add([pscustomobject]@{
        Area   = $Area
        Name   = $Name
        Value  = $Value
        Status = $Status
        Notes  = $Notes
    })
}

$checks = [System.Collections.Generic.List[object]]::new()

# --- Entire CLI ---
$entireRaw = Get-CommandTextOutput -Name "entire" -CommandArgs @("--version")
if ($entireRaw) {
    $m = [regex]::Match($entireRaw, 'Entire CLI ([0-9]+\.[0-9]+\.[0-9]+)')
    $ver = if ($m.Success) { $m.Groups[1].Value } else { $entireRaw.Substring(0, [Math]::Min(40, $entireRaw.Length)) }
    Add-Check -List $checks -Area "CLI" -Name "entire" -Value $ver -Status "OK"
} else {
    Add-Check -List $checks -Area "CLI" -Name "entire" -Value "-" -Status "FAIL" -Notes "Not installed or not on PATH"
}

# --- Repo enabled ---
$gitRootRaw = (git rev-parse --show-toplevel 2>$null | Out-String).Trim()
$settingsPath = Join-Path $gitRootRaw ".entire\settings.json"
$repoEnabled = $false
$commitLinking = ""
if (Test-Path $settingsPath) {
    try {
        $s = Get-Content $settingsPath -Raw | ConvertFrom-Json
        $repoEnabled = $s.enabled -eq $true
        $commitLinking = [string]$s.commit_linking
    } catch { }
}

$repoEnabledStatus = if ($repoEnabled) { "OK" } else { "FAIL" }
$repoEnabledNotes = if ($repoEnabled) { "" } else { "Run: entire enable -y --agent copilot-cli" }
$repoEnabledValue = if ($repoEnabled) { "true" } else { "false" }
Add-Check -List $checks -Area "Repo" -Name "enabled" -Value $repoEnabledValue -Status $repoEnabledStatus -Notes $repoEnabledNotes

if ($repoEnabled -and $commitLinking) {
    $clOk = ($commitLinking -eq "always")
    $clStatus = if ($clOk) { "OK" } else { "WARN" }
    $clNotes = if ($clOk) { "" } else { "Set commit_linking: always in .entire/settings.json" }
    Add-Check -List $checks -Area "Repo" -Name "commit_linking" -Value $commitLinking -Status $clStatus -Notes $clNotes
}

# --- HEAD trailer ---
$headMsg = (git log -1 --format="%B" 2>$null | Out-String).Trim()
$hasTrailer = $headMsg -match 'Entire-Checkpoint:'
$headSha = (git rev-parse --short HEAD 2>$null | Out-String).Trim()
$trailerValue = if ($hasTrailer) { "present" } else { "missing" }
$trailerStatus = if ($hasTrailer) { "OK" } else { "WARN" }
$trailerNotes = if ($hasTrailer) { "" } else { "Run Invoke-EntireStackFinalize.ps1 to attach" }
Add-Check -List $checks -Area "Commit" -Name "HEAD trailer ($headSha)" -Value $trailerValue -Status $trailerStatus -Notes $trailerNotes

# --- Session resolution ---
$sessionId = $null
if (Test-Path $resolverScript) {
    $sessionJson = ""
    try {
        $sessionJson = (& powershell -NoProfile -ExecutionPolicy Bypass -File $resolverScript -Json 2>&1 | Out-String).Trim()
        $sessionObj = $sessionJson | ConvertFrom-Json
        if ($sessionObj.SessionId) {
            $sessionId = $sessionObj.SessionId
            $branchMatch = $sessionObj.BranchMatch
            $sessionStatus = "OK"
            $sessionNotes = if ($branchMatch) { "" } else { "Branch mismatch - best-effort match" }
            Add-Check -List $checks -Area "Session" -Name "resolved" -Value $sessionId -Status $sessionStatus -Notes $sessionNotes
        } else {
            Add-Check -List $checks -Area "Session" -Name "resolved" -Value "-" -Status "FAIL" -Notes "Could not resolve session ID"
        }
    } catch {
        Add-Check -List $checks -Area "Session" -Name "resolved" -Value "-" -Status "FAIL" -Notes $_.Exception.Message
    }
} else {
    Add-Check -List $checks -Area "Session" -Name "resolved" -Value "-" -Status "FAIL" -Notes "Resolve-CopilotSession.ps1 not found"
}

# --- Git hooks ---
$gitDirRaw = (git rev-parse --git-dir 2>$null | Out-String).Trim()
$hooksDir = Join-Path $gitDirRaw "hooks"
if (-not (Test-Path $hooksDir) -and (Test-Path $gitDirRaw -PathType Leaf)) {
    $gitFileContent = Get-Content $gitDirRaw -Raw
    $m = [regex]::Match($gitFileContent, 'gitdir:\s*(.+)')
    if ($m.Success) {
        $wt = $m.Groups[1].Value.Trim()
        $mainGit = Split-Path (Split-Path $wt -Parent) -Parent
        $hooksDir = Join-Path $mainGit "hooks"
    }
}

$expectedHooks = @('commit-msg', 'post-commit', 'pre-push', 'prepare-commit-msg')
if (Test-Path $hooksDir) {
    $installed = @(Get-ChildItem $hooksDir -Name | Where-Object { $_ -notmatch '\.sample$' })
    $missing = @($expectedHooks | Where-Object { $installed -notcontains $_ })
    $hooksOk = $missing.Count -eq 0
    $hooksValue = if ($hooksOk) { "all present" } else { "$($expectedHooks.Count - $missing.Count)/$($expectedHooks.Count)" }
    $hooksStatus = if ($hooksOk) { "OK" } else { "FAIL" }
    $hooksNotes = if ($hooksOk) { "" } else { "Missing: $($missing -join ', '). Run: entire enable -y --agent copilot-cli" }
    Add-Check -List $checks -Area "Repo" -Name "git hooks" -Value $hooksValue -Status $hooksStatus -Notes $hooksNotes
} else {
    Add-Check -List $checks -Area "Repo" -Name "git hooks" -Value "-" -Status "WARN" -Notes "hooks dir not found"
}

# --- Output ---
$failCount = @($checks | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = @($checks | Where-Object { $_.Status -eq "WARN" }).Count

$summary = [pscustomobject]@{
    Stage     = $Stage
    Timestamp = (Get-Date -Format "o")
    SessionId = $sessionId
    FailCount = $failCount
    WarnCount = $warnCount
    Checks    = $checks
}

if ($Json) {
    $summary | ConvertTo-Json -Depth 5
} else {
    Write-Host ""
    Write-Host "Entire Observability  [stage: $Stage]" -ForegroundColor Cyan
    Write-Host "======================================"
    $checks | Format-Table Area, Name, Value, Status, Notes -AutoSize
    if ($failCount -eq 0 -and $warnCount -eq 0) {
        Write-Host "Overall: HEALTHY" -ForegroundColor Green
    } elseif ($failCount -eq 0) {
        Write-Host "Overall: WARN ($warnCount warnings)" -ForegroundColor Yellow
    } else {
        Write-Host "Overall: DEGRADED ($failCount failures, $warnCount warnings)" -ForegroundColor Red
    }
    Write-Host ""
}
