/**
 * Try lookup + creation helpers. A Try is an employee's honor-system
 * self-declaration that they tried a poutine — see ARCHITECTURE.md's data model.
 * Phase 2 added the read-only lookups below; Phase 3 adds `getTryForEmployee` +
 * `createTry` so the SubmissionDetail view can let an employee log a Try.
 */
import { createRow, listRows, type DataverseRow } from '../lib/dataverseClient';
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

/**
 * Finds the given employee's existing Try for a submission, if any.
 *
 * See memory-bank.md's Phase 3 "one Try per employee per submission" decision:
 * the schema doesn't enforce this (no alternate key), but callers use this
 * check-then-create pattern (mirroring the submission-cap guard in
 * `src/data/submissions.ts`) to keep "logging a try" idempotent per employee,
 * so leaderboard/aggregate counts stay honest.
 */
export async function getTryForEmployee(submissionId: string, employeeId: string): Promise<TryRow | null> {
  const rows = await listRows(ENTITY_SETS.tries, {
    select: TRY_SELECT,
    filter:
      `_rpo_poutinesubmissionid_value eq '${escapeODataString(submissionId)}' ` +
      `and _rpo_employeeid_value eq '${escapeODataString(employeeId)}'`,
    top: 1,
  });
  return rows.length > 0 ? toTryRow(rows[0]) : null;
}

export interface CreateTryInput {
  submissionId: string;
  employeeId: string;
}

/**
 * Logs a Try for the given employee/submission. Callers should check
 * {@link getTryForEmployee} first and reuse the existing row instead of calling
 * this again — it is not re-checked here, following the same "caller enforces,
 * function stays a single atomic call" convention as
 * `src/data/submissions.ts#createSubmission`.
 */
export async function createTry(input: CreateTryInput): Promise<TryRow> {
  const triedOn = new Date().toISOString();
  const created = await createRow(ENTITY_SETS.tries, {
    'rpo_poutinesubmissionid@odata.bind': `/${ENTITY_SETS.poutineSubmissions}(${input.submissionId})`,
    'rpo_employeeid@odata.bind': `/${ENTITY_SETS.systemUsers}(${input.employeeId})`,
    rpo_triedon: triedOn,
  });
  return {
    rpo_tryid: String(created.rpo_tryid),
    poutineSubmissionId: input.submissionId,
    employeeId: input.employeeId,
    employeeName: null,
    triedOn,
  };
}
