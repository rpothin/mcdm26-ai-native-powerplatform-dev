---
name: agent-implementation
description: >
  Orchestrates Copilot Studio agent work in the mcdm26 Power Platform demo project,
  routing across the two installed Copilot Studio plugin sets: `copilot-studio`
  (microsoft/skills-for-copilot-studio) and `mcs-assistant`
  (microsoft/copilot-studio-plugin). Use for any task involving Copilot Studio agents:
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

## Installed plugins

| Plugin | Sub-agents | Best for |
|--------|-----------|----------|
| `copilot-studio` (skills-for-copilot-studio) | `copilot-studio-manage`, `copilot-studio-author`, `copilot-studio-test`, `copilot-studio-advisor` | Classic (standard) agents; topic/action/knowledge authoring |
| `mcs-assistant` (copilot-studio-plugin) | `copilot-studio-architect`, `copilot-studio-describer`, `copilot-studio-init`, `copilot-studio-manage` | Enhanced (new agentic loop) agents; architecture, migration, init |

## Standard lifecycle

```
clone (manage) → describe (mcs-assistant:describer) → design (advisor)
  → author → push (manage) → publish (manage) → test
```

Never skip the describe or design steps for non-trivial changes.

## Step-by-step routing

### Step 1 — Ensure a local agent exists
Check for `agents/<agent-name>/agent.mcs.yml`.
- Found → proceed.
- Missing **and** task is new agent → run `mcs-assistant:copilot-studio-init` to initialize,
  then clone with the appropriate manage sub-agent.
- Missing **and** task modifies existing agent → clone with `copilot-studio:copilot-studio-manage`
  (or `mcs-assistant:copilot-studio-manage`) before any authoring.

Authoring without a local `agent.mcs.yml` is not supported — never write YAML into an empty
folder and hope to push it.

### Step 2 — Identify agent type
Run `mcs-assistant:copilot-studio-describer` on the cloned agent.
- **Classic / standard agent** → use `copilot-studio` plugin for authoring.
- **Enhanced / new agentic loop agent** → use `mcs-assistant` plugin for authoring.

This check is mandatory before first authoring in any session. Skipping it risks writing
incompatible YAML.

### Step 3 — Design before authoring
For any non-trivial change (new topic, action, knowledge source, or behavioral modification),
run `copilot-studio:copilot-studio-advisor` first.
The advisor surfaces relevant patterns and known pitfalls. Present its recommendations to the
user and get explicit approval before proceeding to authoring.

Trivial exceptions (typo fix, description update, metadata-only change) may skip the advisor.

### Step 4 — Author
Route to the correct authoring sub-agent based on agent type (Step 2).
Agent files live under `agents/<agent-name>/` — do not create or edit files outside this path.

### Step 5 — Push and publish
After authoring, run the manage sub-agent to push changes to the environment, then publish
the draft. Changes are not testable until published.

### Step 6 — Test
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
