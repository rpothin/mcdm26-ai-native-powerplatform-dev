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

Break any non-trivial change into a stack of small, independently-reviewable PRs using `gh-stack`. Each layer is its own nested session and worktree, spawned from a coordinator session. Entire tracks checkpoints automatically via git hooks, but nested session IDs are **not automatically linked** to their checkpoints. After finalising each nested session, run the crosslink step from the matching worktree before merging:

```powershell
# 1. Find the runtime session ID
#    (from ~/.copilot/session-state/<project-session-id>/workspace.yaml or events.jsonl)

# 2. Attach it from inside the nested worktree
Set-Location <path-to-nested-worktree>
entire session attach <runtime-session-id> --agent copilot-cli --force

# 3. Force-push so the trailer reaches the remote
git push origin <branch-name> --force-with-lease
```

> [!TIP]
> The `session-crosslink` skill automates steps 2–3 once you provide the runtime session ID. Invoke it from the coordinator session when the nested session is complete.

> [!NOTE]
> Do not modify `.github/hooks/entire.json` — it is managed by `entire agent add` and overwritten on reinstall.

## Boundaries

- ✅ Always: invoke the matching orchestrator skill before using any CLI directly.
- ✅ Always: work on unpacked solution folders under `solutions/` — never touch packed `.zip` files.
- ✅ Always: keep connection references and environment variable values in `solutions/<name>/deployment-settings.json`.
- ✅ Always: run `make app-gate` before `pac code push` for code apps.
- ✅ Always: leave generated TypeScript under `src/generated/` untouched — connector skills regenerate it.
- ✅ Always: all changes go through PRs — never commit directly to `main`.
- ⚠️ Ask first: adding a premium connector (DLP policy implications).
- ⚠️ Ask first: enabling a flow in production.
- ⚠️ Ask first: importing a solution to a shared or non-dev environment.
- ⚠️ Ask first: renaming a solution component's `SchemaName` — breaks downstream references.
- ⚠️ Ask first: editing pipeline YAML under `.github/workflows/`.
- 🚫 Never: hand-edit a packed solution `.zip` or the `customizations.xml` inside it.
- 🚫 Never: commit real connection reference IDs, environment IDs, or service-principal secrets.
- 🚫 Never: run `pac solution import` against a shared environment from a local machine.
- 🚫 Never: hand-edit anything under `src/generated/` in code apps.
- 🚫 Never: author Copilot Studio YAML without routing through the `agent-implementation` skill.

## Progressive-disclosure pointers

- Read `docs/tech-stack-readiness.md` before setting up the toolchain or validating installed versions.

