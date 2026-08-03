# Entire + Copilot App integration hardening (implementation)

## Objective

Improve reliability and visibility of Entire tracking for Copilot App worktree sessions without changing upstream products (Copilot App, Copilot CLI, Entire internals).

## Implemented components

### 1. Session resolver

File: `scripts/entire-integration/Resolve-CopilotSession.ps1`

What it does:
- Maps current repo/worktree path to Copilot session candidates from `~/.copilot/session-state/*/workspace.yaml`.
- Cross-checks local Entire session store (`.git/entire-sessions/*.json`).
- Produces:
  - classification: `tracked_live`, `tracked_ended`, `untracked_runtime`, `ambiguous`
  - confidence score
  - reason codes
  - candidate details

### 2. Observability harness

File: `scripts/entire-integration/Invoke-EntireObservability.ps1`

What it does:
- Captures a point-in-time snapshot containing:
  - repo state (branch, HEAD SHA, trailer)
  - `entire status/current/list` outputs
  - resolver output
  - local `.git/entire-sessions` inventory
- Writes JSON artifacts to `.git/entire-observability/`.
- Supports stages: `manual`, `pre-commit`, `post-commit`, `pre-push`.

### 3. Guarded experimental linker

File: `scripts/entire-integration/Invoke-EntireExperimentalLink.ps1`

What it does:
- Default behavior is non-destructive dry-run.
- Apply mode (`-Apply`) is explicitly gated:
  - refuses destructive attach in CI
  - requires non-ambiguous high-confidence resolution
  - uses local attach lock (`.git/.../entire-attach-lock`)
  - captures pre/post observability snapshots
- Executes `entire session attach <id> --agent copilot-cli --force` only in apply mode.
- Includes explicit low-confidence bypass (`-AllowLowConfidence`) that is allowed only with an explicit `-SessionId` for controlled experiments.

### 4. Stack finalization helper

File: `scripts/entire-integration/Invoke-EntireStackFinalize.ps1`

What it does:
- Audits branch HEAD trailer presence.
- Recommends attach where trailer missing.
- Default behavior is dry-run.
- Apply mode currently restricts attach action to the current branch.

### 5. Makefile experimental targets

Added targets:
- `make entire-observe`
- `make entire-link-dry`
- `make entire-link-apply`
- `make entire-link-apply-unsafe SESSION_ID=<id>`
- `make entire-stack-finalize`

## Operational workflow (recommended)

1. Run `make entire-observe` before commit.
2. Run normal git commit flow.
3. If trailer/session linkage is questionable, run `make entire-link-dry`.
4. Run `make entire-link-apply` only after reviewing dry-run output.
5. Only for controlled experiments, run `make entire-link-apply-unsafe SESSION_ID=<id>`.
6. Before PR finalization, run `make entire-stack-finalize`.

## Additional operational guardrails (required)

1. Use a **single-writer policy** per branch/worktree during attach operations.
2. Prefer explicit session IDs from `~/.copilot/session-state/<project-session-id>/workspace.yaml` when `entire session current` resolves to an ended or wrong session.
3. Treat any attach operation as history-rewriting (`--force` attach can amend HEAD): verify trailer on HEAD and use `--force-with-lease` for push when needed.
4. Re-run finalization checks after history rewrites (amend/rebase/force-push).

## Behavior discovered during validation

- Overlapping raw attaches can silently replace an existing `Entire-Checkpoint` trailer with another session's checkpoint when both writers target the same branch/worktree.
- In autopilot worktrees, `workspace.yaml` branch metadata may remain at session-creation value after `rename_branch`; resolver fallback by git-root/recency is therefore expected in renamed sessions.
- Rewrite impact is mode-dependent:
  - `git commit --amend --no-edit` preserved trailers in observed runs.
  - other rewrite paths can drop or replace trailers; finalization should be rerun after any rewrite.

## Guardrails and limits

> [!WARNING]
> Experimental targets can amend commits when using apply mode. Use only on feature branches and expect to force-push after attach operations when needed.

> [!NOTE]
> This implementation intentionally avoids writing custom data into Entire internal files. It observes and orchestrates via wrapper scripts and standard CLI commands.

## Rollback

1. Remove `scripts/entire-integration/`.
2. Remove experimental Makefile targets.
3. Keep `.github/hooks/entire.json` untouched (managed by `entire agent add`).
4. Use standard `entire` workflows only.
