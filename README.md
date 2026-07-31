# mcdm26-ai-native-powerplatform-dev

Demo companion repository for **AI-Native Power Platform Development: Building from the IDE**, prepared for **Microsoft Community Days Montreal 2026**.

This repository is the working space for presentation-aligned demonstrations that show how Power Platform work can move from a browser-first experience to an **AI-native, IDE-centered workflow**. The goal is not to prove that one tool replaces every other tool. The goal is to show where AI-assisted development fits, where review gates still matter, and how to structure the work so the results stay reliable.

> [!NOTE]
> This is an early bootstrap repository. The structure is intentionally generic for now, and concrete demo assets will be added incrementally as the session build-out progresses.

## Session framing

Most attendees already know the traditional Power Platform experience in the browser. This repo supports a session that explores:

- why teams may want an IDE-centered workflow
- what tradeoffs come with that shift
- where AI agents help across the delivery lifecycle
- which review, approval, and ALM gates should remain human-controlled

The demos are organized around **solution lifecycle phases**, not around isolated products.

## Planned demo storyline

The working demo story is based on a fictional **SupportCRM** solution and follows an AI-native delivery loop:

1. **Ideate, research, prototype** using AI assistance and live platform context.
2. **Implement, review, iterate** with GitHub Copilot and Power Platform skills.
3. **ALM, operate, learn** by promoting safely, observing outcomes, and feeding insights back into the next cycle.

## Planned scope

This repository is expected to host examples and supporting material for:

- **Dataverse from the IDE**
- **Power Apps code apps from the IDE**
- **Copilot Studio authoring, testing, and publishing from the IDE**
- **Harness engineering**, including review gates, deterministic checks, and operational feedback loops

## Expected repository structure

The exact layout may evolve, but the initial structure is expected to align with the presentation:

```text
docs/
  session/
  operator-notes/
  fallbacks/
src/
  supportcrm-solution/
  01-ideate-research-prototype/
  02-implement-review-iterate/
  03-alm-operate-learn/
data/
  seed/
  snapshots/
tools/
```

## Technology areas being explored

The current working stack includes:

- **GitHub Copilot** and the GitHub coding agent experience
- **microsoft/power-platform-skills**
- **microsoft/Dataverse-skills**
- **microsoft/skills-for-copilot-studio**

## Working principles

This repo is being shaped with a few practical rules in mind:

- keep demos aligned to the presentation narrative
- prefer deterministic setup and reusable assets over one-off stage magic
- capture fallback paths for every critical demo step
- keep humans in control of approvals, production-impacting changes, and final quality decisions

## Status

Repository bootstrap is complete. Demo content, scripts, sample assets, and setup instructions will be added as the session implementation progresses.
