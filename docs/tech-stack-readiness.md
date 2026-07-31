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

> [!NOTE]
> `gh` latest availability through `winget` can lag behind the upstream GitHub release for a short period.

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
5. Common auth pitfall: invalid `GITHUB_TOKEN` overriding valid `gh` keychain auth

## What `-Setup` does

`-Setup` runs non-destructive update/install commands:

- `winget upgrade` for `Microsoft.AzureCLI`, `Microsoft.Azd`, `OpenJS.NodeJS.22`, `GitHub.cli`
- `pac install latest`
- `npm install -g @microsoft/dataverse@latest`
- `copilot plugin update --all`

> [!WARNING]
> Plugin update can fail with file-lock errors when plugins are in use. If that happens, close the GitHub Copilot App/CLI session and run the update command again.

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

