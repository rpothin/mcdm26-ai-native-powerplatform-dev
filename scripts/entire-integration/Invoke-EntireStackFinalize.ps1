<#
.SYNOPSIS
    Finalizes the Entire stack for the current session worktree.

.DESCRIPTION
    Automates the three-step Entire crosslink protocol described in AGENTS.md:
      1. Resolve the active Copilot session ID for this worktree.
      2. Run `entire session attach <session-id> --agent copilot-cli --force`
         to stamp the Entire-Checkpoint trailer onto HEAD.
      3. Force-push the branch so the trailer reaches the remote.

    Safe to re-run: each run re-attaches the trailer to the current HEAD and
    force-pushes. If the branch receives commits after finalization, re-run
    this script before merging.

.PARAMETER DryRun
    Resolve the session and preview commands without actually running them.

.PARAMETER NoPush
    Skip the git push step (attach only).

.PARAMETER Remote
    Git remote to push to. Default: origin.

.EXAMPLE
    .\scripts\entire-integration\Invoke-EntireStackFinalize.ps1
    .\scripts\entire-integration\Invoke-EntireStackFinalize.ps1 -DryRun
    .\scripts\entire-integration\Invoke-EntireStackFinalize.ps1 -NoPush
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$NoPush,
    [string]$Remote = "origin"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
$resolverScript = Join-Path $scriptDir "Resolve-CopilotSession.ps1"

function Write-Step {
    param([string]$Msg)
    Write-Host "  >> $Msg" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Msg)
    Write-Host "  OK $Msg" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Msg)
    Write-Host "  FAIL $Msg" -ForegroundColor Red
}

Write-Host ""
Write-Host "Entire Stack Finalize$(if ($DryRun) { ' [DRY RUN]' })" -ForegroundColor Cyan
Write-Host "=================================="

# Step 1 — Resolve session
Write-Host ""
Write-Host "[1/3] Resolving Copilot session..." -ForegroundColor White
if (-not (Test-Path $resolverScript)) {
    Write-Failure "Resolve-CopilotSession.ps1 not found at: $resolverScript"
    exit 1
}

$sessionJson = $null
try {
    $sessionJson = (& powershell -NoProfile -ExecutionPolicy Bypass -File $resolverScript -Json 2>&1 | Out-String).Trim()
} catch {
    Write-Failure "Resolver script failed: $($_.Exception.Message)"
    exit 1
}

$sessionObj = $null
try {
    $sessionObj = $sessionJson | ConvertFrom-Json
} catch {
    Write-Failure "Could not parse session JSON: $sessionJson"
    exit 1
}

if (-not $sessionObj.SessionId) {
    Write-Failure "Session not resolved. Output: $sessionJson"
    exit 1
}

$sessionId = $sessionObj.SessionId
$branch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
Write-Success "Session ID : $sessionId"
Write-Host "             Branch     : $branch"
if (-not $sessionObj.BranchMatch) {
    Write-Host "  WARN Branch mismatch — proceeding with best-effort match" -ForegroundColor Yellow
}

# Step 2 — entire session attach
Write-Host ""
Write-Host "[2/3] Attaching Entire session trailer..." -ForegroundColor White
$attachCmd = "entire session attach $sessionId --agent copilot-cli --force"
Write-Step $attachCmd

if ($DryRun) {
    Write-Host "  [dry-run] skipped"
} else {
    try {
        $null = Get-Command "entire" -ErrorAction Stop
    } catch {
        Write-Failure "'entire' CLI not found. Install via: scoop install entire/entire"
        exit 1
    }

    $attachResult = & entire session attach $sessionId --agent copilot-cli --force 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "entire session attach failed (exit $LASTEXITCODE):`n$attachResult"
        exit 1
    }
    Write-Success "Trailer attached to HEAD"
    Write-Host "  $($attachResult.Trim())"
}

# Step 3 — git push
Write-Host ""
Write-Host "[3/3] Pushing branch to remote..." -ForegroundColor White

if ($NoPush) {
    Write-Host "  [skipped] -NoPush specified"
} elseif ($DryRun) {
    Write-Step "git push $Remote $branch --force-with-lease  [dry-run]"
    Write-Host "  [dry-run] skipped"
} else {
    $pushCmd = @("push", $Remote, $branch, "--force-with-lease")
    Write-Step "git $($pushCmd -join ' ')"
    $pushResult = & git @pushCmd 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "git push failed (exit $LASTEXITCODE):`n$pushResult"
        exit 1
    }
    Write-Success "Branch pushed: $Remote/$branch"
}

Write-Host ""
Write-Host "Finalization complete$(if ($DryRun) { ' (dry-run — no changes made)' })" -ForegroundColor Green
Write-Host ""

# Emit a JSON summary for machine consumption
$result = [pscustomobject]@{
    DryRun    = $DryRun.IsPresent
    NoPush    = $NoPush.IsPresent
    SessionId = $sessionId
    Branch    = $branch
    Remote    = $Remote
    Status    = "success"
}
$result | ConvertTo-Json
