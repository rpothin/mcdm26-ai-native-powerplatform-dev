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
- `src/screens/{Submit,Browse,Map,Leaderboards,Chat}Screen.tsx` — placeholders.
- `src/App.tsx` — `HashRouter` + route table (HashRouter used because the Power
  Apps player does not support arbitrary server-side deep-link routing).

## Next steps (per the agreed phased plan)

1. Get an environment admin to enable "Power Apps code apps" on
   `raphaelpothin-sandbox`, then run `pac code push` for the first real deploy.
2. Export/unpack the `poutineleaguecore` solution to `solutions/poutineleaguecore/`
   to bring the new Employee role into source control.
3. Open the Phase 0 PR (stacked via `gh-stack`), gated by `make app-gate` (passing).
4. Phase 1 — Submit a poutine (create-submission form, 5-active-submission cap,
   "my submissions" view).
5. Phase 2 — Browse/List. Phase 3 — Try + Review. Phase 4 — Map. Phase 5 —
   Leaderboards/Hall of Fame (Top Poutine + Best Supporter only for v1).
