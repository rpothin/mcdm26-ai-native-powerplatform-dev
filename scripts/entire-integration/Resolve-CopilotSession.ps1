<#
.SYNOPSIS
    Resolves the active Copilot session for the current git worktree.

.DESCRIPTION
    Scans ~/.copilot/session-state/*/workspace.yaml to find sessions whose
    git_root matches the current repository root (and optionally the current
    branch). Returns structured session metadata so other scripts can consume
    the session ID without hard-coding paths.

.PARAMETER Json
    Emit results as a JSON object instead of a human-readable table.

.PARAMETER Branch
    Override the git branch to match against (default: current HEAD branch).

.EXAMPLE
    .\scripts\entire-integration\Resolve-CopilotSession.ps1 -Json
    .\scripts\entire-integration\Resolve-CopilotSession.ps1
#>

[CmdletBinding()]
param(
    [switch]$Json,
    [string]$Branch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertFrom-Yaml {
    param([string]$Content)
    $result = [ordered]@{}
    foreach ($line in ($Content -split "`n")) {
        $line = $line.TrimEnd("`r")
        if ($line -match "^([a-zA-Z_][a-zA-Z0-9_]*):\s*'?(.+?)'?\s*$") {
            $result[$Matches[1]] = $Matches[2].Trim("'")
        }
    }
    return $result
}

# Resolve current git root
$gitRoot = $null
try {
    $gitRoot = (git rev-parse --show-toplevel 2>$null).Trim() -replace '/', '\'
} catch { }

# Resolve current branch
$currentBranch = $Branch
if (-not $currentBranch) {
    try {
        $currentBranch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    } catch { }
}

$sessionStateRoot = Join-Path $env:USERPROFILE ".copilot\session-state"
$candidates = @()

if (Test-Path $sessionStateRoot) {
    $workspaceFiles = Get-ChildItem $sessionStateRoot -Recurse -Filter "workspace.yaml" -ErrorAction SilentlyContinue
    foreach ($file in $workspaceFiles) {
        try {
            $raw = Get-Content $file.FullName -Raw -ErrorAction Stop
            $parsed = ConvertFrom-Yaml -Content $raw

            # Normalize paths for comparison
            $sessionGitRoot = ($parsed["git_root"] -replace '/', '\').TrimEnd('\')
            $normalizedGitRoot = $gitRoot.TrimEnd('\')

            if ($sessionGitRoot -ieq $normalizedGitRoot) {
                $candidates += [pscustomobject]@{
                    SessionId    = $parsed["id"]
                    Branch       = $parsed["branch"]
                    Repository   = $parsed["repository"]
                    GitRoot      = $parsed["git_root"]
                    ClientName   = $parsed["client_name"]
                    CreatedAt    = $parsed["created_at"]
                    UpdatedAt    = $parsed["updated_at"]
                    McTaskId     = $parsed["mc_task_id"]
                    McSessionId  = $parsed["mc_session_id"]
                    WorkspaceFile = $file.FullName
                    BranchMatch  = ($parsed["branch"] -ieq $currentBranch)
                }
            }
        } catch {
            # Skip unreadable files
        }
    }
}

# Prefer sessions where branch matches, then most-recently-updated
$resolved = $candidates |
    Sort-Object @{E={[int]($_.BranchMatch)}; Ascending=$false},
                @{E={$_.UpdatedAt}; Ascending=$false} |
    Select-Object -First 1

if (-not $resolved) {
    $msg = "No Copilot session found for git root: $gitRoot"
    if ($Json) {
        @{ error = $msg; gitRoot = $gitRoot; branch = $currentBranch } | ConvertTo-Json
    } else {
        Write-Warning $msg
    }
    exit 1
}

if ($Json) {
    $resolved | Select-Object SessionId, Branch, Repository, GitRoot, ClientName, CreatedAt, UpdatedAt, McTaskId, McSessionId, BranchMatch |
        ConvertTo-Json
} else {
    Write-Host ""
    Write-Host "Resolved Copilot Session" -ForegroundColor Cyan
    Write-Host "========================"
    Write-Host "  SessionId   : $($resolved.SessionId)"
    Write-Host "  Branch      : $($resolved.Branch)"
    Write-Host "  Repository  : $($resolved.Repository)"
    Write-Host "  BranchMatch : $($resolved.BranchMatch)"
    Write-Host "  ClientName  : $($resolved.ClientName)"
    Write-Host "  CreatedAt   : $($resolved.CreatedAt)"
    Write-Host ""
}
