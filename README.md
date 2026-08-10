# mcdm26-ai-native-powerplatform-dev

Demo companion repository for [**AI-Native Power Platform Development: Building from the IDE**, prepared for **Microsoft Community Days Montreal 2026**](https://www.communitydays.org/event/2026-08-21/microsoft-community-days-montreal#sessions?id=1236475).

This repository is the working space for presentation-aligned demonstrations that show how Power Platform work can move from a browser-first experience to an **AI-native, IDE-centered workflow**. The goal is not to prove that one tool replaces every other tool. The goal is to show where AI-assisted development fits, where review gates still matter, and how to structure the work so the results stay reliable.

## What's being built

The demo product is **Poutine League** — an internal, gamified experience for discovering and rating Montreal poutines, built exclusively on Power Platform (Dataverse, Power Automate, Power Apps code apps, Copilot Studio agents). Start here, in order:

- [`PRODUCT.md`](PRODUCT.md) — functional vision: what the product does and for whom.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — technical design: data model, agents, flows, ALM.
- [`code-apps/DESIGN.md`](code-apps/DESIGN.md) — shared visual design system for the code apps.

These three documents are human-owned; see [`AGENTS.md`](AGENTS.md#foundational-documents) for how agents should treat them.

## Session framing

Most attendees already know the traditional Power Platform maker experience in the browser. This repo supports a session that explores:

- why teams may want an IDE-centered workflow
- what tradeoffs come with that shift
- where AI agents help across the delivery lifecycle
- which review, approval, and ALM gates should remain human-controlled

## Technology areas being explored

The current working stack includes:

- [**GitHub Copilot App**](https://github.com/features/ai/github-app) and [**GitHub Copilot**](https://github.com/features/copilot)
- [**microsoft/power-platform-skills**](https://github.com/microsoft/power-platform-skills)
- [**microsoft/Dataverse-skills**](https://github.com/microsoft/Dataverse-skills)
- [**microsoft/skills-for-copilot-studio**](https://github.com/microsoft/skills-for-copilot-studio) and [**microsoft/copilot-studio-plugin**](https://github.com/microsoft/copilot-studio-plugin)
- [**Entire**](https://entire.io/)
- [**GitHub stacked PRs**](https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/)

> [!NOTE]
> If you want to reproduce the demo setup quickly, use:
> - Documentation: [`docs/tech-stack-readiness.md`](docs/tech-stack-readiness.md)
> - Script (Windows/PowerShell): [`scripts/tech-stack-readiness.ps1`](scripts/tech-stack-readiness.ps1)
