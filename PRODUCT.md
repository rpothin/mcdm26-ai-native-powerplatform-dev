# Poutine League

## Vision

Poutine League is an internal, gamified experience that turns the Montreal-based company's shared love of poutine into a fun, social discovery game. Employees submit the best poutines they've found in Montreal restaurants, colleagues try them and leave ratings/reviews, and the community crowns seasonal and all-time champions across several categories — rewarding good taste and generosity in sharing it, not spam-submitting.

The product serves two equally important goals:
- **Social bonding** — give colleagues a fun, low-stakes reason to connect, explore the city together, and talk about something other than work.
- **AI-native showcase** — serve as a playful, real showcase of what an AI-native Power Platform product can look and feel like, with agentic AI features woven into the core experience rather than bolted on.

This document describes the **functional vision only**. Technical architecture, data model, and implementation choices are intentionally out of scope here.

## Audience

- Available to **all employees** of the company (Montreal-based only, so no regional restriction needed).
- All participants act under their **real employee identity** — submissions, reviews, and leaderboard placements are fully attributed (no anonymity or handles).

## Core Concepts

### Submitting a poutine

- Any employee can submit a poutine they believe is one of the best in Montreal.
- A submission captures: restaurant/place name and address, poutine name/description, price, a photo, and descriptive **tags** (e.g. classic, smoked meat, vegan, spicy).
- Each employee has a **hard cap of 5 active submissions** (configurable in the future). The cap reinforces the "quality over quantity" philosophy: the game rewards showing restraint and proposing only truly excellent poutines, not flooding the list.
- New submissions go through **lightweight moderation** before becoming publicly visible. The intent is for an **AI agent to handle first-pass review** (e.g. checking completeness, obvious duplicates, inappropriate content), escalating edge cases to a small group of human moderators/admins.
- Before a submission is accepted, an **AI-assisted duplicate/similarity check** runs against existing entries (same restaurant and/or very similar poutine) to avoid redundant or conflicting entries, surfaced directly in the submission flow.

### Trying and reviewing a poutine

- "Trying" a poutine is **self-declared** (honor system): an employee marks a poutine as tried, then rates and reviews it. No photo or check-in proof is required.
- A review consists of a **star rating (1–5)** plus a **short written comment**.
- Reviews and ratings are visible to everyone, tied to the reviewer's real name.

### Discovery

- Employees can browse and discover poutines through both:
  - A **list/feed view** with filtering by tags, neighborhood, rating, etc.
  - A **map view** centered on Montreal showing where each submitted poutine can be found.

## Gamification: Categories & Leaderboards

Two parallel timeframes are tracked:
- An **all-time Hall of Fame**, continuously updated.
- **Seasonal contests**, aligned with the four seasons (winter, spring, summer, autumn) — since poutine recommendations naturally shift with the seasons. Each season resets and crowns a **single winner (top 1)** per category.

Launch categories:

1. **Best Seller** — the employee whose submitted poutine(s) got the most colleagues to try them. Recognizes people who are good at "selling" their picks to others.
2. **Top Poutine** — the highest-rated poutine for the period. To be fair to poutines with few votes, this uses a **confidence-weighted rating** (a dynamic average that accounts for both the average score and the number of reviews, similar in spirit to a Bayesian/weighted average) so that a poutine with a very high rating but very few reviews doesn't automatically outrank one with a strong rating backed by many reviews. Borderline cases should be flagged for review rather than resolved purely automatically.
3. **Best Supporter** — the employee who tried the most poutines. The "poutine lover"/most supportive taste-tester of the community.
4. **Best Critic** — the employee whose written reviews are considered the most helpful/insightful (exact evaluation approach to be refined, potentially AI-assisted).

Notes:
- Submitters are explicitly **not** rewarded for volume — the submission cap and the category design both discourage spamming and instead reward selectivity, popularity, quality, and engagement.
- Winner rewards (badges/titles vs. tangible prizes) are **not yet decided** and are left open for a future decision — the experience should work purely on symbolic recognition (badges, titles, leaderboard bragging rights, Hall of Fame entries) at minimum.
- Additional categories may be introduced over time (the list above is the launch set, not final).

## Agentic AI Features

Agentic AI is meant to be infused throughout the experience rather than as a single add-on feature. Priorities for a first version:

1. **Duplicate/similarity detection during submission** — proactively flags likely-duplicate restaurants or poutines as someone is submitting, before it reaches moderation.
2. **AI-assisted moderation** — an agent performs first-pass review of new submissions (completeness, obvious issues, duplicate signals) and escalates ambiguous cases to human moderators/admins instead of blocking or approving blindly.
3. **Fun facts / trivia generation** — the agent surfaces fun, engaging trivia or context about a submitted poutine or restaurant (e.g. history, ingredients, fun comparisons) to reinforce the playful, gamified feel.
4. **Conversational assistant** — a chat-style agent employees can talk to for help using the product and getting recommendations (e.g. "what's the best vegan poutine downtown?", "help me find a poutine I haven't tried yet").

Other AI ideas discussed but not prioritized for launch (candidates for later iterations): personalized recommendations based on taste history, AI-generated review summaries/sentiment digests per poutine.

## Notifications

Kept intentionally minimal at launch to avoid noise: employees are notified primarily about **season results and category winner announcements**. Day-to-day activity (someone trying your poutine, new reviews, etc.) is discovered by employees browsing the app rather than through push notifications. This can be revisited later if engagement needs a boost.

## Out of Scope (for this document)

- Technical architecture, data model, integrations, and hosting decisions.
- Final decision on winner rewards (symbolic-only vs. tangible prizes).
- Final list of all gamification categories beyond the launch set.
- Detailed moderation team composition and escalation process.
