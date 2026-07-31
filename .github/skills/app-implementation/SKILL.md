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

## Step 2 — Design alignment with Impeccable (strongly recommended)

Power Apps code apps are React apps. Run the `impeccable` skill to establish and maintain
design quality throughout the full lifecycle, not just at init.

### Shared DESIGN.md + per-app PRODUCT.md pattern

This is natively supported by Impeccable's monorepo path resolution:

- **Shared `DESIGN.md`** — lives at `code-apps/DESIGN.md`. One design system, all apps.
- **Shared `.impeccable/`** — lives at `code-apps/` with a `config.json` declaring each
  `code-apps/<app-name>` as a `projectRoot`. This tells Impeccable to walk up and find the
  shared DESIGN.md when running inside any app subfolder.
- **Per-app `PRODUCT.md`** — lives at `code-apps/<app-name>/PRODUCT.md`. Product context
  (users, purpose, brand personality, constraints) is specific to each app.

Setup once: run `impeccable document` at `code-apps/` to capture the shared design system.
Then run `impeccable init --target code-apps/<app-name>/` per app to write its PRODUCT.md.
Impeccable will inherit the shared DESIGN.md automatically via the config.

### Impeccable lifecycle for code apps

| Phase | Command | When to use |
|-------|---------|-------------|
| **Before building** | `shape [feature]` | Plan UX/UI before writing code; runs a discovery interview and produces a design brief |
| **Before building** | `init` | Per-app: captures PRODUCT.md (users, purpose, brand, constraints) |
| **Before building** | `document` | Shared: generates DESIGN.md from existing code (run once at `code-apps/` level) |
| **During development** | `hooks on` | Activates design detector — fires after every file edit and flags anti-patterns |
| **During development** | `live` | Interactive browser variant mode — pick elements, generate alternatives in real time |
| **Evaluate (pre-PR)** | `critique [target]` | UX review: visual hierarchy, IA, cognitive load, heuristic scoring |
| **Evaluate (pre-PR)** | `audit [target]` | Technical quality: a11y (WCAG), perf, responsive, anti-patterns (P0-P3 severity) |
| **Refine** | `polish [target]` | Final quality pass: alignment, spacing, consistency, micro-details |
| **Refine** | `harden [target]` | Production-ready: error states, i18n, text overflow, edge cases |
| **Refine** | `onboard [target]` | First-run flows, empty states, activation moments |
| **Targeted fix** | `adapt [target]` | Responsive and multi-device adaptation |
| **Targeted fix** | `layout [target]` | Spacing, rhythm, visual hierarchy |
| **Targeted fix** | `clarify [target]` | UX copy, labels, error messages |
| **Targeted fix** | `typeset [target]` | Typography hierarchy and font choices |
| **Targeted fix** | `optimize [target]` | UI performance: loading, rendering, bundle size |
| **Enhance** | `colorize / animate / delight` | Strategic color, motion, personality |
| **Maintenance** | `doctor` | Detects and repairs drift between PRODUCT.md, DESIGN.md, and .impeccable/ artifacts |

**Mandatory gates for new apps:** `shape` → `init` → `document` (if DESIGN.md doesn't exist yet) → `hooks on`

**Pre-PR gates:** `critique` + `audit` before opening a pull request. Surface Critical/High findings to the user.

If the user skips init or hooks, proceed but record the absence and surface it at review time.
Never disable or silently ignore design hook findings.

If the `impeccable` skill is unavailable, flag the gap and do not attempt to reproduce its
behaviour manually.

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
            └─ Impeccable: shape → init → document (if no shared DESIGN.md) → hooks on
                 ├─ Skipped? → note missing baseline, continue with caution
                 └─ Design system active
                      └─ create-code-app
                           └─ add-dataverse (default) or add-datasource (unclear source)
                                └─ [optional] add additional sources
                                     └─ impeccable: critique + audit (pre-PR gates)
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
