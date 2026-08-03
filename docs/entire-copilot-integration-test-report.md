# Entire + Copilot App integration hardening test report

## Purpose

Compare out-of-the-box behavior with the hardened experimental workflow and determine whether tracking visibility is improved and more reliable.

## Baseline (out-of-the-box)

Observed baseline issues:
- Current Copilot runtime session may exist in `~/.copilot/session-state` while missing from `.git/entire-sessions`.
- `entire session current --json` may resolve to older ended sessions.
- `entire session attach` can reuse existing checkpoint trailer IDs by design, which can look like missed attribution when expectations are per-commit novelty.

## Hardened workflow under test

Artifacts and commands:
- `make entire-observe`
- `make entire-link-dry`
- `make entire-link-apply`
- `make entire-link-apply-unsafe SESSION_ID=<id>`
- `make entire-stack-finalize`

Evidence source:
- JSON snapshots in `.git/entire-observability/`

## Test matrix

| Scenario | Baseline visibility | Hardened visibility target | Status |
|---|---|---|---|
| Single worktree session (current) | `entire session current` can resolve ended sessions | Resolver classifies `untracked_runtime` and logs confidence/reasons | **Passed** |
| Guarded apply (default) | Blind attach risk | Apply blocked on low confidence | **Passed** |
| CI safety gate | Risk of destructive attach in CI | Apply refused when `CI=1` | **Passed** |
| Controlled workaround attach | Manual one-off attach required | Explicit unsafe mode with session ID performs attach and logs evidence | **Passed** |
| Stack finalization | Missing trailer hard to detect | Finalizer reports `attach_recommended` before attach and `none` after attach | **Passed** |
| Independent verifier run (nested/sub-agent validation) | Single-observer bias | Separate sub-agent confirmed script behavior and trailer state | **Passed** |
| Copilot parent/child session | Worktree session may not resolve to distinct current session | Captured `entire session current`/`status` per child worktree and recorded mismatch | **Passed (issue reproduced)** |
| Detached child session | Manual diagnosis required | Captured `entire session current`/`status` per detached worktree and recorded mismatch | **Passed (issue reproduced)** |
| Rebase/force-push after attach (rewrite proxy) | Trailer drift risk | After history rewrite (`--amend`), finalizer returns `attach_recommended` | **Passed** |
| Full remote push + force-push cycle | Remote rewrite may break lineage | Attach/push/amend/force-push flow executed and trailer presence re-checked | **Passed (trailer preserved in this run)** |
| Child branch trailer recovery (runtime session ID) | Branch head can remain `NO_TRAILER` | Using session ID from `workspace.yaml` attaches and amends HEAD, then force-push propagates trailer | **Passed** |
| `session adopt` path | Case-specific | Attempted adopt; documented behavior for ended session | **Passed (not applicable to ended session)** |
| Concurrent sessions/worktrees (lock contention) | High ambiguity risk | Lock contention blocks second apply attempt safely | **Passed** |
| Concurrent sessions/worktrees (true overlap, raw attach) | Cross-session mutation risk | Simultaneous attach attempts should avoid silent checkpoint replacement on unrelated branch heads | **Passed (critical issue reproduced)** |

## Metrics

Measured from current run:
- **Observability snapshots captured:** 9 valid JSON snapshots
- **Resolver distribution:** 6 `untracked_runtime`, 3 `tracked_ended`
- **Confidence values observed:** 0.75 (`untracked_runtime`), 0.85 (`tracked_ended`)
- **Guarded apply (strict mode):** blocked as expected on low confidence
- **CI destructive-attach gate:** blocked as expected
- **Unsafe controlled apply:** succeeded once with explicit session ID
- **Trailer coverage (current branch):** `false -> true` after controlled attach
- **Concurrency safety check:** attach refused when lock exists
- **Adopt check (ended session):** `session ... is ended ... cannot be adopted`
- **Child/detached worktree check:** both worktrees resolved to the same ended session (`e710...`) despite distinct branches
- **Independent child-session branch audit:** current HEAD `0008116` (Merge PR #7) had `NO_TRAILER`; branch matrix showed 2/7 heads with trailer coverage
- **Remote cycle probe:** attach + push + amend + force-push retained `Entire-Checkpoint: 050d0169dee9` in that run
- **Child branch recovery:** `0008116 (NO_TRAILER) -> 3391ae5 (Entire-Checkpoint: 05c66a9b4453)` via `workspace.yaml` runtime session ID + force-push
- **True overlap probe:** child branch `d10cabe` trailer was silently replaced from `05c66a9b4453` to `050d0169dee9` by concurrent raw attach from another session
- **Integration-scripts worktree probe:** resolver classified `git_root_match` at medium confidence with `BranchMatch: false` after branch rename drift in `workspace.yaml`; attach+force-push still stamped trailer (`b8232ee3f652`) on remote head

## Evidence highlights

1. Resolver before attach reported:
   - classification `untracked_runtime`
   - confidence `0.75`
   - reason code `workspace_match_untracked`
2. Strict apply mode failed closed:
   - `Resolver confidence too low for apply mode ...`
3. CI gate worked:
   - `Refusing to run destructive attach in CI.`
4. Controlled unsafe apply succeeded:
   - `Attached session e710c918-a4a5-421a-aa78-abeb92a5e1e3`
   - `Created checkpoint 050d0169dee9`
   - commit amended with `Entire-Checkpoint: 050d0169dee9`
5. Finalizer after attach:
   - current branch shows `has_trailer: true`, `action: none`
6. Parent/child + detached worktree probes:
   - child branch `rpothin-rpothin-entire-child-scenario` returned `session_id: e710...`, `status: ended`
   - detached branch `rpothin-rpothin-entire-integration-scripts` returned `session_id: e710...`, `status: ended`
7. Adopt scenario:
   - `session 66d4... is ended or fully condensed and cannot be adopted`
8. Concurrency lock scenario:
   - `Attach lock already held ... entire-attach-lock`
9. Rewrite drift proxy:
   - trailer present immediately after attach
   - trailer removed after `git commit --amend`
   - finalizer switched to `attach_recommended`
10. Independent child-session report:
   - `scripts/entire-integration/` not found from branch-visible state (because integration files are local/uncommitted in coordinator worktree)
   - current branch head `0008116` reported `NO_TRAILER`
11. Full remote cycle probe:
   - disposable branch `rpothin-entire-remote-cycle-probe-20260803`
   - normal push succeeded, then `git commit --amend --no-edit` + force-push succeeded
   - trailer remained present after amend and force-push in that commit path
12. Child branch trailer recovery:
   - branch `rpothin-rpothin-entire-child-scenario` started at `0008116` with `NO_TRAILER`
   - attach using session `32f13fcf-47fb-4bba-ae64-81ac69d24304` created checkpoint `05c66a9b4453`
   - HEAD amended to `3391ae5` with trailer `Entire-Checkpoint: 05c66a9b4453`
   - force-push propagated trailer to remote branch
13. Child branch validation rerun:
   - started from `3391ae5` with trailer already present (`Entire-Checkpoint: 05c66a9b4453`)
   - re-attach was a no-op (`Commit ... already has Entire-Checkpoint ...`)
   - `git commit --amend --no-edit` changed hash (`3391ae5 -> d10cabe`) while preserving trailer
   - force-push propagated amended trailer-bearing commit
14. True overlapping attach probe:
   - child session ran attach at `2026-08-03T18:37:38.916Z -> 18:37:48.854Z` while coordinator ran overlapping attach window
   - operation exited `0` and amended child branch head `d10cabe`
   - existing trailer `Entire-Checkpoint: 05c66a9b4453` was silently replaced by `Entire-Checkpoint: 050d0169dee9`
   - no warning or conflict surfaced
15. Independent integration-scripts worktree validation:
   - branch `rpothin-rpothin-entire-integration-scripts`
   - resolver returned `git_root_match` (medium confidence), with `BranchMatch: false` because `workspace.yaml` still referenced pre-rename branch `rpothin-reimagined-guacamole`
   - `entire session attach 3adfd761... --force` created checkpoint `b8232ee3f652`
   - head `494abf2` was stamped and `git push --force-with-lease` propagated trailer to remote
   - observed as systemic in autopilot worktrees: `workspace.yaml` branch value is creation-time and is not updated by `rename_branch`, so `BranchMatch: false` is expected after branch rename
16. Post-overlap no-op stabilization probe:
   - rerun attach on already-stamped child head `79c48a3`
   - output reported `Commit 79c48a3 already has Entire-Checkpoint: 050d0169dee9`
   - exit `0`, no additional mutation, confirming idempotence once trailer/session already match

## Evidence artifacts

Primary observability files under `.git/entire-observability/`:
- `20260803-100645-326-pre-commit-3ff0bb6a.json`
- `20260803-100703-540-pre-commit-1ddaac27.json`
- `20260803-100713-358-post-commit-05495031.json`
- `20260803-100756-649-manual-cafdc819.json`
- `20260803-143133-661-pre-commit-d6774de9.json`
- `20260803-143133-874-post-commit-57f6efd6.json`

Latest commit trailer after controlled attach:
- `Entire-Checkpoint: 050d0169dee9`

## Conclusion (current phase)

For this repository context, the hardened workflow is already **more reliable than out-of-the-box integration for visibility and operator safety**:
- Better visibility: deterministic session classification + persistent evidence snapshots
- Better safety: fail-closed default apply + CI refusal
- Better recovery: controlled explicit attach with auditable outcome

All planned deep-dive scenarios for this phase were executed. The highest-severity open gap is silent trailer replacement during overlapping raw attach operations.

> [!TIP]
> Keep raw evidence immutable: append results rather than rewriting prior observations.

> [!NOTE]
> Activity/portal summary pages can show one checkpoint per listed session even when session detail views expose multiple checkpoints/turns. Treat activity as a contribution summary view; validate lineage with commit trailers and session detail when precision is needed.
