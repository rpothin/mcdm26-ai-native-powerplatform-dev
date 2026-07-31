# Tech stack readiness (demo replay)

This page captures the setup and validation flow used to prepare this repository for the demo stack.

Use it after the presentation to quickly verify your environment or bootstrap missing/outdated components.

## Scope

This checklist covers tooling required by the plugins/skills used in this repo:

- `power-platform-skills` (`code-apps-preview`, `power-automate`)
- `Dataverse-skills` (`dataverse`)
- `skills-for-copilot-studio` (`copilot-studio`)
- `copilot-studio-plugin` (`mcs-assistant`)
- `gh-stack`
- `Entire` (checkpoint tracking for Copilot CLI sessions)

## Fast path

From repo root:

```powershell
.\scripts\tech-stack-readiness.ps1
```

To apply updates and plugin refresh automatically:

```powershell
.\scripts\tech-stack-readiness.ps1 -Setup
```

If `gh` is failing with bad credentials because of an invalid `GITHUB_TOKEN` environment variable:

```powershell
.\scripts\tech-stack-readiness.ps1 -FixGhAuth
```

## Baseline versions used for the demo

| Component | Baseline |
| --- | --- |
| Azure CLI (`az`) | `2.88.0+` |
| Azure Developer CLI (`azd`) | `1.29.0+` |
| Node.js | `22.x` |
| npm | `11.x` |
| Power Platform CLI (`pac`) | `2.9.3+` (tested with `2.10.1`) |
| Dataverse CLI (`@microsoft/dataverse`) | `1.0.59+` |
| GitHub CLI (`gh`) | `2.96.0+` |
| gh-stack extension | `0.1.0+` |
| Entire CLI (`entire`) | `0.9.0+` |

> [!NOTE]
> `gh` latest availability through `winget` can lag behind the upstream GitHub release for a short period.

> [!NOTE]
> The Entire Scoop package was renamed from `entire/cli` to `entire/entire` at v0.9.0. If you have `cli` installed from the `entire` bucket, uninstall it (`scoop uninstall cli`) and reinstall (`scoop install entire/entire`).

## What the script checks

1. External CLIs and runtime versions (`az`, `azd`, `node`, `npm`, `pac`, `dotnet`, `gh`, `git`)
2. `gh-stack` extension version
3. Installed Copilot plugins and versions:
   - `dataverse@awesome-copilot`
   - `copilot-studio@skills-for-copilot-studio`
   - `code-apps-preview@power-platform-skills`
   - `power-automate@power-platform-skills`
   - `mcs-assistant@copilot-studio-plugin`
4. Dataverse CLI npm package (`@microsoft/dataverse`)
5. Entire CLI version (`entire`) and `git-remote-entire` availability
6. Entire repo readiness: bucket added, `.entire/settings.json` committed, git hooks installed
7. Entire skills: all expected skill folders present under `~\.copilot\skills`
8. Common auth pitfall: invalid `GITHUB_TOKEN` overriding valid `gh` keychain auth

## What `-Setup` does

`-Setup` runs non-destructive update/install commands:

- `winget upgrade` for `Microsoft.AzureCLI`, `Microsoft.Azd`, `OpenJS.NodeJS.22`, `GitHub.cli`
- `pac install latest`
- `npm install -g @microsoft/dataverse@latest`
- `copilot plugin update --all`
- Entire: adds the `entire` Scoop bucket if missing, installs/upgrades `entire/entire`, runs `entire enable -y --agent copilot-cli` if not yet enabled, and installs Entire skills via `npx skills add https://github.com/entireio/skills --all` into `~\.copilot\skills`

> [!WARNING]
> Plugin update can fail with file-lock errors when plugins are in use. If that happens, close the GitHub Copilot App/CLI session and run the update command again.

> [!NOTE]
> `npx skills add` may write skills to `.agents/skills`, `.claude/skills`, or `agent/skills` depending on the agent detected. For a Copilot-centric setup, the canonical location is `~\.copilot\skills`. The script moves any misplaced copies automatically.

## Troubleshooting

### `gh issue list` returns HTTP 401 with "Bad credentials"

Cause: invalid `GITHUB_TOKEN` env var is taking priority over your valid keychain login.

Fix:

```powershell
Remove-Item Env:GITHUB_TOKEN
gh auth status
```

Optionally remove persistent user-level env var:

```powershell
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $null, "User")
```

### `az version` returns `Failed to load python executable.`

Usually a broken/interrupted Azure CLI MSI update.

1. Close installer-related terminals/apps.
2. Ensure no stuck `msiexec` install is running.
3. Re-run:

```powershell
winget install --id Microsoft.AzureCLI --source winget --force --accept-package-agreements --accept-source-agreements
```

If you get MSI exit code `1618` (another installation in progress), wait for the current installer to finish or clear the stuck installer process, then retry.

### Entire CLI not found or wrong version

If `entire` is missing or still reports `0.8.42` (old package name `cli`):

```powershell
scoop bucket add entire https://github.com/entireio/scoop-bucket.git
scoop uninstall cli         # only if you had the old package name
scoop install entire/entire
entire --version            # should report 0.9.0+
```

### Entire not enabled in this repo

If `entire status` shows "not enabled" or git hooks are missing:

```powershell
entire enable -y --agent copilot-cli
git add .entire/settings.json .entire/.gitignore
git commit -m "chore: enable Entire checkpoint tracking for Copilot CLI"
```

### Entire skills installed to wrong folder

`npx skills add` may write to `.agents/skills`, `.claude/skills`, or `agent/skills` instead of `~\.copilot\skills`. Move them manually:

```powershell
# Run from repo root — moves any misplaced skill folders then removes the empty dirs
@('.agents', '.claude', 'agent') | ForEach-Object {
    $src = Join-Path $PWD "$_\skills"
    $dst = Join-Path $env:USERPROFILE '.copilot\skills'
    if (Test-Path $src) {
        Get-ChildItem $src -Directory | Where-Object { !(Test-Path (Join-Path $dst $_.Name)) } |
            ForEach-Object { Move-Item $_.FullName $dst }
        if ((Get-ChildItem $src -Force | Measure-Object).Count -eq 0) { Remove-Item $src -Force }
    }
    $root = Join-Path $PWD $_
    if ((Test-Path $root) -and ((Get-ChildItem $root -Force | Measure-Object).Count -eq 0)) { Remove-Item $root -Force }
}
```

After moving skills, restart your Copilot session to reload them.

