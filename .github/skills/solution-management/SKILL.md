---
name: solution-management
description: >
  Orchestrates Power Platform solution lifecycle in the Dev environment for a Power Platform
  project. Covers solution creation, local clone and sync, semantic-versioned solution version
  bumps, deployment-settings file generation for connection references and environment
  variables, solution checker validation, solution packing, and dependency hygiene. Use when
  starting any content work session or when a pre-PR quality gate is needed. Triggers on:
  create solution, clone solution, sync solution, bump solution version, semver, semantic
  versioning, solution checker, pack solution, deployment settings, generate settings,
  connection references, environment variables, solution hygiene, dependency check,
  pre-PR validation, init solution. Do NOT use for: deploying or importing solutions to
  staging or production (use the GitHub deployment workflow), creating Dataverse tables or
  records (use data-management), building flows (use backend-process-implementation),
  building apps (use app-implementation), authoring agents (use agent-implementation).
---

# solution-management

Orchestration layer for Power Platform solution lifecycle in the Dev environment.
This skill owns the solution *container* — creating it, keeping local files current,
generating configuration artifacts, and validating quality before a PR. It does **not**
deploy solutions to higher environments; that boundary is owned by the GitHub workflow.

## Step 0 — Dependency preflight (required)

Before any solution work, verify the primary sub-skill is available:
- `dv-solution` from the `dataverse` plugin (microsoft/Dataverse-skills)

If `dv-solution` is unavailable, check for `pac` CLI as fallback:
- Run `pac --version` to confirm availability.

If neither is available:
1. Stop execution and return a blocked status.
2. Ask the user whether they want to install or enable the missing dependency.
3. Resume only after at least one option is confirmed.

Tool priority for all operations in this skill:
1. `dv-solution` sub-skill (preferred — higher-level, safer, plugin-managed)
2. `pac` CLI (fallback — when `dv-solution` does not cover the operation)
3. Raw Power Platform API / `az` CLI (last resort only — flag explicitly before using)

## Step 1 — Environment and solution scope gate (required)

Before any solution work starts, require explicit target scope:
- Environment: Dev environment display name and environment ID (or URL)
- Solution: unique name and publisher prefix

If either is missing, ambiguous, or inferred:
1. Stop execution and return a blocked status.
2. Ask the user to explicitly provide the Dev target environment and solution.
3. Resume only after both are confirmed.

Only the Dev environment is a valid target for agent-driven solution work. Any request
targeting staging or production must be rejected — point the user to the GitHub workflow.

## Source of truth for ALM strategy

`ARCHITECTURE.md` §7 (ALM & environments) at the repo root confirms the current strategy for
this project: a **single Dev environment with one unmanaged solution** holding all components
(tables, flows, code apps, agents). Use it to pre-fill the scope gate above instead of
re-negotiating environment/solution scope from scratch each session — but still have the user
confirm the exact environment ID/URL and solution unique name before any write. The repo's
`.github/workflows/deploy-solution.yml` illustrates the target multi-environment promotion
pattern but is explicitly out of scope for live agent-driven work (see Hard boundaries below).

## Operations and tool routing

### Solution creation

Goal: ensure the solution exists in the Dev environment with the correct publisher and prefix.

1. Use `dv-solution` to check whether the solution already exists.
2. If it does not exist, use `dv-solution` to create it (publisher + prefix required).
3. If `dv-solution` cannot create directly, fall back to `pac solution create` CLI.

### Local clone and sync

Goal: keep local solution files current with the Dev environment state.

- First clone: `dv-solution` export + unpack, or `pac solution clone` as fallback.
- Subsequent sync: `dv-solution` pull / sync operation, or `pac solution sync` as fallback.
- Solution files live under `solutions/<solution-unique-name>/` at the repo root.
- Never manually edit files under `solutions/<solution-unique-name>/Other/` — they are
  managed by the tooling.

### Solution versioning ([Semantic Versioning](https://semver.org/))

Goal: keep the solution's version meaningful and monotonically increasing, using SemVer
semantics mapped onto Dataverse's mandatory 4-segment version format
(`Major.Minor.Build.Revision` — SemVer only defines `MAJOR.MINOR.PATCH`).

| SemVer | Dataverse segment | Bump when |
|---|---|---|
| `MAJOR` | Major | Breaking change — removed/renamed component, breaking schema change |
| `MINOR` | Minor | New backward-compatible feature — new table, column, flow, agent, app |
| `PATCH` | Build (3rd segment) | Backward-compatible fix |
| *(none — SemVer has no 4th part)* | Revision (4th segment) | Always `0` in this repo; Dataverse requires the segment, SemVer does not use it |

**Bump the version in the Dev environment (source of truth), then re-sync locally** —
never hand-edit `Other/Solution.xml` directly (it is tooling-managed, see Local clone and
sync above):

1. `dv-solution` — use if it exposes a version-bump operation.
2. `pac solution online-version --environment <url> --solution-name <UniqueName> --solution-version <Major.Minor.Patch.0>` — primary fallback (CLI). Omit `--solution-version` to read the current online version.
3. Re-sync/re-export the solution so the local unpacked `Other/Solution.xml` reflects the new version.

Bump the version as part of any change that introduces a new component or a fix, before
running the solution checker / pack step of the pre-PR quality gate. Ask the user to confirm
the bump level (major/minor/patch) whenever it isn't obvious from the change.

### Deployment-settings generation

Goal: produce `solutions/<solution-unique-name>/deployment-settings.json` containing all
connection references and environment variable definitions, with placeholder values for
non-Dev environments.

1. `dv-solution` — use if it exposes a settings-generation operation.
2. `pac solution generate-settings` — primary fallback (CLI).
3. Manual inspection of the unpacked solution XML — last resort; flag to user.

After generation, verify every connection reference and environment variable in the solution
has a corresponding entry. Surface any gaps to the user before proceeding.

### Solution checker

Goal: validate the solution against Power Platform best-practice rules before a PR.

1. `dv-solution` — use if it exposes a checker operation.
2. `pac solution check` — primary fallback (CLI).

Always run with the standard ruleset. Surface all Critical and High severity findings to
the user and block the PR recommendation until they are addressed or explicitly waived.

### Solution pack (pre-PR artifact)

Goal: produce a clean `.zip` pack of the local solution for CI consumption.

1. `dv-solution` — use if it exposes a pack operation.
2. `pac solution pack` — primary fallback (CLI).

Pack is the last step before opening a PR. Never pack a solution that has failing checker
results (Critical/High) unless the user has explicitly waived them.

### Dependency hygiene

Goal: identify and flag dependency risks in the solution before changes are committed.

Check for:
- Components that depend on managed solutions not listed as explicit dependencies
- Circular or implicit dependencies between solutions in the same publisher
- Unmanaged customisations layered on top of managed components

Use `dv-solution` introspection first; fall back to inspecting the unpacked solution XML.
Surface findings as warnings — do not auto-fix dependency issues without human guidance.

## Standard workflows

```
Start of a feature session
  └─ Step 0: dependency preflight
       └─ Step 1: scope gate (Dev env + solution explicit)
            ├─ Solution missing in Dev? → create (dv-solution → pac fallback)
            └─ Solution exists
                 ├─ Not cloned locally? → clone (dv-solution → pac fallback)
                 └─ Already cloned? → sync (dv-solution → pac fallback)
                      └─ deployment-settings.json current? → generate if not
                           └─ Hand off to content skills (data / agent / app / flow)
```

```
Pre-PR quality gate
  └─ Sync (pull latest Dev state)
       └─ deployment-settings.json up to date? → regenerate if not
            └─ Version bump needed? → bump SemVer (online-version → re-sync)
                 └─ solution checker (dv-solution → pac fallback)
                      ├─ Critical/High findings? → block → surface to user
                      └─ Clean (or waived) → pac solution pack
                           └─ Ready for PR
```

## Hard boundaries

| Action | Status | Reason |
|--------|--------|--------|
| `pac solution import` / `dv-solution` import to staging/prod | **Forbidden** | Deployment is the GitHub workflow |
| Write operations targeting non-Dev environments | **Forbidden** | Dev only for agent-driven work |
| Auto-fixing dependency issues | **Blocked** | Requires human guidance |
| Packing with unresolved Critical/High checker findings | **Blocked** | Unless user explicitly waives |

## Escape hatches

- If `dv-solution` and `pac` both fail for an operation, surface the raw error + the
  manual XML-based fallback steps rather than attempting a raw API call silently.
- If the solution has multiple layers (managed base + unmanaged top), document which layer
  is being operated on before any export or pack.
- If `deployment-settings.json` already exists and is more recent than the last sync,
  ask the user whether to overwrite or merge before regenerating.
