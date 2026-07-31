---
name: app-implementation
description: >
  Orchestrates Power Apps Code App work in the mcdm26 Power Platform demo project using the
  `code-apps-preview` plugin (microsoft/power-platform-skills). Use for any task involving
  Power Apps code apps: scaffolding new apps, connecting data sources, adding connectors,
  and deploying. Triggers on: create code app, add data source, add connector, deploy app,
  connect Dataverse/SharePoint/Teams/Excel/OneDrive/Office365/Azure DevOps to app.
  Do NOT use for Copilot Studio agents (use agent-implementation), Power Automate flows
  (use backend-process-implementation), or Dataverse schema work alone (use data-management).
---

# app-implementation

Orchestration layer for all Power Apps Code App work in this project.
The `code-apps-preview` plugin provides the full scaffold-to-deploy lifecycle.

## Available sub-skills

| Sub-skill | When to use |
|-----------|-------------|
| `create-code-app` | Start any new app — always the first step |
| `add-dataverse` | Connect a Dataverse table as a data source |
| `add-sharepoint` | Connect a SharePoint list or library |
| `add-excel` | Connect an Excel workbook |
| `add-onedrive` | Connect OneDrive files |
| `add-teams` | Connect Microsoft Teams data |
| `add-office365` | Connect Outlook, Calendar, or other O365 data |
| `add-azuredevops` | Connect Azure DevOps work items or repos |
| `add-connector` | Add any other connector (premium or standard) |
| `add-datasource` | Use when the right connector is unclear — it resolves the best fit |
| `deploy` | Push the app to the Power Platform environment |

## Project conventions

### App folder structure
All code apps live under `code-apps/<app-name>/` at the repo root.
Never create app files outside this path.

### Preferred data source
Prefer Dataverse as the primary data source.
- New app with data needs → `add-dataverse` unless there is an explicit reason not to.
- Unclear source → `add-datasource` (it selects the best connector).
- Non-Dataverse sources are valid when the data lives there natively (SharePoint lists,
  Excel workbooks, etc.).

### Generated files are read-only
Never edit files under `src/generated/` by hand.
These files are regenerated automatically when connector sub-skills run.
Hand edits will be overwritten and may corrupt the connector binding.

### Pre-push quality gate
Before calling `deploy` or running `pac code push`:
1. `make lint` — must pass with no errors.
2. `make test` — must pass with no failures.

If either step fails, fix the errors before deploying.

### Premium connector confirmation
Before adding any premium connector via `add-connector`:
1. Identify the connector tier (premium vs. standard).
2. Surface the DLP policy implications to the user.
3. **Wait for explicit human confirmation** before executing `add-connector`.

This applies even in autopilot mode. Premium connectors affect licensing and DLP — the
human must acknowledge before the connector is added.

## Standard workflow

```
New app
  └─ create-code-app
       └─ add-dataverse (default) or add-datasource (unclear source)
            └─ [optional] add additional sources
                 └─ make lint && make test
                      └─ deploy
```

```
Modify existing app
  └─ Identify change type
       ├─ New data source → appropriate add-* sub-skill
       │    └─ Premium? → flag DLP + confirm → add-connector
       └─ No new source → edit, then make lint && make test → deploy
```

## Escape hatches

- If `create-code-app` fails due to environment targeting, run `route-environments` from
  the `power-automate` plugin to verify the active environment, then retry.
- If `deploy` fails with a DLP error, surface the full error message to the user and pause
  for guidance rather than retrying automatically.
