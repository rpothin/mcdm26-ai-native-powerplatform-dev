# Poutine League — Employee App — Memory Bank

## Project

- Path: `code-apps/employee-app/`
- App name: Poutine League - Employee
- Environment: `raphaelpothin-sandbox` (`36f603f9-0af2-e33d-98a5-64b02c1bac19`)
- Solution: `poutineleaguecore` (`c08f9f79-2c95-f111-b8dc-000d3a340fc1`)
- App URL: not yet available — baseline/final deploy (`pac code push`) is blocked; see
  "Known blocker" below.
- Tooling note: this project uses the **PAC CLI's `pac code` command group**
  (`pac code init`, `pac code add-data-source`, `pac code push`), not the
  `pa`/`power-apps` npm CLI assumed by the `create-code-app` skill's default
  instructions — that shim package isn't present in this template version.

## Completed steps (Phase 0 — scaffold, data wiring, nav shell)

- [x] Employee security role created, privileged (29 privileges, correct
      `PrivilegeDepth`), added as a solution component, and assigned to
      `raphael@rpothinmvp.onmicrosoft.com`.
- [x] App scaffolded from `microsoft/PowerAppsCodeApps/templates/vite` via `npx degit`.
- [x] `pac code init` — `power.config.json` created with correct `environmentId`.
- [x] All 11 Dataverse tables wired as data sources via `pac code add-data-source`:
      Restaurant (`rpo_restaurant`), Tag (`rpo_tag`), PoutineSubmission
      (`rpo_poutinesubmission`), Try (`rpo_try`), Review (`rpo_review`), Season
      (`rpo_season`), Category (`rpo_category`), SeasonResult (`rpo_seasonresult`),
      SeasonResultEntry (`rpo_seasonresultentry`), HallOfFameEntry
      (`rpo_halloffameentry`), SystemUser (`systemuser`). All generated into a single
      `src/generated/services/MicrosoftDataverseService.ts` +
      `src/generated/models/MicrosoftDataverseModel.ts` (one Dataverse connector,
      table-parameterized calls — not one file per table).
- [x] Design tokens (`src/styles/tokens.css`) transcribed from `code-apps/DESIGN.md`
      front matter (colors, typography, radii, spacing, sticker shadows).
- [x] Nav shell built: responsive `NavShell` component — fry-gold sidebar on
      desktop (≥1024px), bottom tab bar on mobile — 5 entries: Submit, Browse, Map,
      Leaderboards, and a disabled "Coming soon" Chat placeholder (reserved for the
      embedded conversational agent, wired in a later phase via `agent-implementation`).
- [x] 5 placeholder screens (`src/screens/*.tsx`) using a shared `EmptyState`
      component — each names its build phase.
- [x] Impeccable design hook enabled (`hook-admin.mjs on`); one shared ignore-value
      recorded for `overused-font=inter` (Inter is DESIGN.md's mandated body font,
      not an accidental AI default — confirmed intentional, not suppressed inline).
- [x] Fixed a pre-existing repo `Makefile` bug: `CODE_APPS`/`SOLUTIONS` discovery
      picked up dotdirs (e.g. `code-apps/.impeccable`) as fake "apps" and broke
      `make app-gate` — now excludes `.*` entries.
- [x] Added a placeholder `"test"` npm script (no test framework — nothing to test
      yet in a nav shell) so `make app-gate` (lint + test) passes cleanly.
- [x] `npm run build` and `make app-gate` both pass.

## Known blocker

`pac code push` (baseline and final deploy) fails with HTTP 403
`CodeAppOperationNotAllowedInEnvironment`. Root cause: the "Power Apps code apps"
feature is disabled on the `raphaelpothin-sandbox` environment. This is an
**environment-admin-only UI toggle** (Power Platform Admin Center → Environments →
select env → Settings → Product → Features → "Power Apps code apps" → Enable →
Save) — no CLI/API path was found. Local scaffolding, data-source wiring, and
`npm run build`/`npm run dev` all work regardless; only the live/deployed app URL
is blocked until an environment admin flips this toggle.

## Data sources

Dataverse (`shared_commondataserviceforapps`, connection
`e28f2133a6564731929df4cbebe0128c`): all 11 tables listed above.

## Components / screens

- `src/components/NavShell/NavShell.tsx` — responsive app shell (sidebar + bottom bar).
- `src/components/EmptyState/EmptyState.tsx` — shared placeholder card.
- `src/components/RestaurantPicker/`, `src/components/TagMultiSelect/`,
  `src/components/StatusBadge/`, `src/components/SubmissionForm/`,
  `src/components/MySubmissionsList/` — Phase 1 "Submit a poutine" components.
- `src/lib/dataverseClient.ts` — generic Dataverse access wrapper (Phase 1).
- `src/data/{constants,currentUser,restaurants,tags,submissions}.ts` — Phase 1
  domain/business logic.
- `src/screens/SubmitScreen.tsx` — real Phase 1 implementation (was a placeholder
  in Phase 0). `src/screens/{Browse,Map,Leaderboards,Chat}Screen.tsx` — still
  Phase 0 placeholders, built in later phases.
- `src/App.tsx` — `HashRouter` + route table (HashRouter used because the Power
  Apps player does not support arbitrary server-side deep-link routing).

## Completed steps (Phase 1 — Submit a poutine)

Built on branch `rpothin-redesigned-garbanzo`, stacked on the Phase 0 branch
(`rpothin-literate-disco`, PR #26).

- [x] `src/lib/dataverseClient.ts` — a thin, generic wrapper around the generated
      `MicrosoftDataverseService` (list/get/create/update/delete row, associate/
      disassociate N:N, base64 file upload). All domain modules go through this;
      nothing hand-edits `src/generated/` or calls `fetch`/`axios` directly.
- [x] `src/data/{constants,currentUser,restaurants,tags,submissions}.ts` — the
      domain/business layer: entity-set names, the `SubmissionStatus` enum, current
      SystemUser resolution (by Azure AD object ID, falling back to email),
      restaurant search-or-create, tag listing, and full submission CRUD including
      tag-diffing on update.
- [x] Create-submission form (`SubmissionForm`) — restaurant lookup-or-create
      (`RestaurantPicker`, debounced search), poutine name/description/price, optional
      photo upload, multi-select tags (`TagMultiSelect`) against the seeded Tag
      table, Save Draft / Submit actions.
- [x] **5-active-submission cap** enforced client-side: counts the signed-in
      employee's submissions in any status *except* Rejected (Draft, Submitted, In
      Review, Approved all count against the cap; Rejected frees a slot). Checked
      both to gate/disable the "new submission" UI and again immediately before the
      create call (race-condition guard).
- [x] "My submissions" view (`MySubmissionsList` + `StatusBadge`) — lists all of the
      employee's own submissions with a status chip color-mapped per DESIGN.md
      (Draft=checker-light, Submitted=fry-gold, In Review=mustard-amber,
      Approved=relish-green, Rejected=ketchup-red). Edit/Withdraw actions are shown
      **only** for Draft-status submissions; everything else is read-only once it
      has left the employee's hands.
- [x] `SubmitScreen.tsx` rewritten from the Phase 0 `EmptyState` placeholder into a
      real tabbed "New submission" / "My submissions" experience with an inline edit
      view, reusing `NavShell` and the existing design tokens (`styles/tokens.css`,
      new shared `styles/forms.css` primitives).
- [x] No AI moderation/review-agent integration — submissions are created directly,
      per this phase's explicit scope.
- [x] `npm run lint`, `npm run build` (`tsc -b && vite build`), and `make app-gate`
      all pass.
- [x] Impeccable's mechanical detector (`detect.mjs`) run once against all new
      Phase 1 UI files — zero findings.

### Autonomous decisions made this phase (no live user available, autopilot mode)

- **Active-cap definition**: Draft/Submitted/In Review/Approved count against the
  cap of 5; Rejected does not (a rejected submission frees up a slot for a new
  attempt). No explicit product spec covered this edge case, so the more
  conservative (cap-inclusive) reading was chosen for every non-terminal-negative
  status.
- **Edit/Withdraw restricted to Draft only**: once a submission is Submitted (or
  later), the employee can view it but not edit or withdraw it, since it may
  already be in front of a moderator. This wasn't explicitly specified but follows
  naturally from having a review pipeline at all.
- **Withdraw = hard delete**: there is no "Withdrawn" status value in the seeded
  `rpo_status` picklist and adding one is a schema change out of scope for this
  phase, so "withdraw" calls `DeleteRecordWithOrganization` on the Draft record.
  If a future phase wants withdrawn submissions to remain visible/auditable, this
  should become a soft-delete (a new status value) instead.
- **Photo is optional** on create/edit, with a form hint that it can be added
  later — the schema doesn't mark `rpo_photo` as required and blocking submission
  on a photo felt like unnecessary friction for a v1.
- **Restaurant Latitude/Longitude are left unset** when creating a new restaurant
  from the picker — geocoding an address is out of scope for this phase and is
  expected to be handled by a separate flow/agent in a later phase (see
  `ARCHITECTURE.md`).
- **No automated test suite was added.** The repo template ships an `echo`
  placeholder for `npm test` and no test runner (Vitest, Jest, etc.) is installed
  anywhere in the monorepo yet. Given the "don't add new tooling unless necessary"
  guidance, the cap-counting and tag-diffing logic in `src/data/submissions.ts`
  were validated via `tsc`/ESLint type-checking and manual code review only, not
  via unit tests. The placeholder message was updated to reflect this honestly
  (previously said "no business logic to test," which is no longer true). If a
  test runner is introduced in a later phase, `src/data/submissions.ts` (cap
  counting, active-status set, tag diffing) is the highest-value place to start.
- **No live Dataverse smoke test was possible** — same known `pac code push`
  blocker as Phase 0 (feature flag not yet enabled for this environment). All
  validation this phase was via local build/lint/type-check only.

## Next steps (per the agreed phased plan)

1. Get an environment admin to enable "Power Apps code apps" on
   `raphaelpothin-sandbox`, then run `pac code push` for the first real deploy.
2. Export/unpack the `poutineleaguecore` solution to `solutions/poutineleaguecore/`
   to bring the new Employee role into source control.
3. Open the Phase 0 PR (stacked via `gh-stack`), gated by `make app-gate` (passing).
4. Once the environment blocker clears, do a live smoke test of Phase 1 (create,
   edit, withdraw, cap enforcement) against real Dataverse data.
5. Phase 2 — Browse/List. Phase 3 — Try + Review. Phase 4 — Map. Phase 5 —
   Leaderboards/Hall of Fame (Top Poutine + Best Supporter only for v1).
