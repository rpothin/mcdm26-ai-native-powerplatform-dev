---
name: app-implementation
description: >
  Orchestrates Power Apps Code App work in a Power Platform project using the
  `code-apps-preview` plugin (microsoft/power-platform-skills).   Use when working on any task involving
  Power Apps code apps: scaffolding new apps, connecting data sources, adding connectors,
  and deploying. Triggers on: create code app, add data source, add connector, deploy app,
  connect Dataverse/SharePoint/Teams/Excel/OneDrive/Office365/Azure DevOps to app.
  Do NOT use for Copilot Studio agents (use agent-implementation), Power Automate flows
  (use backend-process-implementation), or Dataverse schema work alone (use data-management).
---

# app-implementation

Orchestration layer for all Power Apps Code App work in this project.
The `code-apps-preview` plugin provides the full scaffold-to-deploy lifecycle.

## Step 0 — Dependency preflight (required)

Before routing any app task, verify `code-apps-preview` sub-skills are available:
`create-code-app`, `add-dataverse`, `add-sharepoint`, `add-excel`, `add-onedrive`,
`add-teams`, `add-office365`, `add-azuredevops`, `add-connector`, `add-datasource`,
and `deploy`.

If any required sub-skill is missing or unavailable:
1. Stop execution and return a blocked status.
2. Ask the user whether they want to install or enable the missing dependency.
3. Resume only after availability is confirmed.

Do not handcraft connector scaffolding or generated bindings as a fallback for missing skills.

## Step 1 — Environment and solution scope gate (required)

Before any code-app work starts, require explicit target scope:
- Environment: display name and environment ID (or URL)
- Solution: unique name and publisher prefix for the solution that will contain app assets

If either environment or solution is missing, ambiguous, or inferred:
1. Stop execution and return a blocked status.
2. Ask the user to explicitly provide the target environment and solution.
3. Resume only after both are confirmed.

Do not scaffold, connect data sources, or deploy against an implicit target.

## Step 2 — Design alignment with Impeccable (strongly recommended for new apps)

Before scaffolding a new code app, run the `impeccable` skill's `init` flow to establish
product context and a coherent design system. Power Apps code apps are React apps — without
explicit design decisions upfront, UI/UX quality drifts and retroactive corrections are
expensive.

**What `impeccable init` produces:**
- `PRODUCT.md` — register, user personas, brand personality, design principles, anti-references
- `DESIGN.md` — full design system: palette, typography, spacing, component specs
- `.impeccable/design.json` — live sidecar with color ramps, shadow/motion tokens, component snippets
- A design hook that fires after every file edit and flags anti-patterns (literal colors, wrong
  fonts, border-accent violations, color drift)

**When to run:**
- New app: run `impeccable init` before `create-code-app`. The interview takes a few minutes
  and saves many correction cycles later.
- Existing app without PRODUCT.md/DESIGN.md: strongly encourage running `impeccable init`
  before any UI changes.
- Existing app with PRODUCT.md/DESIGN.md: re-run `impeccable context` at the start of each
  session to reload the design system before editing.

**Artifacts location:** `code-apps/<app-name>/PRODUCT.md`, `DESIGN.md`, `.impeccable/`

If the user explicitly skips init, proceed but record the absence of a design baseline and
surface it as a risk at review time. Never disable or silently ignore design hook findings.

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
  └─ Dependency preflight
       ├─ Missing dependency? → ask to install/enable → stop until resolved
       └─ Scope gate (environment + solution explicit)
            ├─ Missing or ambiguous? → ask user → stop until resolved
            └─ Design alignment (impeccable init — strongly recommended)
                 ├─ Skipped? → note missing baseline, continue with caution
                 └─ PRODUCT.md + DESIGN.md created → design hook active
                      └─ create-code-app
                           └─ add-dataverse (default) or add-datasource (unclear source)
                                └─ [optional] add additional sources
                                     └─ make lint && make test
                                          └─ deploy
```

```
Modify existing app
  └─ Dependency preflight
       ├─ Missing dependency? → ask to install/enable → stop until resolved
       └─ Scope gate (environment + solution explicit)
            ├─ Missing or ambiguous? → ask user → stop until resolved
            └─ Design context (impeccable context — if PRODUCT.md/DESIGN.md exist)
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
- If the `impeccable` skill is unavailable, proceed without the design preflight but flag
  the gap — do not silently skip and do not attempt to reproduce Impeccable's behaviour
  manually.
