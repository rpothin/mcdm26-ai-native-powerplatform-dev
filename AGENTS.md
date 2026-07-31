# AGENTS.md

Demo companion repo for "AI-Native Power Platform Development: Building from the IDE" (Microsoft Community Days Montreal 2026) — demonstrates an IDE-centred, AI-assisted workflow spanning Copilot Studio agents, Power Apps code apps, and Power Platform solution ALM.

## Commands

File-scoped (prefer for fast feedback):

```sh
npm run lint -- <path>   # lint one file inside a code app directory
npm test -- <path>       # test one file inside a code app directory
npx tsc --noEmit <path>  # typecheck one file
```

Full suite (only when asked):

```sh
make lint      # ESLint across all code-apps/*/
make test      # unit tests across all code-apps/*/
make build     # build all code-apps/*/
make validate  # make lint + pac solution pack structural check for every solution under solutions/
```

Solution pack / unpack:

```sh
pac solution unpack --zipfile <file>.zip --folder solutions/<name>
pac solution pack   --folder solutions/<name> --zipfile <file>.zip --processCanvasApps
```

Other:

```sh
pac auth create --environment <env-url>  # authenticate PAC CLI to a target environment
pac code push                            # deploy a code app (run make lint first)
```

## Stack

- Power Platform CLI (`pac`) 2.9.3+ (tested 2.10.1)
- Node.js 22.x · npm 11.x
- Azure CLI 2.88.0+ · Azure Developer CLI (`azd`) 1.29.0+
- GitHub CLI 2.96.0+ · gh-stack 0.1.0+ · Entire CLI 0.9.0+
- Code apps: React + Vite (planned under `code-apps/`, not yet scaffolded)
- CI/CD: GitHub Actions with OIDC auth — no long-lived secrets in workflow

## Skill routing

Always invoke the matching project-level orchestrator skill — never implement cross-skill work by hand:

| Task area | Skill |
|---|---|
| Dataverse schema, records, solutions, security, environment admin | `data-management` |
| Copilot Studio agent authoring, review, testing, ALM | `agent-implementation` |
| Power Apps code app (scaffold, connectors, lint, deploy) | `app-implementation` |
| Power Automate cloud flows (create, debug, manage) | `backend-process-implementation` |

## Boundaries

- ✅ Always: work on unpacked solution folders under `solutions/` — never touch packed `.zip` files directly.
- ✅ Always: keep connection references and environment variable values in `solutions/<name>/deployment-settings.json`.
- ✅ Always: run `make lint` before `pac code push` for code apps.
- ✅ Always: leave generated TypeScript under `src/generated/` untouched — connector skills regenerate it.
- ✅ Always: all changes go through PRs — never commit directly to `main`.
- ⚠️ Ask first: adding a premium Power Platform connector (DLP policy implications).
- ⚠️ Ask first: enabling a flow in a production environment.
- ⚠️ Ask first: importing a solution to any shared or non-dev environment.
- ⚠️ Ask first: renaming a solution component's `SchemaName` — breaks downstream references.
- ⚠️ Ask first: editing `.github/workflows/deploy-solution.yml` or any other pipeline YAML.
- 🚫 Never: hand-edit a packed solution `.zip` or the `customizations.xml` inside it.
- 🚫 Never: commit real connection reference IDs, environment IDs, or service-principal secrets.
- 🚫 Never: run `pac solution import` against a shared environment from a local machine.
- 🚫 Never: hand-edit anything under `src/generated/` in code apps.
- 🚫 Never: author Copilot Studio YAML without first routing through the `agent-implementation` skill (enforces advisor-before-author).

## Progressive-disclosure pointers

- Read `docs/tech-stack-readiness.md` before setting up the toolchain or validating installed versions — it covers exact baseline versions and the automated readiness script.
- Read `agent_docs/environments.md` (stub — create when environment map is documented) before touching environment-specific config or deployment settings.
- Read `agent_docs/pipelines.md` (stub — create when pipeline docs are ready) before modifying the deployment workflow.
