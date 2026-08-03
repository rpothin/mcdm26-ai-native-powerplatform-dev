[CmdletBinding()]
param(
    [string]$RepoPath = (Get-Location).Path,
    [string[]]$Branches = @(),
    [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repo = if (Test-Path -LiteralPath $RepoPath) {
    (Resolve-Path -LiteralPath $RepoPath).Path
} else {
    [System.IO.Path]::GetFullPath($RepoPath)
}
Set-Location $repo

if ($Branches.Count -eq 0) {
    $current = (git --no-pager branch --show-current).Trim()
    $Branches = @($current)
}

$rows = @()
foreach ($branch in $Branches) {
    & git --no-pager show-ref --verify --quiet "refs/heads/$branch"
    $exists = $LASTEXITCODE -eq 0
    if (-not $exists) {
        $rows += [pscustomobject]@{
            branch = $branch
            head = $null
            has_trailer = $false
            trailer = $null
            action = 'missing_branch'
        }
        continue
    }

    $head = (git --no-pager rev-parse $branch).Trim()
    $msg = (git --no-pager log -1 --format=%B $branch)
    $trailer = ($msg -split "`n" | Where-Object { $_ -match '^Entire-Checkpoint:\s+' } | Select-Object -Last 1)
    $rows += [pscustomobject]@{
        branch = $branch
        head = $head
        has_trailer = [bool]$trailer
        trailer = if ($trailer) { $trailer.Trim() } else { $null }
        action = if ($trailer) { 'none' } else { 'attach_recommended' }
    }
}

$report = [pscustomobject]@{
    generated_at = (Get-Date).ToString('o')
    repo_path = $repo
    apply = [bool]$Apply
    branches = $rows
}

if (-not $Apply) {
    $report | ConvertTo-Json -Depth 5
    Write-Host "Dry-run only. Re-run with -Apply to attempt attach on current branch only."
    exit 0
}

$currentBranch = (git --no-pager branch --show-current).Trim()
$currentRow = $rows | Where-Object { $_.branch -eq $currentBranch } | Select-Object -First 1
if (-not $currentRow) {
    throw "Current branch not in finalization set."
}
if ($currentRow.action -ne 'attach_recommended') {
    Write-Host "Current branch already has trailer; nothing to apply."
    exit 0
}

$linkScript = Join-Path $PSScriptRoot 'Invoke-EntireExperimentalLink.ps1'
& $linkScript -RepoPath $repo -Apply
