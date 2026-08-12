# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Employees of the company (~50 people, Montreal-based only), acting under their real employee identity (no anonymity). They use the app both on mobile (quick check-ins during breaks) and on desktop (at their workstation) in roughly equal measure — it must be fully responsive across both. This is the **employee-facing app only**; a separate admin/moderation app (out of scope for this document) serves the small (2–3 person) moderator group.

## Product Purpose

The employee app is where colleagues submit poutines they've discovered at Montreal restaurants, browse/discover what others have found (list and map views), self-declare "tries," leave star ratings and written reviews, track seasonal and all-time leaderboards across four launch categories, and get help from an embedded conversational AI agent. Success means employees actually use it to connect socially over a shared love of poutine, while it also functions as a credible, polished showcase of AI-native Power Platform development.

## Positioning

Not a generic review/rating app: it combines a confidence-weighted ("Bayesian-style") ranking that protects lightly-reviewed poutines from unfairly topping the board, a hard submission cap that rewards selectivity over volume, and agentic AI woven directly into core flows (duplicate detection at submission time, first-pass moderation, fun-fact generation, conversational assistance) rather than bolted on as a side feature.

## Operating Context

- Runs as a Power Apps code app connected directly to Dataverse (single Dev environment, one unmanaged solution, for this demo).
- Real employee identity throughout — submissions, tries, and reviews are attributed to Dataverse system users (Entra ID-backed); no custom login/identity system.
- Embeds the interactive conversational agent (GitHub Copilot harness) as an in-app chat panel; the same agent is also published standalone to Microsoft 365 Copilot.
- Map view uses an open-source JS map library (e.g. Leaflet) centered on Montreal, with restaurant coordinates geocoded by a backend flow.
- Employee base is small (~50 people) — list, feed, and leaderboard density/pagination should assume a modest scale, not enterprise volume.

## Capabilities and Constraints

- Submit a poutine (restaurant/place name + address, poutine name/description, price, photo, tags) — hard cap of **5 active submissions** per employee.
- New submissions go through lightweight AI-assisted first-pass moderation and a duplicate/similarity check before becoming publicly visible; ambiguous cases are escalated to human moderators via the separate admin app (not built here).
- "Trying" a poutine is self-declared (honor system, no proof required) and precedes leaving a review.
- A review is a star rating (1–5) plus a short written comment; reviews/ratings are visible to everyone, tied to the reviewer's real name.
- Discovery via a filterable list/feed (tags, neighborhood, rating) and a map view.
- Four launch leaderboard categories — Best Seller, Top Poutine (confidence-weighted rating), Best Supporter, Best Critic — tracked as both an all-time Hall of Fame and per-season (winter/spring/summer/autumn) standings.
- Notifications are intentionally minimal — season/category winner announcements only; day-to-day activity (someone trying your poutine, new reviews) is discovered by browsing, not pushed.
- Winner reward mechanics (symbolic vs. tangible) are explicitly **undecided** — do not assume or invent a reward beyond badges/titles/leaderboard recognition.
- No formal accessibility standard is mandated for this internal tool, but it should still follow solid, sensible accessibility practice.
- Fully responsive: must work well on both mobile and desktop, since employees use both roughly equally.

## Brand Commitments

Inherits the shared "Comptoir Championship" visual system from `code-apps/DESIGN.md` (hand-painted casse-croûte aesthetic; fry-gold as the dominant color; ketchup-red reserved as a rare, meaningful accent). This app does not define its own visual identity — it consumes the shared design system.

## Evidence on Hand

No real submissions, restaurant data, reviews, or brand assets exist yet. Sample/demo data is planned as versioned CSV/JSON seed files (restaurants, poutines, tags, reviews, seasons) loaded via the Dataverse skill's bulk-import capability. Do not fabricate real testimonials, reviews, or restaurant data beyond what is explicitly seeded.

## Product Principles

- **Selectivity over volume.** Reward good taste and generosity in sharing it — never spam-submitting.
- **Fairness in rankings.** Confidence-weighted scoring protects lightly-reviewed entries from gaming the leaderboard.
- **AI woven in, not bolted on.** Duplicate detection, moderation assist, fun facts, and conversational help are core interactions, not side features.
- **Real identity, full transparency.** Every submission, try, and review is attributed to a real colleague.
- **Small-scale, high-craft.** ~50 users means density/scale assumptions stay modest; craft and delight matter more than raw scalability.

## Accessibility & Inclusion

No formal standard (e.g. WCAG) is required for this internal tool; follow solid, sensible accessibility practice (semantic structure, keyboard operability, adequate contrast) as a baseline expectation.
