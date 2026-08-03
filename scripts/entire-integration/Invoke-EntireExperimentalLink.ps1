[CmdletBinding()]
param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$SessionId,
    [switch]$Apply,
    [switch]$AllowLowConfidence
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repo = if (Test-Path -LiteralPath $RepoPath) {
    (Resolve-Path -LiteralPath $RepoPath).Path
} else {
    [System.IO.Path]::GetFullPath($RepoPath)
}
Set-Location $repo

$observeScript = Join-Path $PSScriptRoot 'Invoke-EntireObservability.ps1'
$resolverScript = Join-Path $PSScriptRoot 'Resolve-CopilotSession.ps1'

# Always capture a pre-action snapshot.
& $observeScript -RepoPath $repo -Stage 'pre-commit' -Quiet

$resolver = (& $resolverScript -RepoPath $repo -Json | ConvertFrom-Json)
$selectedId = if ($SessionId) { $SessionId } elseif ($resolver.selected) { $resolver.selected.session_id } else { $null }

$plan = [pscustomobject]@{
    repo_path = $repo
    requested_session_id = $SessionId
    selected_session_id = $selectedId
    classification = $resolver.classification
    confidence = $resolver.confidence
    reason_codes = $resolver.reason_codes
    apply = [bool]$Apply
}

if (-not $Apply) {
    $plan | ConvertTo-Json -Depth 5
    Write-Host "Dry-run only. Re-run with -Apply to execute attach."
    exit 0
}

if ($env:CI -or $env:GITHUB_ACTIONS) {
    throw "Refusing to run destructive attach in CI."
}
if (-not $selectedId) {
    throw "No session ID resolved. Run dry-run and resolve ambiguity first."
}
if (-not $AllowLowConfidence -and ($resolver.classification -eq 'ambiguous' -or $resolver.confidence -lt 0.9)) {
    throw "Resolver confidence too low for apply mode (classification=$($resolver.classification), confidence=$($resolver.confidence))."
}
if ($AllowLowConfidence -and -not $SessionId) {
    throw "Low-confidence bypass requires explicit -SessionId."
}

$gitCommonRaw = (git --no-pager rev-parse --git-common-dir).Trim()
$gitCommon = if ([System.IO.Path]::IsPathRooted($gitCommonRaw)) {
    [System.IO.Path]::GetFullPath($gitCommonRaw)
} else {
    [System.IO.Path]::GetFullPath((Join-Path $repo $gitCommonRaw))
}
$lockDir = Join-Path $gitCommon 'entire-attach-lock'

try {
    New-Item -ItemType Directory -Path $lockDir -ErrorAction Stop | Out-Null
} catch {
    throw "Attach lock already held: $lockDir"
}

try {
    Write-Host "Attaching session $selectedId..."
    entire session attach $selectedId --agent copilot-cli --force
} finally {
    if (Test-Path $lockDir) {
        Remove-Item -Path $lockDir -Force
    }
}

& $observeScript -RepoPath $repo -Stage 'post-commit' -Quiet
Write-Host "Attach completed. Post-commit observability snapshot captured."
