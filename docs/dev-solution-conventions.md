# Dev environment & solution conventions

This document is the source of truth for the **human-chosen, stable names** used by the
Poutine League Dev solution. System-generated GUIDs (environment ID/URL, solution ID) are
**not** stored here — they live in GitHub repository variables (see below) because they are
instance-specific and never chosen by us.

## Stable names (safe to commit)

| Concept | Value |
|---|---|
| Publisher display name | Raphael Pothin |
| Publisher unique name | `rpothin` |
| Publisher prefix | `rpo` |
| Solution display name | Poutine League Core |
| Solution unique name | `poutineleaguecore` |
| Local solution folder | `solutions/poutineleaguecore/` |

> [!NOTE]
> The publisher prefix (`rpo`) is effectively permanent — every custom table, column, and
> relationship created under this solution keeps this prefix forever, even if the publisher
> is changed later. Never mix prefixes within the same solution.

## System-generated GUIDs (GitHub repository variables)

These are stored as [GitHub repository variables](https://docs.github.com/en/actions/learn-github-actions/variables)
on `rpothin/mcdm26-ai-native-powerplatform-dev` — never committed to tracked files.

| Variable | Meaning | Consumed by |
|---|---|---|
| `DEV_ENVIRONMENT_URL` | Dev environment org URL | `pac`, `dataverse` CLI, `dv-solution`/`dv-connect` skills |
| `DEV_ENVIRONMENT_ID` | Dev environment ID (GUID) | Power Automate `flowagent`/`route-environments` tooling |
| `DEV_SOLUTION_ID` | `solutionid` GUID for `poutineleaguecore` | Any tooling that needs the solution record directly (vs. by unique name) |

Resolve them in any session with:

```powershell
gh variable get DEV_ENVIRONMENT_URL --repo rpothin/mcdm26-ai-native-powerplatform-dev
gh variable get DEV_ENVIRONMENT_ID  --repo rpothin/mcdm26-ai-native-powerplatform-dev
gh variable get DEV_SOLUTION_ID     --repo rpothin/mcdm26-ai-native-powerplatform-dev
```

## Local connection scaffold

A `dv-connect`-managed `.env` (gitignored) and `scripts/auth.py` (committed) provide Dataverse
SDK/CLI/MCP access for a given developer's machine. `.env` is per-machine and re-derivable from
the values in this document plus the GitHub variables above — never commit it.

## Versioning ([Semantic Versioning](https://semver.org/))

The `poutineleaguecore` solution version follows SemVer, mapped onto Dataverse's mandatory
4-segment `Major.Minor.Build.Revision` format (SemVer only defines `MAJOR.MINOR.PATCH`):

| SemVer | Dataverse segment | Bump when |
|---|---|---|
| `MAJOR` | Major | Breaking change — removed/renamed component, breaking schema change |
| `MINOR` | Minor | New backward-compatible feature — new table, column, flow, agent, app |
| `PATCH` | Build (3rd segment) | Backward-compatible fix |
| *(none — SemVer has no 4th part)* | Revision (4th segment) | Always `0`; required by Dataverse's format but has no SemVer meaning |

Current version: `1.0.0.0` (initial release — MAJOR=1, MINOR=0, PATCH=0, Revision=0).

Bump the version **in the Dev environment first** (source of truth for the live solution
record), then re-sync locally so `solutions/poutineleaguecore/Other/Solution.xml` picks up the
change — never hand-edit that file directly:

```powershell
pac solution online-version --environment $(gh variable get DEV_ENVIRONMENT_URL --repo rpothin/mcdm26-ai-native-powerplatform-dev) --solution-name poutineleaguecore --solution-version <Major.Minor.Patch.0>
```

See the `solution-management` skill's "Solution versioning" section for the full workflow.

## Why this split?

- **GUIDs** are system-generated, effectively per-environment-instance, and would be
  meaningless (or wrong) if the solution/environment were ever recreated — they belong in
  GitHub repo variables, mirroring the existing `PROD_ENVIRONMENT_URL` pattern already used in
  `.github/workflows/deploy-solution.yml`.
- **Names/prefixes** are design-time decisions we made once; they aren't secrets, and the
  solution unique name is visible anyway once the solution is cloned to `solutions/<name>/`.
  Documenting them here means a fresh session (or a new contributor) doesn't have to guess or
  re-derive them from Dataverse.
