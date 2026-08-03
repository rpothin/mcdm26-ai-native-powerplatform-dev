# Entire product feedback — Copilot App + worktree integration

## Initial situation

In this repository’s Copilot App-driven workflow, Entire setup appears correct (enabled settings, Copilot hook config, git hooks), but session tracking can still diverge:
- active Copilot runtime session present in session-state
- corresponding session absent in `.git/entire-sessions`
- `entire session current` resolving to older ended sessions

This creates reliability gaps for commit/session linkage and reviewer visibility.

## What we implemented locally

Without patching upstream tools, we implemented a guarded wrapper layer:
1. Session resolver (`Resolve-CopilotSession.ps1`)
2. Observability harness with JSON evidence (`Invoke-EntireObservability.ps1`)
3. Dry-run-first linker (`Invoke-EntireExperimentalLink.ps1`)
4. Stack finalization helper (`Invoke-EntireStackFinalize.ps1`)
5. Experimental Makefile targets

## What this fixes

Observed improvements:
- Better diagnosis when runtime and Entire local session stores disagree.
- Fewer blind attach attempts through classification + confidence gates.
- Repeatable evidence capture for each decision.
- Better trailer coverage checks before PR finalization.

Concrete proof from current run:
- Resolver identified current runtime session as `untracked_runtime` with explicit reason codes.
- Strict apply mode failed closed on low confidence.
- CI mode blocked destructive attach.
- Controlled explicit attach created checkpoint `050d0169dee9` and amended HEAD trailer.
- Finalizer switched from `attach_recommended` (before) to `none` (after).
- Parent/child and detached worktree probes both resolved to the same ended session (`e710...`) despite distinct branches, reinforcing the cross-worktree session-resolution gap.
- `session adopt` returned expected limitation on ended sessions (`cannot be adopted`).
- Rewrite behavior is path-dependent: one amend path removed trailer (and finalizer flagged `attach_recommended`), while `git commit --amend --no-edit` preserved trailer across hash rewrite.
- Concurrency lock check blocked duplicate apply safely (`Attach lock already held ...`).
- True overlapping raw attach revealed a critical integrity risk: child branch head `d10cabe` had trailer `05c66a9b4453` silently replaced by `050d0169dee9` (different session) with exit code `0` and no warning.
- Independent child-session branch audit reported `NO_TRAILER` on merge head `0008116` and only 2/7 branch heads with trailers, confirming coverage drift outside the coordinator worktree.
- Early in validation, child-session probe could not execute integration scripts from branch-visible state because those script files were local-only in the coordinator worktree at that time.
- Full remote cycle probe (attach -> push -> amend -> force-push) preserved trailer in that path, showing rewrite impact depends on how commit messages are rewritten.
- Child branch remediation validated: using runtime session ID from `workspace.yaml` (`32f13fcf-47fb-4bba-ae64-81ac69d24304`) converted `NO_TRAILER` head `0008116` into trailer-bearing head `3391ae5` (`Entire-Checkpoint: 05c66a9b4453`) and propagated via force-push.
- Independent integration-scripts worktree validation showed resolver fallback behavior under branch-rename drift (`git_root_match`, `BranchMatch: false`), yet attach still stamped and propagated checkpoint `b8232ee3f652` on head `494abf2`.
- Branch-rename drift appears systemic for autopilot worktrees: `workspace.yaml` is written at session creation and not updated after `rename_branch`, making `BranchMatch: false` a common steady-state condition rather than an exceptional mismatch.

## Proof strategy

Proof is collected via:
- `.git/entire-observability/*.json` snapshots
- scenario outcomes in `docs/entire-copilot-integration-test-report.md`

## Remaining gaps

Known limits of wrapper-only approach:
- Cannot guarantee upstream session materialization behavior.
- Confidence heuristics can still require manual intervention.
- Attach semantics (reusing existing checkpoint trailers) remain by design.

## Product-level requests for Entire team

1. Expose stronger first-class diagnostics for “runtime session seen but not tracked locally”.
2. Provide a stable API/command for safe, deterministic session-to-worktree resolution.
3. Provide explicit attach preview/dry-run mode with reason codes.
4. Provide clearer branch/worktree/session state introspection for stacked workflows.
5. Clarify recommended flows for Copilot App parent/child/detached session models.
6. Add attach conflict protection: refuse (or require explicit override) when a commit already has a different `Entire-Checkpoint` trailer than the one being applied.
7. Improve resolver ergonomics for branch-renamed sessions (or expose canonical runtime session mapping that does not depend on stale branch names in `workspace.yaml`).
8. Add branch-rename reconciliation support (e.g., update `workspace.yaml` on rename, or re-resolve branch metadata from current git state before matching).

## Recommended operating stance (until product fixes land)

1. Single-writer attach policy per branch/worktree.
2. Resolve explicit runtime session IDs from `workspace.yaml` when confidence is not high.
3. Run attach/finalization as the last mutation step before push/review.
4. Re-run checks after any rewrite operation.

## Collaboration intent

This effort is intended to provide high-quality reproducible evidence so Entire can prioritize and harden this integration path.
