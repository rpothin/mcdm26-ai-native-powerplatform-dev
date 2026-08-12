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

**Re-confirmed with a second, independent CLI** (post-Phase 4, during the
push/export follow-up): the newer GA `@microsoft/power-apps-cli` (`pa`/`power-apps`
binaries, distinct from the PAC CLI's preview `pac code` command group) hits the
**exact same** `CodeAppOperationNotAllowedInEnvironment` 403 on `pa app push
--solution-id c08f9f79-2c95-f111-b8dc-000d3a340fc1 --non-interactive`, after a
successful, correctly-scoped sign-in (`pa auth login`, confirmed as
`raphael@rpothinmvp.onmicrosoft.com`, matching the active `pac auth list` profile
and the environment ID in `power.config.json`). This proves the block is a
**server-side environment feature gate**, not a CLI/tooling choice or an auth
problem — switching CLIs cannot work around it. Direct link for an environment
admin to flip the toggle:
`https://admin.powerplatform.microsoft.com/environments/environment/36f603f9-0af2-e33d-98a5-64b02c1bac19/settings/product/features`
→ enable "Power Apps code apps" → Save.

## Data sources

Dataverse (`shared_commondataserviceforapps`, connection
`e28f2133a6564731929df4cbebe0128c`): all 11 tables listed above.

## Components / screens

- `src/components/NavShell/NavShell.tsx` — responsive app shell (sidebar + bottom bar).
- `src/components/EmptyState/EmptyState.tsx` — shared placeholder card.
- `src/components/RestaurantPicker/`, `src/components/TagMultiSelect/`,
  `src/components/StatusBadge/`, `src/components/SubmissionForm/`,
  `src/components/MySubmissionsList/` — Phase 1 "Submit a poutine" components.
- `src/components/PoutineCard/`, `src/components/BrowseFilters/`,
  `src/components/SubmissionDetail/` — Phase 2 "Browse/List" components.
  `SubmissionDetail` gained the Phase 3 Try/Review creation UI (still the same
  component/file — no new component was introduced for this phase). Phase 4's
  Map view reuses `SubmissionDetail` unmodified for its "View details" flow.
- `src/lib/dataverseClient.ts` — generic Dataverse access wrapper (Phase 1).
- `src/data/{constants,currentUser,restaurants,tags,submissions}.ts` — Phase 1
  domain/business logic. `src/data/{tries,reviews,feedback}.ts` — Phase 2 read-only
  Try/Review/aggregate logic, extended in Phase 3 with `createTry`/
  `getTryForEmployee`, `createReview`/`getReviewForTryAndReviewer`, and
  `aggregateFromFeedback`. `src/data/restaurants.ts` extended in Phase 4 with
  geocoded `rpo_latitude`/`rpo_longitude` fields and
  `listAllRestaurantsWithCoordinates()`. `src/data/mapPins.ts` (new, Phase 4) —
  groups approved submissions by restaurant and splits geocoded vs. ungeocoded.
- `src/screens/SubmitScreen.tsx` — real Phase 1 implementation.
  `src/screens/BrowseScreen.tsx` — real Phase 2 implementation (was a placeholder
  through Phase 1; extended in Phase 3 with an `onAggregateChange` handler).
  `src/screens/MapScreen.tsx` — real Phase 4 implementation (Leaflet map, was a
  placeholder through Phase 3). `src/screens/{Leaderboards,Chat}Screen.tsx` —
  still Phase 0 placeholders, built in later phases.
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

## Completed steps (Phase 2 — Browse/List discovery view)

Built on branch `rpothin-employee-app-browse-discovery`, stacked on the Phase 1
branch (`rpothin-redesigned-garbanzo`, PR #27).

- [x] `src/data/tries.ts` (new) — read-only `TryRow` + `listTriesForSubmissions()`,
      filtered by `_rpo_poutinesubmissionid_value` (an OR-joined `eq` filter over the
      given submission ids, following the same "IN via OR" pattern established in
      Phase 1 for the active-status filter).
- [x] `src/data/reviews.ts` (new) — read-only `ReviewRow` + `listReviewsForTries()`,
      filtered by `_rpo_tryid_value`. **Schema note**: Review has no direct lookup to
      PoutineSubmission — it only links to Try (`rpo_tryid`), which in turn links to
      PoutineSubmission. Reviews are therefore always resolved via
      "submission → its Tries → those Tries' Reviews", never a single filter.
- [x] `src/data/feedback.ts` (new) — aggregation layer over Try+Review:
      `getAggregatesForSubmissions()` (try count / review count / average star rating
      per submission, computed client-side from just two Dataverse round-trips
      regardless of submission count — all Tries for the set, then all Reviews for
      those Tries) and `getFeedbackForSubmission()` (full Try/Review lists for the
      detail view).
- [x] `src/data/submissions.ts` extended: `photoDataUrl` field on
      `PoutineSubmissionRow`, a `SUBMISSION_SELECT_WITH_PHOTO` select list (adds
      `rpo_photo`), `listApprovedSubmissions()` (the public Browse feed query), and
      `getSubmissionWithPhoto()` (detail-view fetch). The original `SUBMISSION_SELECT`/
      `getSubmission()` are untouched so Phase 1's My Submissions view isn't forced to
      pay for photo payload it doesn't render.
- [x] `src/components/PoutineCard/` (new) — Browse feed list item: photo (or a 🍟
      placeholder), poutine name, restaurant name, price, tag chips, and an
      aggregate line ("Not tried yet" / "N tries · no reviews yet" /
      "★ X.X (N reviews) · N tries").
- [x] `src/components/BrowseFilters/` (new) — search box (poutine/restaurant name)
      + tag chip filter, reusing Phase 1's `TagMultiSelect` component unmodified as
      the filter control.
- [x] `src/components/SubmissionDetail/` (new) — read-only detail view: photo, name,
      restaurant name/address, price, tags, description, and full Tries/Reviews
      lists (star rating, reviewer name, date, comment). A "← Back to Browse"
      button returns to the list. Try/Review *creation* is explicitly out of scope
      (Phase 3) — this view only displays existing data.
- [x] `src/screens/BrowseScreen.tsx` rewritten from the Phase 0 `EmptyState`
      placeholder: loads `listApprovedSubmissions()` + `listTags()` +
      `getAggregatesForSubmissions()` on mount, applies search/tag filtering
      client-side, renders `BrowseFilters` + a grid of `PoutineCard`s, and toggles to
      `SubmissionDetail` via local `view` state (no new router routes — same pattern
      `SubmitScreen.tsx` already uses for its tabs/edit view).
- [x] No map integration this phase (Map is Phase 4, a separate screen).
- [x] `npm run lint`, `npm run build` (`tsc -b && vite build`), and `make app-gate`
      all pass. Impeccable's design hook found no issues on any new file.
- [x] **Post-merge live-testing fix** (after rebasing onto Phase 1's
      `9a2b0e8`): applied the same two fixes Phase 1 needed to `tries.ts` and
      `reviews.ts` — `TRY_SELECT`/`REVIEW_SELECT` used plain schema names for
      lookup columns (`rpo_poutinesubmissionid`, `rpo_employeeid`, `rpo_tryid`,
      `rpo_reviewerid`), which Dataverse rejects at runtime with "Could not
      find a property named ...". Changed to the `_value`-suffixed logical
      names (`_rpo_poutinesubmissionid_value`, etc.), matching what
      `toTryRow()`/`toReviewRow()` already read. Also removed the "Phase 2"
      eyebrow label from `BrowseScreen.tsx` (and its now-unused
      `.browse-screen__eyebrow` CSS rule) — build-phase labels are an internal
      sequencing concept only and shouldn't leak into the product UI.

### Autonomous decisions made this phase (no live user available, autopilot mode)

- **"Approved" is the only publicly-visible status.** The Browse feed queries
  `rpo_status eq Approved` only — Draft/Submitted/In Review are still in the
  submitter's/moderator's workflow and Rejected never becomes public. This mirrors
  the status-lifecycle reasoning already recorded in Phase 1.
- **Tag filtering uses OR logic** (a submission matches if it has *any* of the
  selected tags), not AND (must have *all* selected tags). This is the more common
  "browse by tag" UX pattern for a discovery feed; AND-logic was considered and
  rejected as unexpectedly restrictive (e.g. selecting "Spicy" and "Vegetarian"
  would hide poutines that are one or the other but not both).
- **Filtering happens entirely client-side**, after a single fetch of all Approved
  submissions (tags and photo already expanded/selected). At this app's demo scale,
  this is far simpler and more robust than server-side OData filtering across an
  N:N tag relationship or a joined restaurant-name search, both of which the
  connector doesn't support cleanly via `$filter`.
- **Photo strategy: thumbnail-only, no full-size download.** Dataverse image
  columns return a base64 thumbnail directly on a normal `$select` retrieve; a
  separate `?size=full` download action exists but needs a `Range` header and can
  fail if `CanStoreFullImage` was false at upload time. Given the demo scale and to
  avoid that extra error-handling surface, both the Browse card and the detail view
  render only the inline thumbnail.
- **No new router routes.** Following `SubmitScreen.tsx`'s existing precedent, the
  list ↔ detail toggle uses local component state (`view: "list" | "detail"` +
  `selectedSubmissionId`) inside `BrowseScreen.tsx` rather than adding
  `HashRouter` routes like `/browse/:id` — keeps the pattern consistent with the
  rest of the codebase.
- **Rating aggregation is a simple unweighted mean** of `rpo_starrating` across all
  Reviews for a submission (via its Tries), not a Bayesian/weighted average or one
  that considers `rpo_helpfulnessscore`. Simpler and adequate for a v1 discovery
  feed; a smarter ranking algorithm can be layered on later if needed (e.g. for
  Leaderboards in Phase 5, which may want a different formula).
- **No automated test suite added**, consistent with Phase 1 — the repo still has
  no test runner installed. The new Try/Review/aggregate logic in `src/data/` was
  validated via `tsc`/ESLint type-checking, `npm run build`, and manual code review
  only.
- **No live Dataverse smoke test was possible** — same known `pac code push`
  blocker as Phases 0–1 (feature flag not yet enabled for this environment). All
  validation this phase was via local build/lint/type-check only.

## Completed steps (Phase 3 — Try + Review flow)

Built on branch `rpothin-improved-enigma`, stacked on the Phase 2 branch
(`rpothin-employee-app-browse-discovery`, PR #28).

- [x] `src/data/tries.ts` extended: `getTryForEmployee(submissionId, employeeId)`
      (existing-Try lookup) and `createTry({ submissionId, employeeId })` (creates a
      `rpo_try` row via `rpo_poutinesubmissionid@odata.bind` +
      `rpo_employeeid@odata.bind` + `rpo_triedon = new Date().toISOString()`).
- [x] `src/data/reviews.ts` extended: `getReviewForTryAndReviewer(tryId, reviewerId)`
      (existing-Review lookup) and `createReview({ tryId, reviewerId, starRating,
      comment })` (creates a `rpo_review` row via `rpo_tryid@odata.bind` +
      `rpo_reviewerid@odata.bind`; validates `starRating` is an integer 1–5 client-side,
      matching the schema-required `rpo_starrating` field; `comment` is optional,
      matching the schema).
- [x] `src/data/feedback.ts` extended: `aggregateFromFeedback(feedback)` — derives the
      same `{ tryCount, reviewCount, averageRating }` shape as
      `getAggregatesForSubmissions`, but from an already-fetched
      `SubmissionFeedback` for one submission (no extra round-trip). Used to refresh
      the aggregate immediately after a Try/Review is created.
- [x] `src/components/SubmissionDetail/SubmissionDetail.tsx` extended with the write
      flow: resolves the signed-in employee (`getCurrentUser`) alongside the existing
      submission/restaurant/feedback fetch; derives `myTry`/`myReview` from the
      already-fetched `feedback` (no extra queries) by matching
      `employeeId`/`reviewerId` against the current user; renders:
      - an **"I've tried this!"** button when the employee has no Try yet;
      - a **"Tried on {date}"** badge + **"Leave a review"** button once they have a
        Try but no Review;
      - a **"You reviewed this ★★★★★"** badge once they have both;
      - an inline star-rating (1–5 buttons) + optional comment textarea form for
        submitting the review.
      After a successful create, it re-fetches this submission's feedback
      (`getFeedbackForSubmission`) and calls the new `onAggregateChange` prop with the
      recomputed aggregate.
- [x] `src/screens/BrowseScreen.tsx`: passes a new `onAggregateChange` handler to
      `SubmissionDetail` that patches just the changed submission's entry in the
      existing `aggregates` Map (via `setAggregates` + a new `Map` copy) — so
      navigating back to the list shows the updated try count / average rating on
      that poutine's `PoutineCard` without refetching every submission or reloading
      the screen.
- [x] `src/components/StatusBadge/StatusBadge.css`: added a `.status-badge--tried`
      modifier (reusing the existing pill/tokens pattern) for the "Tried" / "You
      reviewed this" indicators in `SubmissionDetail` — `StatusBadge.tsx` itself stays
      submission-status-specific, so the CSS class is applied directly rather than
      through the typed component.
- [x] `npm run lint`, `npm run build` (`tsc -b && vite build`), and `make app-gate`
      all pass. Impeccable's design hook found no issues on any changed file.

### Autonomous decisions made this phase (no live user available, autopilot mode)

- **One Try per employee per submission (app-enforced, idempotent "log a try").**
  The `rpo_Try` schema has no alternate key/unique constraint preventing an
  employee from trying the same poutine multiple times, and PRODUCT.md doesn't
  explicitly rule on it. However, "Best Seller" (the employee whose poutine got
  the most colleagues to try it) and "Top Poutine" try/review counts would be
  gameable if one employee could inflate the count by repeatedly "trying" the
  same poutine. `getTryForEmployee` is checked before `createTry` (both to gate
  the UI — showing "Tried on {date}" instead of the button once one exists —
  and again immediately before the create call as a race guard), so a second
  "I've tried this!" click reuses the existing Try instead of creating a
  duplicate. Documented here per the task's request to record this kind of
  ambiguous-rule call.
- **One Review per employee per Try (== per submission, given the above).**
  PRODUCT.md doesn't explicitly forbid multiple reviews from the same employee
  on the same poutine, but "a review consists of a star rating plus a comment"
  reads as a single verdict per person, and the ERD's `TRY ||--o| REVIEW`
  cardinality (zero-or-one Review per Try) supports one review per Try.
  Combined with the one-Try-per-employee decision above, checking
  `getReviewForTryAndReviewer(tryId, reviewerId)` before `createReview` is
  therefore equivalent to "one review per employee per poutine" and avoids a
  second round-trip to re-resolve the submission id from the Try. Enforced the
  same way as the Try dedup: gates the UI (no "Leave a review" button/form once
  a review exists — replaced by a "You reviewed this ★★★★★" badge) and is
  re-checked immediately before the create call.
- **Inline form, not a modal.** "Log a try" is a single button (no form needed —
  a Try has no employee-entered fields beyond the timestamp, which is set
  server-side-equivalent via `new Date().toISOString()`). "Leave a review"
  reveals an inline form within `SubmissionDetail` (star picker + optional
  comment + Submit/Cancel), toggled by local `showReviewForm` state — the same
  "local component state, no new router route" pattern `SubmitScreen.tsx` and
  `BrowseScreen.tsx` already use for their list/detail and tab toggles. No modal
  component exists anywhere in the codebase yet, and introducing one (with its
  own overlay/focus-trap/dismiss semantics) for a single small form felt like
  unnecessary new UI infrastructure for this phase's scope.
- **Refetch-after-create, not optimistic update, for both the detail view's
  Tries/Reviews lists and the propagated aggregate.** After a successful
  `createTry`/`createReview`, the component calls `getFeedbackForSubmission`
  again rather than hand-splicing the new row into local state. This guarantees
  the freshly created Try/Review displays with the same fully-annotated shape
  (formatted lookup display names, `createdon`, etc.) as everything else in the
  list, at the cost of one extra network round-trip per action — an acceptable
  trade at this app's demo scale, and consistent with Phase 1/2's general bias
  toward straightforward correctness over premature optimization.
- **Aggregate propagation via a new `onAggregateChange` callback prop**, not a
  full Browse-feed reload. `BrowseScreen` already holds an `aggregates: Map`
  keyed by submission id; `SubmissionDetail` now reports just the one
  submission's recomputed aggregate back up after a change, and `BrowseScreen`
  patches that one Map entry. This satisfies "update the aggregate display
  without a full page reload" without re-fetching *all* approved submissions'
  Tries/Reviews (which `getAggregatesForSubmissions` would require) just because
  one poutine changed.
- **Star rating input is 1–5 clickable star buttons** (not a numeric input or
  slider), matching the ★ rendering already used for existing reviews and
  `PoutineCard`'s aggregate line — keeps the "look" of a rating consistent
  whether it's being read or written.
- **`status-badge--tried` reuses `StatusBadge`'s CSS pattern, not the
  component.** `StatusBadge.tsx` is typed specifically around
  `SubmissionStatusValue` or `SUBMISSION_STATUS_LABELS`; Try/Review states
  aren't submission statuses, so a new modifier class was added to the shared
  `StatusBadge.css` (imported directly into `SubmissionDetail.tsx`) instead of
  extending the component's prop type with an unrelated concept.
- **No automated test suite added**, consistent with Phases 1–2 — the repo
  still has no test runner installed. The new Try/Review create/dedup logic in
  `src/data/tries.ts` and `src/data/reviews.ts` was validated via
  `tsc`/ESLint type-checking, `npm run build`, and manual code review only.
- **No live Dataverse smoke test was possible** — same known `pac code push`
  blocker as Phases 0–2 (feature flag not yet enabled for this environment).
  All validation this phase was via local build/lint/type-check only; the
  create/dedup logic (odata.bind lookup targets, required-field validation)
  was cross-checked directly against `solutions/poutineleaguecore/Entities/
  rpo_Try/Entity.xml` and `.../rpo_Review/Entity.xml` for exact field logical
  names, types, and `RequiredLevel`.

## Completed steps (Phase 4 — Map view)

Built on branch `rpothin-employee-app-map-view`, stacked on the Phase 3 branch
(`rpothin-improved-enigma`, PR #29).

- [x] **Map library: `leaflet` + `react-leaflet`** (OpenStreetMap tile layer,
      no API key). Confirmed via `package.json` that no map library was already
      a dependency; installed `leaflet@^1.9.4`, `react-leaflet@^5.0.0`, and
      `@types/leaflet` as the minimal necessary packages. `react-leaflet@5` is
      compatible with the app's React 19. Matches ARCHITECTURE.md's explicit
      guidance ("open-source JS map library (e.g. Leaflet)") and avoids any
      paid/API-key-gated provider, per this phase's constraint.
- [x] `src/data/restaurants.ts` extended: `RestaurantRow` gained
      `rpo_latitude`/`rpo_longitude` (nullable — populated asynchronously by the
      geocoding flow per ARCHITECTURE.md); added
      `RESTAURANT_SELECT_WITH_COORDINATES` (kept separate from the existing
      `RESTAURANT_SELECT` so `searchRestaurants`/`getRestaurantById`, used by
      the submission form, don't pay for fields they don't need) and a new
      `listAllRestaurantsWithCoordinates()` for the Map view.
- [x] `src/data/mapPins.ts` (new) — the Map view's data/aggregation layer:
      loads `listApprovedSubmissions()` (same "Approved-only visibility" query
      as Phase 2's Browse feed) and `listAllRestaurantsWithCoordinates()`,
      groups submissions by `restaurantId`, and splits the result into
      plottable `pins: RestaurantPin[]` (restaurant has both coordinates) and
      `ungeocoded: UngeocodedRestaurant[]` (restaurant is missing one/both).
      One restaurant can have multiple approved poutines, so each pin carries
      the full list of submissions at that location.
- [x] `src/screens/MapScreen.tsx` rewritten from the Phase 0 `EmptyState`
      placeholder into a real `MapContainer` (react-leaflet) centered on
      Montreal, with a `FitBounds` helper (a small internal component using
      `useMap`) that recenters/zooms to fit all current pins whenever the pin
      set changes (falls back to a single-pin `setView` when there's exactly
      one). Each restaurant renders one `Marker`; clicking it opens a `Popup`
      listing that restaurant's name/address and every approved poutine there
      (name + price), each with a **"View details"** button.
- [x] **"View details" reuses `SubmissionDetail` directly** (the same Phase 2/3
      component used by Browse) — no duplicated detail UI. `MapScreen` toggles
      between the map and `SubmissionDetail` via local `selectedSubmissionId`
      state (same "local component state, no new router route" pattern already
      established in `SubmitScreen`/`BrowseScreen`), passing a no-op
      `onAggregateChange` since the map doesn't render try/review aggregates on
      pins or popups.
- [x] Custom marker + popup styling per DESIGN.md: markers are a Leaflet
      `divIcon` (not an image asset) styled as a circular fry-gold dot with a
      2px gravy-ink border — matching the "Map pins: circular fry-gold-filled
      pins with gravy-ink border matching the rank-badge shape language" rule
      verbatim. Popups are re-themed via global overrides on Leaflet's own
      generated classes (`.leaflet-popup-content-wrapper`, `.leaflet-popup-tip`,
      `.leaflet-popup-close-button`) to use `paper-white`/`gravy-ink`/sticker-
      shadow tokens instead of Leaflet's default white-box-with-soft-shadow
      look, so the popup reads as one more "sticker" card in the same system as
      every other card in the app.
- [x] **Ungeocoded restaurants are surfaced, not hidden or crashed on.** If a
      restaurant with an approved poutine has no `rpo_latitude`/`rpo_longitude`
      yet, it's excluded from the pin set and instead counted in a small
      non-blocking notice below the map ("N restaurants awaiting geocoding, not
      shown on the map yet: <names>"). If *every* approved poutine's restaurant
      is ungeocoded, the screen falls back to an `EmptyState` explaining that
      instead of rendering an empty map.
- [x] `npm run lint`, `npm run build` (`tsc -b && vite build`), and
      `make app-gate` all pass. Impeccable's design hook found no issues on any
      new/changed file. A local `npm run dev` smoke test confirmed the app
      still serves (HTTP 200) and Vite/TypeScript compile the new
      `leaflet`/`react-leaflet` imports cleanly; a full data-rendering check
      against live pins wasn't possible due to the known `pac code push`
      blocker (below) — same limitation as Phases 1–3.
- [x] **Post-rebase fix** (after rebasing `--onto` the rewritten Phase 1–3
      history, which already carried `9a2b0e8`/`d224c00`'s "Phase N" label
      removal + lookup `$select` fixes): applied the same "Phase N" label
      removal to this layer's own code. Removed the `eyebrow="Phase 4"` prop
      from all three `EmptyState` calls and the `<p className=
      "map-screen__eyebrow">Phase 4</p>` line from `MapScreen.tsx`'s header,
      plus the now-unused `.map-screen__eyebrow` CSS rule from
      `MapScreen.css` — build-phase labels are an internal sequencing concept
      only and shouldn't leak into the product UI, matching Phases 1–3.
      Double-checked `src/data/restaurants.ts` and `src/data/mapPins.ts` for
      the lookup `$select` bug pattern found in Phases 1–3: `RESTAURANT_SELECT`
      only references the Restaurant table's own primitive columns
      (`rpo_restaurantid`, `rpo_name`, `rpo_address`, `rpo_latitude`,
      `rpo_longitude`) — none of them are lookups to another table, so no
      `_value`-suffixed form is needed here; no fix required in these two
      files. Re-validated `npm run lint`, `npm run build`, `make app-gate` —
      all pass.

### Autonomous decisions made this phase (no live user available, autopilot mode)

- **Ungeocoded handling: a small notice below the map, not a separate list
  view or a hard error.** The task explicitly left this call open ("your
  call"). A notice keeps the primary map experience uncluttered while still
  being honest that some approved poutines exist but aren't shown yet — an
  employee isn't left wondering why a restaurant they know is approved is
  "missing" from the map. A full ungeocoded-restaurants list/tab was
  considered and rejected as unnecessary UI surface for a demo-scale app (in
  practice, the async geocoding flow should catch up quickly after
  submission).
- **Grouping pins by restaurant, not by submission.** A restaurant can have
  multiple approved poutines; one pin per restaurant (with a popup listing
  all of that restaurant's poutines) avoids overlapping/duplicate pins at the
  same coordinates, which is both a real Leaflet UX problem (stacked pins are
  hard to click individually) and closer to how an employee thinks about the
  map ("what's good at this restaurant?").
- **No re-theming of the Leaflet zoom control or attribution strip.** DESIGN.md
  doesn't specify a treatment for third-party map chrome, and Leaflet's zoom
  buttons/attribution are functional, low-visual-weight UI elements that
  don't carry brand meaning the way cards/buttons/badges do. Fighting
  Leaflet's internal DOM structure to reskin them (beyond the popup, which
  *is* a card-like surface deserving the design system) was judged not worth
  the fragility it would introduce by pinning styling to Leaflet's internal
  CSS structure across future version upgrades — noted here as the one
  DESIGN.md re-theming limitation for this phase.
- **Popup re-theming targets Leaflet's global CSS classes**, not a React-level
  custom popup component. `react-leaflet`'s `Popup` renders Leaflet's own
  positioned DOM (arrow/tip, close button, content wrapper) outside normal
  React layout, so overriding Leaflet's built-in class names in `MapScreen.css`
  is the supported approach — matches how `leaflet/dist/leaflet.css`'s own
  classes are meant to be extended, per Leaflet's docs.
- **No new router route for the map/detail toggle**, matching the same
  precedent as `SubmitScreen`/`BrowseScreen`.
- **No automated test suite added**, consistent with Phases 1–3 — the repo
  still has no test runner installed. The new grouping/split logic in
  `src/data/mapPins.ts` was validated via `tsc`/ESLint type-checking,
  `npm run build`, and manual code review only.
- **No live Dataverse smoke test was possible** — same known `pac code push`
  blocker as Phases 0–3. All validation this phase was via local build/lint/
  type-check plus a `npm run dev` server-starts check; the new
  `rpo_latitude`/`rpo_longitude` field names and nullability were cross-checked
  directly against `solutions/poutineleaguecore/Entities/rpo_Restaurant/
  Entity.xml`.

## Post-Phase-4 push/export follow-up

Phases 0–5 are complete and stacked as PRs (#26–#32), registered as a native
GitHub Stack (#31). The user asked whether the code app had been pushed to the
Dev solution; it had not. This session (still on the Phase 4 branch, which ended
up being the top of the stack) attempted the push directly and exported what
could be exported independently of it:

- [x] Re-verified `pac code push` still fails with the known 403 (see "Known
      blocker" above).
- [x] Installed and tried the newer, separate GA CLI (`@microsoft/power-apps-cli`,
      `pa`/`power-apps` binaries) as a second path — `pa auth login` succeeded
      (correct account), but `pa app push --solution-id <solutionId>
      --non-interactive` hit the **identical** `CodeAppOperationNotAllowedInEnvironment`
      403. This is decisive: the block is environment-side, not CLI-side.
- [x] Independent of the push blocker: exported + unpacked the current
      `poutineleaguecore` Dev solution state into `solutions/poutineleaguecore/`
      (`pac solution export` → `pac solution unpack`). This picked up the
      Phase 0 **Employee security role** (`Roles/Employee.xml`,
      `RootComponent type="20"` added to `Other/Solution.xml`), which existed in
      Dataverse since Phase 0 but had never been synced to source control.
- [x] `make solution-gate` passed clean at that point — 0 findings.

**The user then enabled "Power Apps code apps" on `raphaelpothin-sandbox`.**
Retrying the push still failed at first (stale cached auth token from before
the toggle flip). Re-authenticating fixed it:

- [x] `pa auth logout` then `pa auth login --account
      raphael@rpothinmvp.onmicrosoft.com` — fresh login, confirmed via
      `pa auth status`.
- [x] `pa app push --solution-id c08f9f79-2c95-f111-b8dc-000d3a340fc1
      --non-interactive` **succeeded.** Live app:
      `https://apps.powerapps.com/play/e/36f603f9-0af2-e33d-98a5-64b02c1bac19/app/1caf2f0c-988f-4aa3-b914-f60143e69dee?tenantId=7e7df62f-7cc4-4e63-a250-a277063e1be7`.
      `power.config.json`'s `appId` is now populated
      (`1caf2f0c-988f-4aa3-b914-f60143e69dee`).
- [x] Re-exported/unpacked the solution to capture the new code app as a
      Dataverse `CanvasApps` component — `rpo_poutineleagueemployee_e772c`
      (`solutions/poutineleaguecore/CanvasApps/`), plus a new
      `RootComponent type="300"` in `Other/Solution.xml` and a `<CanvasApps />`
      element in `Other/Customizations.xml`. Diff is minimal/clean.
- [x] `make solution-gate` initially **failed** on this new component:
      `pac solution pack --processCanvasApps` errored with *"Missing or more
      than 1 composite reference 'BackgroundImageUri' ... cannot resolve
      composite files"*. Root-caused via GitHub issue search to
      `microsoft/PowerAppsCodeApps#361` (open/acknowledged) — Code Apps always
      get an empty `backgroundImageUri` in their app metadata, a gap in
      `@microsoft/power-apps-cli`'s `createAppMetadata`. Related closed issue
      `#369` covers a `pac solution unpack` composite-reference bug, fixed in
      pac CLI ≥ ~2.10.
- [x] **Local-machine root cause, not a repo/tooling bug**: this repo's dev
      machine had two `pac` installs — the correct/current one
      (`C:\...\AppData\Local\Microsoft\PowerAppsCLI`, 2.10.1, which does **not**
      have the `--processCanvasApps` bug) and a stale `dotnet tool install -g
      microsoft.powerapps.cli.tool` (1.32.8, which does). `make`'s underlying
      Git Bash subshell resolved the stale 1.32.8 `pac` first, silently masking
      the fix already present in 2.10.1. Fixed by `dotnet tool uninstall -g
      microsoft.powerapps.cli.tool`. A second wrinkle: Git Bash doesn't resolve
      a bare `pac` to the `pac.cmd` batch shim the way `cmd.exe`/PowerShell do
      (PATHEXT-style resolution), so after removing the dotnet-tool shim, `pac`
      was briefly unresolvable from `make` at all. Fixed with a one-line
      wrapper script at `~/.local/bin/pac` (already on PATH) that `exec`s the
      real `pac.cmd` with full path/extension — a local dev-environment fix,
      not a repo change. **No Makefile change was needed** — a
      `--processCanvasApps` fallback was drafted mid-investigation but fully
      reverted once the real root cause (duplicate/stale local `pac` installs)
      was found; the plain, original Makefile packs and checks cleanly with a
      correctly-resolved 2.10.1 `pac`.
- [x] `make solution-gate` now passes clean (0 findings) with the plain
      Makefile and the new `CanvasApps` component included.

**Lesson for future sessions/machines**: if `make solution-gate` (or any
`make`-invoked `pac` command) behaves differently than a directly-invoked `pac`
in the same shell, suspect a duplicate/stale `pac` install shadowing the
current one on PATH inside whatever subshell `make` uses (`where.exe pac` /
`pac --version` fingerprint the active binary). `dotnet tool install -g
microsoft.powerapps.cli.tool` is no longer a reliable way to install/update
`pac` — the current NuGet package fails dotnet-tool validation (`missing
DotnetToolSettings.xml`) for both fresh installs and updates.

## Completed steps (Phase 5 — Leaderboards / Hall of Fame, v1 scope)

Built on branch `rpothin-super-garbanzo`, stacked on the Phase 4 branch
(`rpothin-employee-app-map-view`, PR #30). **This is the last phase of the
currently-agreed phased plan** — see "Deferred / out of scope" below.

- [x] `src/data/constants.ts` extended: five new `ENTITY_SETS` entries
      (`seasons`, `categories`, `seasonResults`, `seasonResultEntries`,
      `hallOfFameEntries`) and a new `SeasonStatus`/`SeasonStatusValue`/
      `SEASON_STATUS_LABELS` enum (`Active = 100000000`, `Closed = 100000001`,
      cross-checked against `solutions/poutineleaguecore/Entities/rpo_Season/
      Entity.xml`).
- [x] `src/data/leaderboards.ts` (new) — the Phase 5 read-only data-access
      layer: `listSeasons`, `pickDefaultSeason` (Active season, else the most
      recently started), `listCategories` (ordered per
      `LEADERBOARD_CATEGORY_ORDER`), `listSeasonResultEntries(seasonId,
      categoryId)` (resolves the `SeasonResult` row for that season/category
      pair first, then its ranked `SeasonResultEntry` children — returns `[]`,
      never throws, when no `SeasonResult` exists yet), and
      `listHallOfFameEntries()`. All lookup display names (employee, poutine
      submission, season, category) are resolved via the
      `@OData.Community.Display.V1.FormattedValue` annotation already
      returned by `listRows`, matching the exact pattern in `tries.ts` —
      no extra `$expand` round-trips.
- [x] `src/components/StatusBadge/StatusBadge.tsx` extended with a new,
      generic exported `Badge({ label, variant })`, reusing the existing
      `status-badge`/`status-badge--{variant}` CSS classes rather than adding
      a parallel badge component — used here for the Season Active/Closed
      chip (`approved` = green / `draft` = neutral).
- [x] `src/components/LeaderboardTable/` (new) — renders the full ranked
      `SeasonResultEntry` list for one Category/Season, with the top 3 rows
      visually emphasized (gold/silver/bronze). Score display is formatted
      per the category's `rpo_computationtype` (try counts, `★`-prefixed
      weighted rating, or a `%` for the AI-assisted helpfulness score).
      Renders the shared `EmptyState` component instead of a table when
      `entries` is empty (no computed `SeasonResult` yet).
- [x] `src/components/HallOfFame/` (new) — renders all-time
      `HallOfFameEntry` rows grouped by season (most recently archived
      first), one card per category winner. Renders `EmptyState` when no
      season has closed yet.
- [x] `src/screens/LeaderboardsScreen.tsx` rewritten from the Phase 0
      `EmptyState` placeholder: a season `<select>` (defaulting to the Active
      season) with a Season status `Badge`, category tabs (reusing the same
      tab visual pattern as `SubmitScreen`), the selected category's
      `LeaderboardTable`, and a Hall of Fame section below. Uses two
      `useEffect`s: one to load seasons/categories/Hall of Fame once on
      mount, one that re-fetches `SeasonResultEntry` rows whenever the
      selected season or category changes (inlined as a cancellable async
      function directly in the effect body, not via a `useCallback` called
      from the effect — the latter tripped `react-hooks/set-state-in-effect`
      during `npm run lint`).
- [x] `npm run lint`, `npm run build` (`tsc -b && vite build`), and
      `make app-gate` all pass clean. Impeccable's design hook found no
      issues on any new/changed file.
- [x] Verified against seed data (`data/*.csv`) that the **Active** season
      (Summer 2026) and the Spring 2026 (Closed) season both have **zero**
      seeded `SeasonResult`/`SeasonResultEntry` rows — only Winter 2025-2026
      (Closed) has full seeded results + Hall of Fame data for all four
      categories. This means the empty-state path is exercised by default
      when the app loads (Active season selected, nightly computation
      hasn't run for it) — confirmed by code review, not a live smoke test
      (still blocked; see "Known blocker").

### v1 scope decisions (flagged for human product-owner revisit)

PRODUCT.md explicitly leaves "final category list" and "winner rewards"
undecided. The following v1 decisions were made autonomously to unblock this
phase and should be revisited by the human product owner:

1. **Category list: all four launch categories, not a subset.**
   PRODUCT.md's Capabilities line is explicit: *"Four launch leaderboard
   categories — Best Seller, Top Poutine (confidence-weighted rating), Best
   Supporter, Best Critic."* This supersedes a stale note in this file's
   prior "Next steps" section that said "Top Poutine + Best Supporter only
   for v1" — that note predates PRODUCT.md's four-category commitment and
   was not carried forward. Display order is fixed via
   `LEADERBOARD_CATEGORY_ORDER` in `src/data/leaderboards.ts`; any category
   added later that isn't in that list is appended alphabetically rather
   than hidden.
2. **Display depth: full ranked list per category/season, not top-3-only.**
   ARCHITECTURE.md's data model explicitly states `SeasonResult` stores "a
   full ranked-list snapshot... not just top-1/top-3," so showing the full
   list is the more faithful reading of the already-agreed data model. The
   top 3 rows get gold/silver/bronze visual emphasis so the "podium" is
   still immediately scannable — this balances "full list" with the
   gamification intent (root `PRODUCT.md`'s leaderboard/badge framing) of
   making the top ranks feel special.
3. **⚠️ Read path for the current season: persisted `SeasonResultEntry`
   snapshot, not live on-demand computation — a deliberate departure from
   ARCHITECTURE.md's "on-demand" note.** ARCHITECTURE.md's flows/agents
   section says live leaderboard *views* should ideally be "computed on
   demand by the code app from raw Dataverse data... for responsiveness,"
   reserving the `SeasonResult` snapshot for "history, badges, and
   season-close/Hall of Fame purposes." This phase reads the snapshot for
   **every** category, including the current/active season, for one
   concrete reason: **Best Critic's score is the nightly flow's AI-assisted
   review-helpfulness score** (produced by the Review Quality agent), which
   cannot be reproduced client-side without duplicating an AI call into the
   code app. Rather than splitting the read path per category (live compute
   for the three deterministic categories, snapshot-only for Best Critic),
   v1 uses one consistent snapshot-based read for all four — simpler and
   more correct, at the cost of showing slightly stale data for the current
   season between nightly flow runs (visible today as "no standings yet"
   for the Active season, since seed data has no computed results for it).
   **This should be revisited** if same-day-fresh live standings for the
   three non-AI categories become a product priority — that would need a
   split read path (on-demand compute for `try_count_by_submitter` /
   `try_count_by_employee` / `weighted_rating`, snapshot-only for
   `review_helpfulness_score`).
4. **Season selector defaults to the Active season**, falling back to the
   most-recently-started season if none is Active (e.g. briefly between a
   season close and the next one opening), with a dropdown to browse any
   season — this also surfaces the seeded Winter 2025-2026 historical data,
   useful for demoing since the Active season currently has no computed
   entries yet.
5. **Winner rewards remain unimplemented, per PRODUCT.md's explicit "do not
   assume or invent a reward" instruction.** The Hall of Fame shows a
   `rpo_badgetitle` string (e.g. a season/category title) where present, but
   no tangible reward mechanic of any kind was added.

### Deferred / out of scope (last phase of the current plan)

Phase 5 is the last phase of the currently-agreed phased plan. **Embedded
conversational agent wiring is explicitly out of scope for this phase and
the plan as a whole so far** — the `NavShell`'s "Chat" nav entry remains the
disabled "Coming soon" placeholder added in Phase 0. That work is deferred
to a future session, once the corresponding Copilot Studio agent itself
exists (to be picked up via the `agent-implementation` skill at that time).

## Next steps (beyond the current phased plan)

1. ~~Get an environment admin to enable "Power Apps code apps"~~ — done; the
   Phase 4 layer's session pushed the app live (see "Post-Phase-4 push/export
   follow-up" above). This Phase 5 layer's corrected build (lookup `$select`
   fix + "Phase 5" label removal, below) still needs its own redeploy pass so
   the live app reflects the Leaderboards screen too.
2. ~~Export/unpack the `poutineleaguecore` solution~~ — done; the Employee
   role and the code app's `CanvasApps` component are both in source control
   (see above). Re-export/unpack again after this layer's redeploy to capture
   the updated `CanvasApps` asset.
3. Do a live smoke test of all five phases (submission CRUD, cap enforcement,
   Browse feed, detail view, Try/Review creation + dedup, Map pins/popups/
   ungeocoded notice, Leaderboards/Hall of Fame incl. the empty-state path)
   against real Dataverse data now that the app is deployed and reachable —
   including confirming the nightly leaderboard computation flow actually
   populates `SeasonResult`/`SeasonResultEntry` for the Active season so the
   non-empty-state path can be verified too.
4. Wire the embedded conversational agent into the "Chat" nav entry, once
   the corresponding Copilot Studio agent exists (new session, via
   `agent-implementation`).

## Post-rebase fix pass (this layer, top of stack)

After Phases 1–4 were each rebased/fixed layer-by-layer (removing "Phase N"
UI labels and fixing a Dataverse lookup `$select` bug — selecting a lookup
field by its bare schema name instead of the `_logicalname_value` form the
platform actually returns), this Phase 5 layer picked up the same two fixes
so the whole stack is consistent:

- [x] Removed the `Phase 5` eyebrow label from `LeaderboardsScreen.tsx` (and
      its now-unused `.leaderboards-screen__eyebrow` CSS rule), matching the
      label removal already done on every other layer.
- [x] Fixed the same lookup `$select` bug in `src/data/leaderboards.ts`: the
      `SeasonResultEntry` select now uses `_rpo_employeeid_value` /
      `_rpo_poutinesubmissionid_value` instead of the bare schema names, and
      the `HallOfFameEntry` select now uses `_rpo_seasonid_value` /
      `_rpo_categoryid_value` / `_rpo_employeeid_value` /
      `_rpo_poutinesubmissionid_value`. The row-mapping code already read
      `row._..._value` for these fields, so this was a real bug — without it
      the annotated lookup values would never have actually been returned by
      Dataverse, silently breaking employee/poutine name resolution on both
      the leaderboard table and the Hall of Fame list.
- [x] Rebased onto the corrected `rpothin-employee-app-map-view` tip (which
      itself already had the label/`$select` fixes for Phases 1–4) via
      `git rebase --onto`, since this layer's local history still had the
      old, now-superseded Phase 1–4 commits.
- [x] `npm run lint`, `npm run build`, and `make app-gate` re-verified passing
      after the fix.
- [x] As the current top of stack, this layer also performed the final
      redeploy: `pa app push --solution-id
      c08f9f79-2c95-f111-b8dc-000d3a340fc1 --non-interactive`, followed by
      `pac solution export`/`pac solution unpack` to capture the updated
      `CanvasApps` component, and `make solution-gate` (0 findings).
