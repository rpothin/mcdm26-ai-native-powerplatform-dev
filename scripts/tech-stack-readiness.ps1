[CmdletBinding()]
param(
    [switch]$Setup,
    [switch]$FixGhAuth,
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Version {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return $null }
    $clean = $Value.Trim()
    $clean = $clean -replace '^[vV]', ''
    $clean = ($clean -split '[+ -]')[0]
    try { return [version]$clean } catch { return $null }
}

function Compare-Version {
    param(
        [string]$Actual,
        [string]$Minimum
    )
    $a = Normalize-Version $Actual
    $m = Normalize-Version $Minimum
    if (-not $a -or -not $m) { return $null }
    return ($a -ge $m)
}

function Get-CommandTextOutput {
    param(
        [string]$Name,
        [string[]]$CommandArgs = @()
    )
    try {
        $null = Get-Command $Name -ErrorAction Stop
        return (& $Name @CommandArgs 2>&1 | Out-String).Trim()
    } catch {
        return $null
    }
}

function Add-Result {
    param(
        [System.Collections.Generic.List[object]]$List,
        [string]$Category,
        [string]$Name,
        [string]$Installed,
        [string]$Required,
        [string]$Status,
        [string]$Notes
    )
    $List.Add([pscustomobject]@{
            Category  = $Category
            Name      = $Name
            Installed = $Installed
            Required  = $Required
            Status    = $Status
            Notes     = $Notes
        })
}

function Parse-VersionFromRegex {
    param(
        [string]$InputText,
        [string]$Pattern
    )
    if ([string]::IsNullOrWhiteSpace($InputText)) { return $null }
    $m = [regex]::Match($InputText, $Pattern)
    if ($m.Success -and $m.Groups.Count -gt 1) { return $m.Groups[1].Value.Trim() }
    return $null
}

function Remove-Ansi {
    param([string]$Text)
    if ($null -eq $Text) { return $null }
    return ($Text -replace '\x1B\[[0-9;?]*[ -/]*[@-~]', '')
}

function Get-PluginVersionFromLocalInstall {
    param([string]$PluginKey)

    $parts = $PluginKey.Split("@")
    if ($parts.Count -ne 2) { return $null }
    $pluginName = $parts[0]
    $marketplace = $parts[1]

    $root = Join-Path $env:USERPROFILE ".copilot\installed-plugins\$marketplace\$pluginName"
    if (-not (Test-Path $root)) { return $null }

    $jsonCandidates = Get-ChildItem $root -Recurse -Filter "plugin.json" -ErrorAction SilentlyContinue
    foreach ($file in $jsonCandidates) {
        try {
            $obj = Get-Content $file.FullName -Raw | ConvertFrom-Json
            if ($obj.name -eq $pluginName -and $obj.version) {
                return [string]$obj.version
            }
        } catch {
            continue
        }
    }
    return $null
}

if ($FixGhAuth -and (Test-Path Env:GITHUB_TOKEN)) {
    Remove-Item Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
    Write-Host "Removed GITHUB_TOKEN from current session environment."
}

if ($Setup) {
    Write-Host "Running update/setup actions..." -ForegroundColor Cyan

    $wingetIds = @(
        "Microsoft.AzureCLI",
        "Microsoft.Azd",
        "OpenJS.NodeJS.22",
        "GitHub.cli"
    )
    foreach ($id in $wingetIds) {
        try {
            Write-Host "winget upgrade $id"
            & winget upgrade --id $id --accept-package-agreements --accept-source-agreements 2>&1 | Out-Host
        } catch {
            Write-Warning "winget upgrade failed for ${id}: $($_.Exception.Message)"
        }
    }

    try {
        Write-Host "pac install latest"
        & pac install latest 2>&1 | Out-Host
    } catch {
        Write-Warning "pac install latest failed: $($_.Exception.Message)"
    }

    try {
        Write-Host "npm install -g @microsoft/dataverse@latest"
        & npm install -g @microsoft/dataverse@latest 2>&1 | Out-Host
    } catch {
        Write-Warning "Dataverse CLI npm update failed: $($_.Exception.Message)"
    }

    try {
        Write-Host "copilot plugin update --all"
        & copilot plugin update --all 2>&1 | Out-Host
    } catch {
        Write-Warning "Plugin update failed (often a lock issue if Copilot is open): $($_.Exception.Message)"
    }
}

$results = [System.Collections.Generic.List[object]]::new()

$requirements = @{
    "az"         = "2.88.0"
    "azd"        = "1.29.0"
    "node"       = "22.0.0"
    "npm"        = "11.0.0"
    "pac"        = "2.9.3"
    "dotnet"     = "8.0.0"
    "gh"         = "2.96.0"
    "gh-stack"   = "0.1.0"
    "dataverse"  = "1.0.59"
    "plugin-dv"  = "1.10.0"
    "plugin-cps" = "1.0.11"
    "plugin-cap" = "1.1.0"
    "plugin-pa"  = "2.3.1"
    "plugin-mcs" = "1.0.2"
}

$azRaw = Get-CommandTextOutput -Name "az" -CommandArgs @("version", "--output", "json")
$azVersion = $null
if ($azRaw) {
    try {
        $azObj = $azRaw | ConvertFrom-Json
        $azVersion = $azObj."azure-cli"
    } catch {
        $azVersion = Parse-VersionFromRegex -InputText $azRaw -Pattern 'azure-cli[^0-9]*([0-9]+\.[0-9]+\.[0-9]+)'
    }
}

$azdRaw = Get-CommandTextOutput -Name "azd" -CommandArgs @("version")
$azdVersion = Parse-VersionFromRegex -InputText $azdRaw -Pattern 'azd version ([0-9]+\.[0-9]+\.[0-9]+)'

$nodeRaw = Get-CommandTextOutput -Name "node" -CommandArgs @("--version")
$nodeVersion = if ($nodeRaw) { $nodeRaw.TrimStart('v') } else { $null }

$npmRaw = Get-CommandTextOutput -Name "npm" -CommandArgs @("--version")
$npmVersion = if ($npmRaw) { $npmRaw.Trim() } else { $null }

$pacRaw = Get-CommandTextOutput -Name "pac"
$pacVersion = Parse-VersionFromRegex -InputText $pacRaw -Pattern 'Version:\s*([0-9]+\.[0-9]+\.[0-9]+)'

$dotnetRaw = Get-CommandTextOutput -Name "dotnet" -CommandArgs @("--version")
$dotnetVersion = if ($dotnetRaw) { $dotnetRaw.Trim() } else { $null }

$ghRaw = Get-CommandTextOutput -Name "gh" -CommandArgs @("--version")
$ghVersion = Parse-VersionFromRegex -InputText $ghRaw -Pattern 'gh version ([0-9]+\.[0-9]+\.[0-9]+)'

$gitRaw = Get-CommandTextOutput -Name "git" -CommandArgs @("--version")
$gitVersion = Parse-VersionFromRegex -InputText $gitRaw -Pattern 'git version ([0-9]+\.[0-9]+\.[0-9]+)'

$ghExtRaw = Get-CommandTextOutput -Name "gh" -CommandArgs @("extension", "list")
$ghStackVersion = $null
if ($ghExtRaw) {
    $ghStackVersion = Parse-VersionFromRegex -InputText $ghExtRaw -Pattern 'gh stack\s+github/gh-stack\s+v([0-9]+\.[0-9]+\.[0-9]+)'
}

$dataverseInstalledRaw = Get-CommandTextOutput -Name "npm" -CommandArgs @("list", "-g", "@microsoft/dataverse", "--depth=0")
$dataverseInstalledVersion = Parse-VersionFromRegex -InputText $dataverseInstalledRaw -Pattern '@microsoft/dataverse@([0-9]+\.[0-9]+\.[0-9]+)'

$dataverseLatestRaw = Get-CommandTextOutput -Name "npm" -CommandArgs @("view", "@microsoft/dataverse", "version")
$dataverseLatestVersion = if ($dataverseLatestRaw) { $dataverseLatestRaw.Trim() } else { $null }

$copilotPluginsRaw = Get-CommandTextOutput -Name "copilot" -CommandArgs @("plugin", "list")
$plugins = @{}
if ($copilotPluginsRaw) {
    $normalizedCopilotPlugins = Remove-Ansi $copilotPluginsRaw
    # Be tolerant to terminal rendering differences (bullet glyph, asterisk, dash, or plain text).
    $matches = [regex]::Matches(
        $normalizedCopilotPlugins,
        '(?im)^\s*(?:[•\-\*]\s+)?([a-z0-9][a-z0-9\-]*)@([a-z0-9][a-z0-9\-]*)\s+\(v([0-9]+\.[0-9]+\.[0-9]+)\)\s*$'
    )
    if ($matches.Count -eq 0) {
        # Fallback to non-anchored scan in case the host injects extra prefix text per line.
        $matches = [regex]::Matches(
            $normalizedCopilotPlugins,
            '(?i)([a-z0-9][a-z0-9\-]*)@([a-z0-9][a-z0-9\-]*)\s+\(v([0-9]+\.[0-9]+\.[0-9]+)\)'
        )
    }
    foreach ($m in $matches) {
        $key = "$($m.Groups[1].Value)@$($m.Groups[2].Value)"
        $plugins[$key] = $m.Groups[3].Value
    }
}

$toolChecks = @(
    @{ Name = "az"; Installed = $azVersion; Required = $requirements.az; Category = "Tooling" },
    @{ Name = "azd"; Installed = $azdVersion; Required = $requirements.azd; Category = "Tooling" },
    @{ Name = "node"; Installed = $nodeVersion; Required = $requirements.node; Category = "Tooling" },
    @{ Name = "npm"; Installed = $npmVersion; Required = $requirements.npm; Category = "Tooling" },
    @{ Name = "pac"; Installed = $pacVersion; Required = $requirements.pac; Category = "Tooling" },
    @{ Name = "dotnet"; Installed = $dotnetVersion; Required = $requirements.dotnet; Category = "Tooling" },
    @{ Name = "gh"; Installed = $ghVersion; Required = $requirements.gh; Category = "Tooling" },
    @{ Name = "git"; Installed = $gitVersion; Required = "2.0.0"; Category = "Tooling" },
    @{ Name = "gh-stack"; Installed = $ghStackVersion; Required = $requirements."gh-stack"; Category = "Extensions" },
    @{ Name = "@microsoft/dataverse"; Installed = $dataverseInstalledVersion; Required = $requirements.dataverse; Category = "Tooling" }
)

foreach ($check in $toolChecks) {
    if ([string]::IsNullOrWhiteSpace($check.Installed)) {
        Add-Result -List $results -Category $check.Category -Name $check.Name -Installed "-" -Required $check.Required -Status "FAIL" -Notes "Not detected"
        continue
    }
    $ok = Compare-Version -Actual $check.Installed -Minimum $check.Required
    if ($ok -eq $true) {
        $notes = ""
        if ($check.Name -eq "@microsoft/dataverse" -and $dataverseLatestVersion) {
            $notes = "latest=$dataverseLatestVersion"
        }
        Add-Result -List $results -Category $check.Category -Name $check.Name -Installed $check.Installed -Required $check.Required -Status "OK" -Notes $notes
    } elseif ($ok -eq $false) {
        Add-Result -List $results -Category $check.Category -Name $check.Name -Installed $check.Installed -Required $check.Required -Status "WARN" -Notes "Below recommended baseline"
    } else {
        Add-Result -List $results -Category $check.Category -Name $check.Name -Installed $check.Installed -Required $check.Required -Status "WARN" -Notes "Version parse issue"
    }
}

$pluginChecks = @(
    @{ Key = "dataverse@awesome-copilot"; Required = $requirements."plugin-dv" },
    @{ Key = "copilot-studio@skills-for-copilot-studio"; Required = $requirements."plugin-cps" },
    @{ Key = "code-apps-preview@power-platform-skills"; Required = $requirements."plugin-cap" },
    @{ Key = "power-automate@power-platform-skills"; Required = $requirements."plugin-pa" },
    @{ Key = "mcs-assistant@copilot-studio-plugin"; Required = $requirements."plugin-mcs" }
)

foreach ($p in $pluginChecks) {
    $installed = $null
    if ($plugins.ContainsKey($p.Key)) { $installed = $plugins[$p.Key] }
    if (-not $installed) { $installed = Get-PluginVersionFromLocalInstall -PluginKey $p.Key }
    if (-not $installed) {
        Add-Result -List $results -Category "Plugins" -Name $p.Key -Installed "-" -Required $p.Required -Status "FAIL" -Notes "Plugin not installed"
        continue
    }
    $ok = Compare-Version -Actual $installed -Minimum $p.Required
    $status = if ($ok -eq $true) { "OK" } else { "WARN" }
    $notes = if ($ok -eq $true) { "" } else { "Below recommended baseline" }
    Add-Result -List $results -Category "Plugins" -Name $p.Key -Installed $installed -Required $p.Required -Status $status -Notes $notes
}

if (Test-Path Env:GITHUB_TOKEN) {
    $ghAuth = Get-CommandTextOutput -Name "gh" -CommandArgs @("auth", "status")
    if ($ghAuth -and $ghAuth -match 'token in GITHUB_TOKEN is invalid') {
        Add-Result -List $results -Category "Auth" -Name "GITHUB_TOKEN precedence" -Installed "invalid env token detected" -Required "unset or valid token" -Status "WARN" -Notes "Run with -FixGhAuth or remove env var"
    }
}

if ($Json) {
    $results | ConvertTo-Json -Depth 4
} else {
    Write-Host ""
    Write-Host "Tech stack readiness report" -ForegroundColor Cyan
    Write-Host "=========================="
    $results | Sort-Object Category, Name | Format-Table -AutoSize

    $failCount = @($results | Where-Object { $_.Status -eq "FAIL" }).Count
    $warnCount = @($results | Where-Object { $_.Status -eq "WARN" }).Count
    Write-Host ""
    if ($failCount -eq 0 -and $warnCount -eq 0) {
        Write-Host "Result: READY" -ForegroundColor Green
    } elseif ($failCount -eq 0) {
        Write-Host "Result: READY WITH WARNINGS ($warnCount warning(s))" -ForegroundColor Yellow
    } else {
        Write-Host "Result: NOT READY ($failCount fail(s), $warnCount warning(s))" -ForegroundColor Red
    }
}
