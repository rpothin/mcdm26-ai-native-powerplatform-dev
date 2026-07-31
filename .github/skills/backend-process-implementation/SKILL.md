---
name: backend-process-implementation
description: >
  Orchestrates Power Automate Cloud Flow work in a Power Platform project
  using the `power-automate` plugin (microsoft/power-platform-skills). Use for any task
  involving Power Automate flows: browsing existing flows, creating new flows, building
  flow logic, debugging failures, diagnosing errors, managing flow lifecycle, and routing
  across environments. Triggers on: create flow, build flow, fix flow, debug flow, enable
  flow, list flows, automate process, background process, scheduled job, approval workflow.
  Do NOT use for Copilot Studio agents (use agent-implementation), Power Apps code apps
  (use app-implementation), or Dataverse schema work alone (use data-management).
---

# backend-process-implementation

Orchestration layer for all Power Automate Cloud Flow work in this project.
The `power-automate` plugin covers the full flow lifecycle from discovery through production.

## Step 0 — Dependency preflight (required)

Before routing any flow task, verify `power-automate` sub-skills are available:
`setup`, `browse-flows`, `create-flow`, `build-flow`, `debug-flow`, `diagnose-flow`,
`manage-flows`, `manage-desktop-flows`, and `route-environments`.

If any required sub-skill is missing or unavailable:
1. Stop execution and return a blocked status.
2. Ask the user whether they want to install or enable the missing dependency.
3. Resume only after availability is confirmed.

Do not attempt flow authoring or diagnosis through ad-hoc JSON edits when these dependencies
are missing.

## Step 1 — Environment and solution scope gate (required)

Before any flow work starts, require explicit target scope:
- Environment: display name and environment ID (or URL)
- Solution: unique name and publisher prefix

If either environment or solution is missing, ambiguous, or inferred:
1. Stop execution and return a blocked status.
2. Ask the user to explicitly provide the target environment and solution.
3. Resume only after both are confirmed.

Do not create, modify, diagnose, or enable flows against an implicit target.

## Available sub-skills

| Sub-skill | When to use |
|-----------|-------------|
| `setup` | First-time environment configuration for Power Automate |
| `browse-flows` | Discover existing flows before creating new ones |
| `create-flow` | Scaffold a new solution-bound cloud flow |
| `build-flow` | Add actions, conditions, and logic to a flow |
| `debug-flow` | Interactively diagnose a failing or misbehaving flow |
| `diagnose-flow` | Automated root-cause analysis on a failed run |
| `manage-flows` | Enable, disable, delete, and update flow metadata |
| `manage-desktop-flows` | Manage RPA / desktop flows |
| `route-environments` | Resolve and switch the active Power Platform environment |

## Project conventions

### 1 — Solution-bound flows only
Every flow must be created inside a Dataverse solution.
Standalone flows (not inside a solution) are not committed to this repo.
When creating a flow, always pass the solution name to `create-flow`.

### 2 — Naming convention
All flows must follow: `<SolutionPrefix>_<VerbObject>`

Examples:
- `MCDM_NotifyOnCaseCreated`
- `MCDM_ProcessApprovalResponse`
- `MCDM_SyncContactToSharePoint`

Reject or rename flows that do not match this pattern before pushing to a solution.

### 3 — Connection references
Connection references must **not** be hardcoded in flow definitions.
They belong in `solutions/<solution-name>/deployment-settings.json`.
When `build-flow` or `create-flow` surfaces a connection reference, record it in
`deployment-settings.json` rather than embedding it inline.

### 4 — Check before creating
Before scaffolding any new flow, run `browse-flows` to check for existing flows with
overlapping trigger/purpose. Surface any potential duplicates to the user before proceeding.
Duplicate flows in a solution cause confusion and inflate licensing costs.

### 5 — Diagnose before fixing
When a flow fails in any environment, always run `diagnose-flow` first.
Do not attempt to fix a flow based on symptom description alone — the diagnostic output
often reveals a different root cause than the surface error.

### 6 — Production enable requires human approval
Before enabling (turning on) any flow in a **production environment**:
1. Present the flow name, solution, trigger, and estimated run frequency.
2. **Wait for explicit human approval.**

This applies even in autopilot mode. Do not self-approve production enables.

## Standard workflow

```
New flow request
  └─ Dependency preflight
       ├─ Missing dependency? → ask to install/enable → stop until resolved
       └─ Scope gate (environment + solution explicit)
            ├─ Missing or ambiguous? → ask user → stop until resolved
            └─ browse-flows (check for duplicates)
                 └─ create-flow (solution-bound, MCDM_ naming)
                      └─ build-flow (add logic)
                           └─ manage-flows:test run
                                └─ Production? → confirm human → manage-flows:enable
```

```
Broken flow
  └─ Dependency preflight
       ├─ Missing dependency? → ask to install/enable → stop until resolved
       └─ Scope gate (environment + solution explicit)
            ├─ Missing or ambiguous? → ask user → stop until resolved
            └─ diagnose-flow (always first)
                 └─ Identify root cause
                      └─ build-flow or manage-flows to fix
                           └─ Re-test → manage-flows:enable (if production, confirm first)
```

## Escape hatches

- If the target environment is unclear, run `route-environments` before any other sub-skill.
- If `diagnose-flow` returns an auth error, route to `data-management` skill to check
  connection references via `dv-connect` before re-running diagnostics.
- Desktop / RPA flows → `manage-desktop-flows` instead of `manage-flows`.
