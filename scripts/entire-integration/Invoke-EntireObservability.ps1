[CmdletBinding()]
param(
    [ValidateSet('manual', 'pre-commit', 'post-commit', 'pre-push')]
    [string]$Stage = 'manual',
    [string]$RepoPath = (Get-Location).Path,
    [switch]$Quiet
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Safe-JsonCommand {
    param([scriptblock]$Command)
    try {
        return (& $Command)
    } catch {
        return [pscustomobject]@{ error = $_.Exception.Message }
    }
}

$repo = if (Test-Path -LiteralPath $RepoPath) {
    (Resolve-Path -LiteralPath $RepoPath).Path
} else {
    [System.IO.Path]::GetFullPath($RepoPath)
}
Set-Location $repo

$gitCommonRaw = (git --no-pager rev-parse --git-common-dir).Trim()
$gitCommon = if ([System.IO.Path]::IsPathRooted($gitCommonRaw)) {
    [System.IO.Path]::GetFullPath($gitCommonRaw)
} else {
    [System.IO.Path]::GetFullPath((Join-Path $repo $gitCommonRaw))
}

$headSha = (git --no-pager rev-parse HEAD).Trim()
$headMsg = (git --no-pager log -1 --format=%B).TrimEnd()
$trailerLine = ($headMsg -split "`n" | Where-Object { $_ -match '^Entire-Checkpoint:\s+' } | Select-Object -Last 1)

$statusRaw = Safe-JsonCommand { entire status --json | ConvertFrom-Json }
$currentRaw = Safe-JsonCommand { entire session current --json | ConvertFrom-Json }
$listRaw = Safe-JsonCommand { entire session list --json | ConvertFrom-Json }

$resolverScript = Join-Path $PSScriptRoot 'Resolve-CopilotSession.ps1'
$resolver = Safe-JsonCommand { & $resolverScript -RepoPath $repo -Json | ConvertFrom-Json }

$inventory = @()
$entireSessionsDir = Join-Path $gitCommon 'entire-sessions'
if (Test-Path $entireSessionsDir) {
    $inventory = Get-ChildItem -Path $entireSessionsDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 50 Name, LastWriteTime, Length
}

$snapshot = [pscustomobject]@{
    schema_version = '1.0.0'
    captured_at = (Get-Date).ToString('o')
    stage = $Stage
    repo_path = $repo
    branch = (git --no-pager branch --show-current).Trim()
    head_sha = $headSha
    head_trailer = if ($trailerLine) { $trailerLine.Trim() } else { $null }
    entire_status = $statusRaw
    entire_session_current = $currentRaw
    entire_session_list = $listRaw
    resolver = $resolver
    local_inventory = $inventory
    environment = [pscustomobject]@{
        ci = [bool]$env:CI
        github_actions = [bool]$env:GITHUB_ACTIONS
        user = $env:USERNAME
        computer = $env:COMPUTERNAME
    }
}

$outDir = Join-Path $gitCommon 'entire-observability'
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$nonce = [guid]::NewGuid().ToString('N').Substring(0,8)
$file = Join-Path $outDir "$stamp-$Stage-$nonce.json"
$snapshot | ConvertTo-Json -Depth 8 | Set-Content -Path $file -Encoding UTF8

if (-not $Quiet) {
    Write-Host "Saved observability snapshot: $file"
}
