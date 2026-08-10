---
name: Poutine League
description: Hand-painted casse-croûte energy for a gamified Montreal poutine league.
colors:
  fry-gold: "#D99A2B"
  fry-gold-deep: "#B87A1C"
  ketchup-red: "#C23B2E"
  ketchup-red-deep: "#9C2B21"
  relish-green: "#5C7A3A"
  mustard-amber: "#E0A419"
  cream-counter: "#FBF3E6"
  paper-white: "#FFFDF8"
  checker-light: "#EDD9B8"
  gravy-ink: "#2A1D14"
  gravy-text: "#3A2A1E"
  gravy-text-soft: "#6B5644"
typography:
  display:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  score:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "12px"
  lg: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.fry-gold}"
    textColor: "{colors.gravy-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.fry-gold-deep}"
  button-secondary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.gravy-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
  chip-tag:
    backgroundColor: "{colors.checker-light}"
    textColor: "{colors.gravy-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  card-poutine:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "16px"
  badge-rank:
    backgroundColor: "{colors.fry-gold}"
    textColor: "{colors.gravy-ink}"
    typography: "{typography.score}"
    rounded: "{rounded.pill}"
    size: "40px"
---

# Design System: Poutine League

## Overview

**Creative North Star: "The Comptoir Championship"**

Poutine League looks like the laminated menu board and hand-painted sign above a beloved Montreal casse-croûte — warm, confident, a little cheeky, built to be read at a glance from the counter. The system takes its cues from comptoir culture: chalkboard specials, sticker-badged loyalty cards, laminated table numbers, and the taped-up "Champion of the Month" photo by the register. It exists to make an internal work tool feel like a neighborhood ritual, not a dashboard.

Flat and graphic, never soft or glassy: surfaces separate with ink-black outlines and hard offset shadows like laminated cardstock, not blurred drop shadows. Fry-gold is the one color every screen is built around; ketchup-red is reserved and only appears where it means something (a call to action, a live rating, an alert). Rejected explicitly: cold blues/grays, glassmorphism, soft blurred shadows, gradient mesh backgrounds, and generic rounded-icon-tile chrome — none of it belongs in a casse-croûte.

The admin/moderation app inherits the same palette, type, and shape language, but its composition is calmer and denser — a back-of-house control panel run by the same counter, not a second brand.

**Key Characteristics:**
- Hand-painted sign-board display type paired with a clean workhorse body face for scanability.
- One dominant saturated color (fry-gold) per screen; ketchup-red stays rare and meaningful.
- Flat surfaces, ink-black borders, hard offset "sticker" shadows — no blur, no glass.
- Checkerboard motif used sparingly as a divider/accent, never as a busy full background.
- Pill-shaped chips and badges everywhere small facts (tags, ranks, status) need to be scanned fast.

## Colors

A warm, committed palette: fry-gold carries the surface, ketchup-red is the rare exclamation mark, and everything else sits in creamy counter-neutrals.

### Primary
- **Fry Gold** (`#D99A2B`): the system's dominant color — primary buttons, active nav state, header bands, hero sections, the "one griddle" every screen is built around.
- **Fry Gold Deep** (`#B87A1C`): hover/active/pressed state for fry-gold surfaces.

### Secondary
- **Ketchup Red** (`#C23B2E`): reserved for meaning, not decoration — primary CTAs that commit an action (submit, approve), live star ratings, and destructive/alert states.
- **Ketchup Red Deep** (`#9C2B21`): hover/active state for ketchup-red surfaces.

### Tertiary
- **Relish Green** (`#5C7A3A`): approved/success states only (submission approved, connection healthy).
- **Mustard Amber** (`#E0A419`): pending/in-review states only (submission in moderation, season in progress).

### Neutral
- **Cream Counter** (`#FBF3E6`): page background — the laminate-countertop base, never stark white.
- **Paper White** (`#FFFDF8`): card/surface background, one step lighter than the page for gentle separation.
- **Checker Light** (`#EDD9B8`): tag chips, table zebra-striping, and the checkerboard accent motif.
- **Gravy Ink** (`#2A1D14`): borders and outlines — the "hand-painted line" that separates every surface.
- **Gravy Text** (`#3A2A1E`): primary body/heading text color.
- **Gravy Text Soft** (`#6B5644`): secondary/meta text (timestamps, helper copy, counts).

### Named Rules
**The One Griddle Rule.** Fry-gold owns exactly one dominant region per screen — a header band, a hero card, or the primary CTA — never more than one at a time. Spend it once per screen or it stops feeling special.

**The Ketchup Is Punctuation Rule.** Ketchup-red never fills a background or a large region. It marks the single thing on a screen that wants a reaction: submit, approve, a 5-star badge, a "your turn" alert.

## Typography

**Display Font:** Alfa Slab One (with Georgia, serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)
**Label/Score Font:** ui-monospace stack (SFMono-Regular, Menlo, Consolas)

**Character:** Alfa Slab One brings the thick, confident stroke of a hand-painted menu board to hero moments and section titles; Inter stays out of the way for everything an employee actually has to read and act on. The monospace score face gives ranks, ratings, and prices the tabular precision of a scoreboard.

### Hierarchy
- **Display** (400, `clamp(2.25rem, 5vw, 3.75rem)`, 1.05): page heroes, season-winner announcements, empty-state headlines.
- **Headline** (400, `clamp(1.5rem, 3vw, 2.25rem)`, 1.1): section titles ("Leaderboard", "Review Queue"), card group headers.
- **Title** (700, 1.25rem, 1.3): card titles (poutine name, restaurant name), button labels.
- **Body** (400, 1rem, 1.5): reviews, descriptions, form fields. Wrap at 65–75ch for reviews and comments.
- **Label** (600, 0.8125rem, 1.2, 0.02em tracking): tag chips, status badges, table headers — uppercase where used as a category marker.
- **Score** (700, 1.125rem, 1, mono, tabular): star ratings, leaderboard ranks, prices, review counts.

### Named Rules
**The Menu Board Rule.** Alfa Slab One is for moments that deserve a beat — hero, headline, a crowned winner. It never appears in body copy, form labels, or dense admin tables; there it steps aside for Inter.

## Layout

A single comfortable content column (max 1200px) with generous top-of-section spacing over bottom, matching the spacing scale (4/8/16/24/40px). Employee app screens breathe — cards have room, the map/list toggle sits prominently, leaderboards use full-width rank rows. The admin app tightens the same rhythm: denser tables, smaller card padding (use `sm`/`md` spacing over `lg`/`xl`), more rows visible per screen, because its 2–3 users optimize for throughput over atmosphere. Both apps share the same 12px grid baseline and the same breakpoint behavior: single column below 640px, two-column card grids from 640–1024px, full multi-column leaderboard/table layouts above 1024px.

## Elevation & Depth

Flat by design, with depth conveyed through ink-black outlines and hard, unblurred offset shadows — like laminated cardstock stacked on a counter, never glass or soft ambient light. Nothing in this system uses `blur()`, gradient meshes, or floating glass panels.

### Shadow Vocabulary
- **Sticker** (`box-shadow: 3px 3px 0 #2A1D14`): default resting shadow for cards, buttons, and badges — a hard, single-direction offset with zero blur.
- **Sticker Pressed** (`box-shadow: 1px 1px 0 #2A1D14`): active/pressed state, shadow compresses as the element "sits down" on the counter.
- **Sticker Lifted** (`box-shadow: 5px 5px 0 #2A1D14`): hover state on interactive cards, shadow grows slightly as if peeling up off the counter.

### Named Rules
**The Laminate Rule.** Depth comes from a hard offset shadow and a visible ink border, never from blur. If a surface needs to look "elevated," give it more offset — not more blur.

## Shapes

Borders are the load-bearing visual device: every card, button, and chip carries a 2px `gravy-ink` outline, echoing a hand-painted sign's confident line. Corners are generously rounded — `sm` (6px) for tight controls, `md` (12px) for cards, `lg` (20px) for hero/feature cards — evoking laminated menu cards and rounded diner signage rather than sharp corporate rectangles. Interactive chips, badges, and primary/secondary buttons are full pills (`999px`), like loyalty-card stamps or rank medals. The checkerboard motif (alternating `cream-counter`/`checker-light` squares) appears only as a thin divider strip or footer/header band accent — never as a full-page background, where it would overwhelm content.

## Components

### Buttons
- **Shape:** full pill (`999px` radius), 2px `gravy-ink` border, Sticker shadow at rest.
- **Primary:** `fry-gold` background, `gravy-ink` text, Title typography, 12px/28px padding. Reserved for the one primary action per screen (Submit, Approve).
- **Secondary:** `paper-white` background, `gravy-ink` text and border, same shape/padding — used for all non-primary actions.
- **Destructive/Alert:** same shape, `ketchup-red` background, `paper-white` text — reject, delete, cancel actions only.
- **Hover / Focus:** background shifts to the `-deep` variant; shadow grows to Sticker Lifted; focus ring is a 3px `gravy-ink` outline offset 2px, never a soft glow.

### Chips (tags, status)
- **Style:** `checker-light` background, `gravy-text` label type, full pill, no border (chips are quieter than cards/buttons).
- **State:** status chips swap fill color by meaning — `mustard-amber` for in-review, `relish-green` for approved, `ketchup-red` for rejected — always paired with a text label, never color alone.

### Cards / Containers
- **Corner Style:** `md` (12px) for poutine/review cards, `lg` (20px) for hero/leaderboard-winner cards.
- **Border/Shadow:** 2px `gravy-ink` border + Sticker shadow at rest, Sticker Lifted on hover for anything clickable.
- **Content Rhythm:** image/photo first (poutine photo), Title below, meta row (rating score, tag chips) beneath that, using `sm`–`md` internal spacing.

### Leaderboard / Rank Badges
- **Shape:** circular, 40px, `fry-gold` fill, `gravy-ink` border, Score typography centered.
- **Top-1 treatment:** the current season/all-time #1 gets a `mustard-amber` ring accent outside the badge border — the closest this system gets to a literal medal, used sparingly (only true #1 placements, never generic "featured" tagging).

### Map & List Views (Employee app discovery)
- **List rows:** card treatment above, one row per poutine, rank/score right-aligned in Score typography.
- **Map pins:** circular `fry-gold`-filled pins with `gravy-ink` border matching the rank-badge shape language, so map and list feel like one system, not two.

## Do's and Don'ts

**Do:**
- Spend fry-gold once per screen as the dominant region (header, hero, or primary CTA).
- Keep every border `gravy-ink`, every shadow hard-offset with zero blur.
- Use the checkerboard motif only as a thin accent strip, never a full background.
- Give the admin app the same palette and shapes, just tighter spacing and smaller type scale usage.
- Pair every status color with a text label — never rely on color alone for meaning.

**Don't:**
- Don't use soft blurred shadows, glassmorphism, or gradient-mesh backgrounds — this system is flat and hard-edged by doctrine.
- Don't let ketchup-red fill a background, nav bar, or large region — it's punctuation, not paint.
- Don't introduce cool blues/grays or stock "SaaS" gradient icon tiles — everything visual should feel hand-made for a casse-croûte, not a generic dashboard template.
- Don't use Alfa Slab One for body copy, table cells, or form labels — reserve it for hero/headline moments only.
- Don't stack more than one rounded-radius scale on the same element family (e.g., don't mix `md` and `lg` cards in the same grid).
