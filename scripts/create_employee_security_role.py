"""
create_employee_security_role.py — Create the Poutine League "Employee" custom
security role in the poutineleaguecore solution, with least-privilege access:
Read (Global) on all public data, Create/Write/Append/AppendTo (Basic/own-only)
on Restaurant, Poutine Submission, Try, and Review.

Persisted as a schema-authoring artifact per the data-management skill's
artifact-persistence convention. Run once; re-running is idempotent (skips
role creation if it already exists).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from auth import get_client  # noqa: E402

SOLUTION_NAME = "poutineleaguecore"
ROLE_NAME = "Employee"

# PrivilegeDepth enum values (Web API requires the string name, not the
# integer): Basic (own/user), Local (business unit), Deep (BU + children),
# Global (organization-wide).
BASIC = "Basic"
GLOBAL = "Global"

# Tables that are fully public read (no create/write for employees) —
# system/admin/flow-managed.
READ_ONLY_GLOBAL_TABLES = [
    "rpo_Season",
    "rpo_Category",
    "rpo_SeasonResult",
    "rpo_SeasonResultEntry",
    "rpo_HallOfFameEntry",
]

# Tag: read globally, but employees need Append/AppendTo (Basic) to link tags
# to their own submissions (N:N association requires Append on both sides).
TAG_TABLE = "rpo_Tag"

# Tables employees actively create/own: read all (Global), but
# create/write/append/appendto restricted to their own records (Basic).
OWN_RECORD_TABLES = [
    "rpo_Restaurant",       # created inline when submitting a new place
    "rpo_PoutineSubmission",
    "rpo_Try",
    "rpo_Review",
]


def main():
    client = get_client("dv-security")

    # 1. Resolve root business unit.
    bus = client.records.list("businessunit", select=["businessunitid", "name"],
                               filter="parentbusinessunitid eq null")
    bu_id = bus[0]["businessunitid"]
    print(f"Root business unit: {bus[0]['name']} ({bu_id})")

    # 2. Create the role if it doesn't already exist.
    existing = client.records.list("role", select=["roleid", "name"],
                                    filter=f"name eq '{ROLE_NAME}'")
    if existing:
        role_id = existing[0]["roleid"]
        print(f"Role '{ROLE_NAME}' already exists ({role_id}) — skipping create.")
    else:
        role_id = client.records.create(
            "role",
            {
                "name": ROLE_NAME,
                "businessunitid@odata.bind": f"/businessunits({bu_id})",
            },
        )
        print(f"Created role '{ROLE_NAME}' ({role_id}).")

    # 3. Build the desired privilege name -> depth map.
    privilege_depth = {}
    for table in READ_ONLY_GLOBAL_TABLES:
        privilege_depth[f"prvRead{table}"] = GLOBAL
    privilege_depth[f"prvRead{TAG_TABLE}"] = GLOBAL
    privilege_depth[f"prvAppend{TAG_TABLE}"] = BASIC
    privilege_depth[f"prvAppendTo{TAG_TABLE}"] = BASIC
    for table in OWN_RECORD_TABLES:
        privilege_depth[f"prvRead{table}"] = GLOBAL
        privilege_depth[f"prvCreate{table}"] = BASIC
        privilege_depth[f"prvWrite{table}"] = BASIC
        privilege_depth[f"prvAppend{table}"] = BASIC
        privilege_depth[f"prvAppendTo{table}"] = BASIC
    # Employees must be able to see each other's names for attribution
    # (submitter, reviewer) — read-only, organization-wide.
    privilege_depth["prvReadUser"] = GLOBAL

    names = list(privilege_depth.keys())
    print(f"Resolving {len(names)} privilege GUIDs...")

    # 4. Resolve privilege GUIDs (query in chunks to keep filter length sane).
    resolved = {}
    chunk_size = 15
    for i in range(0, len(names), chunk_size):
        chunk = names[i:i + chunk_size]
        filter_expr = " or ".join(f"name eq '{n}'" for n in chunk)
        rows = client.records.list("privilege", select=["privilegeid", "name"],
                                    filter=filter_expr)
        for row in rows:
            resolved[row["name"]] = row["privilegeid"]

    missing = [n for n in names if n not in resolved]
    if missing:
        print(f"WARNING: could not resolve privileges: {missing}")

    # 5. Build the RolePrivilege payload for AddPrivilegesRole.
    role_privileges = [
        {"PrivilegeId": resolved[name], "Depth": depth}
        for name, depth in privilege_depth.items() if name in resolved
    ]

    artifact = {
        "role_name": ROLE_NAME,
        "role_id": role_id,
        "solution": SOLUTION_NAME,
        "business_unit_id": bu_id,
        "privilege_depth_by_name": privilege_depth,
        "resolved_privilege_ids": resolved,
        "missing_privileges": missing,
        "role_privileges_payload": role_privileges,
    }
    out_path = Path(__file__).resolve().parent.parent / "data" / "20260812_000000_create-employee-security-role.json"
    out_path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    print(f"Artifact written: {out_path}")
    print(f"ROLE_ID={role_id}")
    print(f"PRIVILEGE_COUNT={len(role_privileges)}")


if __name__ == "__main__":
    main()
