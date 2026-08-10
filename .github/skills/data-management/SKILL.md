---
name: data-management
description: >
  Orchestrates all Dataverse work in a Power Platform project by routing to the
  correct sub-skill from the installed `dataverse` plugin (microsoft/Dataverse-skills).
  Use when working on any task involving Dataverse tables, records, solutions, security, or
  environment administration: schema authoring, record CRUD, bulk imports, solution lifecycle,
  role assignments, bulk delete, and org settings.
  Do NOT use for Power Apps code app wiring (use app-implementation), Power Automate flows
  (use backend-process-implementation), or Copilot Studio agents (use agent-implementation).
---

# data-management

Orchestration layer for all Dataverse operations in this project.
Always load `dv-overview` first — it provides cross-cutting safety rules, the tool-capability
map, and the safe-change lifecycle that every other sub-skill depends on.

## Step 0 — Dependency preflight (required)

Before routing any task, verify the `dataverse` plugin sub-skills are available:
`dv-overview`, `dv-connect`, `dv-query`, `dv-data`, `dv-metadata`, `dv-solution`,
`dv-admin`, and `dv-security`.

If any required sub-skill is missing or unavailable:
1. Stop execution and return a blocked status.
2. Ask the user whether they want to install or enable the missing dependency.
3. Resume only after availability is confirmed.

Do not attempt Dataverse work through ad-hoc fallback logic when these dependencies are missing.

## Step 1 — Environment and solution scope gate (required)

Before any Dataverse work starts, the target scope must be explicit:
- Environment: display name and environment ID (or URL)
- Solution: unique name and publisher prefix

If either environment or solution is missing, ambiguous, or inferred:
1. Stop execution and return a blocked status.
2. Ask the user to explicitly provide the target environment and solution.
3. Resume only after both are confirmed.

Do not proceed using defaults, recent-session guesses, or partial scope values.

## Source of truth for schema

Before authoring or modifying any table, column, or relationship, consult `ARCHITECTURE.md` §1
(Data model) at the repo root — it defines the confirmed Poutine League entities (Restaurant,
Poutine Submission, Tag, Try, Review, Season, Category, Season Result, Hall of Fame Entry),
their key fields, and the ER diagram. Treat it as the schema source of truth rather than
re-deriving the data model from the task description. If a task requires a schema change not
reflected there, flag the divergence and propose an `ARCHITECTURE.md` update per its human-owned
governance (see root `AGENTS.md`) before proceeding.

## Sub-skill routing

| Task | Sub-skill |
|------|-----------|
| First step of any Dataverse session | `dv-overview` |
| Connection missing, auth broken, MCP not responding | `dv-connect` |
| Read, filter, paginate, aggregate records | `dv-query` |
| Create / update / delete records; CSV import; bulk ops; seed data | `dv-data` |
| Author tables, columns, relationships, forms, views | `dv-metadata` |
| Create, export, import, promote solutions across environments | `dv-solution` |
| Bulk delete, retention/archival, org settings, recycle bin, audit | `dv-admin` |
| Security roles, users, business units, app user registration | `dv-security` |

Read `references/sub-skill-detail.md` when you need parameter-level guidance for a specific
sub-skill call.

## Project conventions (mandatory)

### 1 — Solution-first schema changes
All schema changes (new tables, columns, relationships, forms, views) **must** be encapsulated
inside a Dataverse solution before they are applied to any environment.
Never apply raw, unpackaged schema changes directly to an environment.

Before creating any table or column, call `dv-metadata` with a check-first instruction:
query whether a managed solution already defines that component in the target environment.
If it does, work with the existing component rather than creating a duplicate.

### 2 — Sequencing for mixed tasks
When a task spans schema changes **and** data operations **and** solution lifecycle:

```
1. Schema changes via dv-metadata
2. Validate (run dv-overview safe-change checklist)
3. Pack / export solution via dv-solution
4. Data operations via dv-data
```

Never run data operations against schema that has not yet been promoted into a solution.

### 3 — Destructive operations require human confirmation
`dv-admin` bulk-delete and archival operations **must** receive explicit human confirmation
before execution. Present the scope (table, filter, estimated row count) and wait for approval.
Do not self-approve bulk deletes even when operating in autopilot mode.

### 5 — Artifact persistence for data and schema operations

Every artifact generated during a session that **modifies data or the data model** must be
saved to the `data/` directory at the repo root before execution. This includes:
- FetchXML / OData queries used to write, update, or delete records
- CSV files for bulk import
- Schema definition scripts (column, table, or relationship specs passed to `dv-metadata`)
- Bulk-delete filters passed to `dv-admin`

Read-only queries (exploration, filtering, reporting) do not require persistence unless the
user explicitly requests it.

**Naming convention:** `YYYYMMDD_HHMMSS_<short-description>.<ext>`

Examples:
- `20260731_142055_add-account-industry-column.json`
- `20260731_151230_bulk-import-contacts.csv`
- `20260731_163400_delete-orphan-activity-records.fetchxml`

The Dataverse sub-skills generate and execute their own artifacts autonomously — typically
Python scripts using the official Dataverse Python SDK (`PowerPlatform-Dataverse-Client`),
CSV files, or other payloads. The orchestrator must not pre-write these artifacts.

After the sub-skill generates an artifact, **save or copy it to `data/`** using the naming
convention above. If the operation succeeded, leave the file as-is. If it failed, append
`_FAILED` to the filename so the failure is traceable without ambiguity.

### 4 — Environment targeting

Always confirm the target environment before any write operation. Use `dv-connect` to verify
the active connection. Surface the environment display name and URL in your response so the
human can catch mis-targeting before changes land.

## Decision tree

```
Dataverse task received
  └─ Dependency preflight
       ├─ Missing dependency? → ask to install/enable → stop until resolved
       └─ Scope gate (environment + solution explicit)
            ├─ Missing or ambiguous? → ask user → stop until resolved
            └─ Load dv-overview (always)
                 ├─ Connection broken? → dv-connect, then retry
                 ├─ Read-only query? → dv-query
                 ├─ Record write (CRUD / import)?
                 │    ├─ Schema missing? → dv-metadata first (see §2 sequencing)
                 │    └─ dv-data → save generated artifact to data/ (YYYYMMDD_HHMMSS_desc.ext)
                 ├─ Schema authoring?
                 │    └─ Check managed solutions → dv-metadata → save generated artifact to data/
                 ├─ Solution lifecycle? → dv-solution
                 ├─ Security / roles? → dv-security
                 └─ Bulk delete / org settings?
                      └─ confirm human → dv-admin → save generated artifact to data/
```

## Escape hatches

- If `dv-metadata` and `dv-solution` are both needed in a single session, keep a running
  checklist of components added so the solution export includes all of them.
- If the environment has no Dataverse instance, `dv-overview` will surface a warning — stop
  and report to the user rather than continuing with PPAPI-only fallback for schema work.
