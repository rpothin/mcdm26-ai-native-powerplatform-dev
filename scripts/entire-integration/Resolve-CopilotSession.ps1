[CmdletBinding()]
param(
    [string]$RepoPath = (Get-Location).Path,
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Path {
    param([string]$PathValue)
    if ([string]::IsNullOrWhiteSpace($PathValue)) { return $null }
    try {
        if (Test-Path -LiteralPath $PathValue) {
            return ((Resolve-Path -LiteralPath $PathValue).Path).TrimEnd('\')
        }
        return ([System.IO.Path]::GetFullPath($PathValue)).TrimEnd('\')
    } catch {
        return $null
    }
}

function Parse-WorkspaceYaml {
    param([string]$Path)
    $map = @{}
    foreach ($line in Get-Content -Path $Path) {
        if ($line -match '^\s*([A-Za-z0-9_]+):\s*(.*)\s*$') {
            $map[$matches[1]] = $matches[2]
        }
    }
    return $map
}

$repo = Normalize-Path $RepoPath
Set-Location $repo

$gitCommonDirRaw = (git --no-pager rev-parse --git-common-dir).Trim()
$gitCommonDir = if ([System.IO.Path]::IsPathRooted($gitCommonDirRaw)) {
    Normalize-Path $gitCommonDirRaw
} else {
    Normalize-Path (Join-Path $repo $gitCommonDirRaw)
}
$entireSessionsDir = Join-Path $gitCommonDir 'entire-sessions'

$sessionStateRoot = Join-Path $env:USERPROFILE '.copilot\session-state'
$candidates = @()

if (Test-Path $sessionStateRoot) {
    Get-ChildItem -Path $sessionStateRoot -Directory | ForEach-Object {
        $workspaceYaml = Join-Path $_.FullName 'workspace.yaml'
        if (-not (Test-Path $workspaceYaml)) { return }

        $data = Parse-WorkspaceYaml -Path $workspaceYaml
        if (-not $data.ContainsKey('id')) { return }

        $cwd = Normalize-Path $data['cwd']
        $gitRoot = Normalize-Path $data['git_root']
        $score = 0
        $reasons = @()

        if ($cwd -and $cwd -eq $repo) {
            $score += 70
            $reasons += 'cwd_match'
        }
        if ($gitRoot -and $gitRoot -eq $repo) {
            $score += 30
            $reasons += 'git_root_match'
        }

        if ($score -eq 0) { return }

        $id = $data['id']
        $entireSessionFile = Join-Path $entireSessionsDir "$id.json"
        $tracked = Test-Path $entireSessionFile
        $phase = $null
        if ($tracked) {
            try {
                $session = Get-Content -Path $entireSessionFile -Raw | ConvertFrom-Json
                $phase = $session.phase
            } catch {
                $phase = 'unknown'
            }
        }

        $updated = $null
        if ($data.ContainsKey('updated_at')) {
            try { $updated = [datetime]$data['updated_at'] } catch { }
        }
        if (-not $updated -and $data.ContainsKey('created_at')) {
            try { $updated = [datetime]$data['created_at'] } catch { }
        }

        $candidates += [pscustomobject]@{
            session_id   = $id
            repo_path    = $repo
            workspace    = $workspaceYaml
            score        = $score
            reasons      = $reasons
            tracked      = $tracked
            tracked_phase = $phase
            updated_at   = $updated
        }
    }
}

$sorted = $candidates | Sort-Object @{Expression = 'score'; Descending = $true }, @{Expression = 'updated_at'; Descending = $true }
$top = $sorted | Select-Object -First 1
$sameTop = @($sorted | Where-Object { $_.score -eq $top.score })

$classification = 'ambiguous'
$confidence = 0.0
$reasonCodes = @()

if (-not $top) {
    $classification = 'ambiguous'
    $reasonCodes += 'no_candidate'
} elseif ($sameTop.Count -gt 1) {
    $classification = 'ambiguous'
    $reasonCodes += 'multiple_top_candidates'
} else {
    if (-not $top.tracked) {
        $classification = 'untracked_runtime'
        $confidence = 0.75
        $reasonCodes += 'workspace_match_untracked'
    } elseif ($top.tracked_phase -eq 'ended') {
        $classification = 'tracked_ended'
        $confidence = 0.85
        $reasonCodes += 'workspace_match_tracked_ended'
    } else {
        $classification = 'tracked_live'
        $confidence = 0.9
        $reasonCodes += 'workspace_match_tracked'
    }
}

$result = [pscustomobject]@{
    repo_path       = $repo
    classification  = $classification
    confidence      = $confidence
    reason_codes    = $reasonCodes
    selected        = $top
    candidates      = $sorted
}

if ($Json) {
    $result | ConvertTo-Json -Depth 6
} else {
    $result
}
