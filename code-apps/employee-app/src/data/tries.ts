/**
 * Try lookup helpers (Phase 2, read-only). A Try is an employee's honor-system
 * self-declaration that they tried a poutine — see ARCHITECTURE.md's data model.
 * Try *creation* is out of scope for this phase (Phase 3); this module only
 * reads existing Try rows so the Browse/detail views can surface try counts.
 */
import { listRows, type DataverseRow } from '../lib/dataverseClient';
import { ENTITY_SETS } from './constants';

export interface TryRow {
  rpo_tryid: string;
  poutineSubmissionId: string | null;
  employeeId: string | null;
  employeeName: string | null;
  triedOn: string | null;
}

// Lookups must use their `_value`-suffixed logical name in $select — the plain
// schema name (e.g. `rpo_poutinesubmissionid`) throws "Could not find a property"
// at runtime (same bug fixed in Phase 1's submissions.ts, commit 9a2b0e8).
const TRY_SELECT = ['rpo_tryid', '_rpo_poutinesubmissionid_value', '_rpo_employeeid_value', 'rpo_triedon'];

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

function toTryRow(row: DataverseRow): TryRow {
  return {
    rpo_tryid: String(row.rpo_tryid),
    poutineSubmissionId: (row._rpo_poutinesubmissionid_value as string | null | undefined) ?? null,
    employeeId: (row._rpo_employeeid_value as string | null | undefined) ?? null,
    employeeName:
      (row['_rpo_employeeid_value@OData.Community.Display.V1.FormattedValue'] as string | undefined) ?? null,
    triedOn: (row.rpo_triedon as string | null | undefined) ?? null,
  };
}

/**
 * List all Try rows pointing at any of the given PoutineSubmission ids.
 * Used to compute try counts for the Browse feed and to resolve the Try ids
 * needed to fetch the Reviews tied to a submission (Review only links to Try,
 * not directly to PoutineSubmission — see rpo_Review's schema).
 */
export async function listTriesForSubmissions(submissionIds: string[]): Promise<TryRow[]> {
  if (submissionIds.length === 0) return [];
  const filter = submissionIds
    .map((id) => `_rpo_poutinesubmissionid_value eq '${escapeODataString(id)}'`)
    .join(' or ');
  const rows = await listRows(ENTITY_SETS.tries, {
    select: TRY_SELECT,
    filter,
    orderBy: ['rpo_triedon desc'],
  });
  return rows.map(toTryRow);
}
