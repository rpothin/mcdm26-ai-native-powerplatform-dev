---
name: agent-implementation
description: >
  Orchestrates Copilot Studio agent work in a Power Platform project,
  routing across the two installed Copilot Studio plugin sets: `copilot-studio`
  (microsoft/skills-for-copilot-studio) and `mcs-assistant`
  (microsoft/copilot-studio-plugin).   Use when working on any task involving Copilot Studio agents:
  cloning, describing, designing topics/actions/knowledge, authoring YAML, pushing,
  publishing, and testing. Triggers on: build agent, create topic, add knowledge source,
  add action, modify agent, publish agent, test agent, troubleshoot agent behavior.
  Do NOT use for Power Automate flows (use backend-process-implementation), Power Apps
  code apps (use app-implementation), or Dataverse schema work alone (use data-management).
---

# agent-implementation

Orchestration layer for all Copilot Studio agent work in this project.
Two plugin sets are installed and each covers different agent architectures — this skill
tells you which to use and when.

## Step 0 — Dependency preflight (required)

Before any clone, design, authoring, publish, or test action, verify both plugin sets are
available and callable:
- `copilot-studio` (`copilot-studio-manage`, `copilot-studio-author`,
  `copilot-studio-test`, `copilot-studio-advisor`)
- `mcs-assistant` (`copilot-studio-architect`, `copilot-studio-describer`,
  `copilot-studio-init`, `copilot-studio-manage`)

If the required plugin or sub-agent for the next step is missing or unavailable:
1. Stop execution and return a blocked status.
2. Ask the user whether they want to install or enable the missing dependency.
3. Resume only after availability is confirmed.

Do not attempt Copilot Studio authoring or troubleshooting through generic YAML edits when the
specialized sub-agents are unavailable.

## Step 1 — Environment and solution scope gate (required)

Before any Copilot Studio work starts, require explicit target scope:
- Environment: display name and environment ID (or URL)
- Solution: unique name and publisher prefix for the solution that owns the agent changes

If either environment or solution is missing, ambiguous, or inferred:
1. Stop execution and return a blocked status.
2. Ask the user to explicitly provide the target environment and solution.
3. Resume only after both are confirmed.

Do not clone, describe, or author against an implicit environment/solution target.

## Installed plugins

| Plugin | Sub-agents | Best for |
|--------|-----------|----------|
| `copilot-studio` (skills-for-copilot-studio) | `copilot-studio-manage`, `copilot-studio-author`, `copilot-studio-test`, `copilot-studio-advisor` | Classic (standard) agents; topic/action/knowledge authoring |
| `mcs-assistant` (copilot-studio-plugin) | `copilot-studio-architect`, `copilot-studio-describer`, `copilot-studio-init`, `copilot-studio-manage` | Enhanced (new agentic loop) agents; architecture, migration, init |

## Standard lifecycle

```
dependency preflight → scope gate → clone (manage) → describe (mcs-assistant:describer)
  → design (advisor) → author → push (manage) → publish (manage) → test
```

Never skip the describe or design steps for non-trivial changes.

## Source of truth for which agents to build

Before designing or authoring any agent, consult `ARCHITECTURE.md` §2 (AI agentic experiences)
at the repo root — it defines the required agent set: one interactive conversational agent
(embedded in the employee code app + published to Microsoft 365 Copilot) plus three specialized
headless backend agents (Submission Review, Fun Facts, Review Quality), each on the GitHub
Copilot harness. §3 also documents the submission-review escalation design and flags that
Copilot Studio Workflows/the Request for Information node are a future exploration, not yet
supported by the installed plugins — don't attempt to build against that pattern until the
open question is resolved.

## Step-by-step routing

### Step 2 — Ensure a local agent exists
Check for `agents/<agent-name>/agent.mcs.yml`.
- Found → proceed.
- Missing **and** task is new agent → run `mcs-assistant:copilot-studio-init` to initialize,
  then clone with the appropriate manage sub-agent.
- Missing **and** task modifies existing agent → clone with `copilot-studio:copilot-studio-manage`
  (or `mcs-assistant:copilot-studio-manage`) before any authoring.

Authoring without a local `agent.mcs.yml` is not supported — never write YAML into an empty
folder and hope to push it.

### Step 3 — Identify agent type
Run `mcs-assistant:copilot-studio-describer` on the cloned agent.
- **Classic / standard agent** → use `copilot-studio` plugin for authoring.
- **Enhanced / new agentic loop agent** → use `mcs-assistant` plugin for authoring.

This check is mandatory before first authoring in any session. Skipping it risks writing
incompatible YAML.

### Step 4 — Design before authoring
For any non-trivial change (new topic, action, knowledge source, or behavioral modification),
run `copilot-studio:copilot-studio-advisor` first.
The advisor surfaces relevant patterns and known pitfalls. Present its recommendations to the
user and get explicit approval before proceeding to authoring.

Trivial exceptions (typo fix, description update, metadata-only change) may skip the advisor.

### Step 5 — Author
Route to the correct authoring sub-agent based on agent type (Step 3).
Agent files live under `agents/<agent-name>/` — do not create or edit files outside this path.

### Step 6 — Push and publish
After authoring, run the manage sub-agent to push changes to the environment, then publish
the draft. Changes are not testable until published.

### Step 7 — Test
Always use `copilot-studio:copilot-studio-test`. This includes:
- Creating test set CSVs for in-product evaluation
- Running batch test suites via the Copilot Studio Kit
- Point-testing via DirectLine or SDK

Never rely on informal manual browser testing as the sole validation.

## Project conventions

- Agent folders: `agents/<agent-name>/` — one folder per agent, all files inside.
- These instructions take precedence over individual plugin documentation when they conflict.
- Do not hardcode environment IDs or agent IDs in YAML files — use connection settings.
- After any architectural change (new orchestration pattern, agentic loop restructure), run
  `mcs-assistant:copilot-studio-describer` again to verify the result matches intent.

## Routing quick-reference

```
Task received
  └─ Dependency preflight
       ├─ Missing dependency? → ask to install/enable → stop until resolved
       └─ Scope gate (environment + solution explicit)
            ├─ Missing or ambiguous? → ask user → stop until resolved
            └─ Local agent.mcs.yml present?
                 ├─ No, new agent → mcs-assistant:init → manage:clone
                 └─ No, existing agent → manage:clone
                 └─ Yes → mcs-assistant:describer (identify type)
                      └─ Design review needed? → copilot-studio:advisor
                           └─ Author (route by type)
                                └─ manage:push → manage:publish → copilot-studio:test
```

Read `references/plugin-selection.md` when you need detailed guidance on choosing between
`copilot-studio` and `mcs-assistant` sub-agents for edge cases.
