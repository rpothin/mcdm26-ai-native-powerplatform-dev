# AGENTS.md

Demo companion repo for "AI-Native Power Platform Development: Building from the IDE" (Microsoft Community Days Montreal 2026) — demonstrates an IDE-centred, AI-assisted workflow spanning Copilot Studio agents, Power Apps code apps, and Power Platform solution ALM.

## Commands

Run `make help` to discover all available targets and usage examples.

Authentication — when a CLI has no active auth context, trigger device-code auth and surface the URL and code to the user so they can complete sign-in:

```sh
pac auth create --deviceCode   # Power Platform / Dataverse
az login --use-device-code     # Azure CLI (az, azd)
gh auth login                  # GitHub CLI — follow the prompts
```

## Stack

Power Platform CLI (`pac`) · Node.js · Azure CLI (`az`) · Azure Developer CLI (`azd`) · GitHub CLI (`gh`) · gh-stack · Entire CLI · React + Vite (code apps, planned)

Read `docs/tech-stack-readiness.md` for exact baseline versions and the automated readiness script.

## Foundational documents

The demo product (**Poutine League**) is specified across three layered documents. Consult the one matching the question at hand before designing or authoring anything — don't re-derive intent that is already documented:

| Document | Answers questions about | Consult before |
|---|---|---|
| [`PRODUCT.md`](PRODUCT.md) | Functional vision, audience, gamification rules, agentic feature priorities | Any product/UX decision |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Data model, agents, flows, ALM/environment strategy | Any Dataverse schema, flow, or agent work |
| [`code-apps/DESIGN.md`](code-apps/DESIGN.md) | Visual design system (colors, type, components) shared by all code apps | Any code app UI work |

> [!NOTE]
> Naming collision to be aware of: the root `PRODUCT.md` above is the **whole-product functional vision**. A different, per-app `code-apps/<app-name>/PRODUCT.md` also exists/will exist — that one is Impeccable's narrower **product context for a single code app** (users, brand personality, constraints for that app only). Don't confuse the two when reading or writing either.

These three foundational documents are **human-owned**. If a session finds one out of date (e.g., a new agent, table, or design token was introduced that isn't reflected), formulate the proposed change, present it to the user, and apply only after explicit approval — the same governance already required for `DESIGN.md` in the `app-implementation` skill.

## Way of working

### Skills first — always

Invoke the matching orchestrator skill before reaching for any CLI or tool directly. Skills enforce correct patterns, sequencing, and review gates that raw CLI bypasses.

| Task area | Skill |
|---|---|
| Dataverse schema, records, solutions, security, environment admin | `data-management` |
| Copilot Studio agent authoring, review, testing, ALM | `agent-implementation` |
| Power Apps code app (scaffold, connectors, lint, deploy) | `app-implementation` |
| Power Automate cloud flows (create, debug, manage) | `backend-process-implementation` |
| Power Platform solution lifecycle (pack, check, sync, deploy settings) | `solution-management` |

### Nested sessions, stacked PRs & Entire

Break any non-trivial change into a stack of small, independently-reviewable PRs using `gh-stack`. Each layer is its own nested session and worktree, spawned from a coordinator session.

### Entire traceability protocol (mandatory)

Use this exact flow for every branch/worktree in this repo:

```powershell
# 1. Capture observability evidence before finalization
Set-Location <path-to-nested-worktree>
make entire-observe

# 2. Run dry attach decision first (never skip)
make entire-link-dry

# 3. Apply only when dry output is acceptable
make entire-link-apply

# 4. If apply is blocked but branch must be recovered, use explicit runtime session ID
#    (from ~/.copilot/session-state/<project-session-id>/workspace.yaml or events.jsonl)
make entire-link-apply-unsafe SESSION_ID=<runtime-session-id>

# 5. Finalize and verify branch-head trailer posture
make entire-stack-finalize

# 6. Push branch state
git push origin <branch-name> --force-with-lease
```

> [!WARNING]
> **Do not run raw `entire session attach ... --force` by default.** Use helper targets first. Raw attach is break-glass only when helper flow cannot proceed.

> [!WARNING]
> **Single-writer rule (mandatory):** never run overlapping attach operations from multiple sessions on the same branch/worktree. We reproduced silent trailer replacement (`Entire-Checkpoint`) under concurrent raw attaches.

> [!TIP]
> If `entire session current` resolves to an ended/wrong session, resolve runtime session ID from `~/.copilot/session-state/<project-session-id>/workspace.yaml` and use `SESSION_ID=...` explicit mode.

> [!NOTE]
> Do not modify `.github/hooks/entire.json` — it is managed by `entire agent add` and overwritten on reinstall.

> [!NOTE]
> In autopilot worktrees, `workspace.yaml` can keep the creation-time branch name after `rename_branch`; treat branch mismatch as expected drift and resolve by git root + recency.

### Troubleshooting: entire activity shows too few sessions

`entire activity` only reflects checkpoints linked to current branch heads. In stacked workflows, rebases and force-pushes can drop trailer coverage from some layers. Use this checklist to diagnose and recover.

**1. Check trailer presence per branch**

```powershell
# Run from repo root — replace branch names with your stack
foreach($b in @(
  'rpothin-add-orchestrator-skills',
  'rpothin-feat-makefile-and-deployment-workflow',
  'rpothin-init-agents-md',
  'rpothin-add-gitignore-hardening'
)){
  git --no-pager log -1 --format='%H %s' origin/$b
  $msg = git --no-pager log -1 --format=%B origin/$b
  if($msg -match 'Entire-Checkpoint:'){ ($msg | Select-String 'Entire-Checkpoint:').Line } else { 'NO_TRAILER' }
  ''
}
```

Any branch printing `NO_TRAILER` is not currently linked at HEAD and will be missing from `entire activity`.

**2. Recover a branch**

```powershell
Set-Location <layer-worktree>
make entire-link-apply-unsafe SESSION_ID=<runtime-session-id>
make entire-stack-finalize
git push origin <branch> --force-with-lease   # if not already pushed by helper flow
```

> [!WARNING]
> Any commit after attach/finalize can invalidate branch-head traceability. Re-run the mandatory protocol before merge.

**3. Reliable finalization protocol for stacked sessions**

1. Keep lower layers stable while reviewing upper layers.
2. Do all development and rebases first.
3. When a layer is finalised, run the **mandatory helper protocol** (`entire-observe` -> `entire-link-dry` -> `entire-link-apply`/`entire-link-apply-unsafe` -> `entire-stack-finalize`) as the **last step**.
4. If you commit again on that layer, re-run the mandatory helper protocol.
5. Before merge, run a final bottom→top mandatory helper pass across all open stack branches, then make no further commits.

Persistent under-count in `entire activity` after syncing usually means one or more branch heads have `NO_TRAILER`.

**Prerequisite — `commit_linking: always`:** `.entire/settings.json` must contain `"commit_linking": "always"`. Without it, the interactive linking prompt is silently declined in non-interactive agent subprocess commits. This is already set in the repo; if Entire is re-initialized, restore this setting before making any commits. Note: this setting only helps when the session is genuinely active (live `sessionStart`). In Copilot App nested sessions, session state can still resolve to `ended`; use the mandatory helper protocol with explicit runtime `SESSION_ID` recovery mode when needed.

## Boundaries

- ✅ Always: route every task through the matching orchestrator skill before touching the CLI directly.
- ✅ Always: all changes go through PRs — never commit directly to `main`.
- ✅ Always: treat `PRODUCT.md`, `ARCHITECTURE.md`, and `code-apps/DESIGN.md` as the source of truth for scope/design decisions; propose and get approval before editing them (see [Foundational documents](#foundational-documents)).
- ✅ Always: work inside unpacked `solutions/<name>/` folders; never hand-edit packed `.zip` files or `customizations.xml`.
- ✅ Always: run `make app-gate` before deploying a code app; use `make solution-gate` before any solution import.
- ⚠️ Ask first: anything that affects a shared or production environment (imports, flow enables, connection changes, adding connectors).
- ⚠️ Ask first: renaming a solution component's `SchemaName` or editing `.github/workflows/` pipeline YAML.
- 🚫 Never: commit secrets, real connection reference IDs, or environment-specific IDs.
- 🚫 Never: hand-edit generated files (`src/generated/`) or author Copilot Studio YAML outside the `agent-implementation` skill.

## Progressive-disclosure pointers

- Read `docs/tech-stack-readiness.md` before setting up the toolchain or validating installed versions.
- Read the [Foundational documents](#foundational-documents) table above before any product, schema, flow, agent, or UI design decision.
