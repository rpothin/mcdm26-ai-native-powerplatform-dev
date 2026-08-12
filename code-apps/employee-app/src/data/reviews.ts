/**
 * Review lookup helpers (Phase 2, read-only). A Review is a star rating +
 * comment left after a Try — see ARCHITECTURE.md's data model. Review
 * *creation* is out of scope for this phase (Phase 3); this module only reads
 * existing Review rows so the Browse/detail views can surface ratings.
 */
import { listRows, type DataverseRow } from '../lib/dataverseClient';
import { ENTITY_SETS } from './constants';

export interface ReviewRow {
  rpo_reviewid: string;
  tryId: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  starRating: number;
  comment: string | null;
  helpfulnessScore: number | null;
  createdOn: string | null;
}

// Lookups must use their `_value`-suffixed logical name in $select — the plain
// schema name (e.g. `rpo_tryid`) throws "Could not find a property" at runtime
// (same bug fixed in Phase 1's submissions.ts, commit 9a2b0e8).
const REVIEW_SELECT = [
  'rpo_reviewid',
  '_rpo_tryid_value',
  '_rpo_reviewerid_value',
  'rpo_starrating',
  'rpo_comment',
  'rpo_helpfulnessscore',
  'createdon',
];

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

function toReviewRow(row: DataverseRow): ReviewRow {
  return {
    rpo_reviewid: String(row.rpo_reviewid),
    tryId: (row._rpo_tryid_value as string | null | undefined) ?? null,
    reviewerId: (row._rpo_reviewerid_value as string | null | undefined) ?? null,
    reviewerName:
      (row['_rpo_reviewerid_value@OData.Community.Display.V1.FormattedValue'] as string | undefined) ?? null,
    starRating: (row.rpo_starrating as number | undefined) ?? 0,
    comment: (row.rpo_comment as string | null | undefined) ?? null,
    helpfulnessScore: (row.rpo_helpfulnessscore as number | null | undefined) ?? null,
    createdOn: (row.createdon as string | null | undefined) ?? null,
  };
}

/**
 * List all Review rows pointing at any of the given Try ids. Reviews link to
 * PoutineSubmission indirectly via Try, so callers first resolve the Try ids
 * for a submission (see {@link listTriesForSubmissions} in `./tries`) and pass
 * them here.
 */
export async function listReviewsForTries(tryIds: string[]): Promise<ReviewRow[]> {
  if (tryIds.length === 0) return [];
  const filter = tryIds.map((id) => `_rpo_tryid_value eq '${escapeODataString(id)}'`).join(' or ');
  const rows = await listRows(ENTITY_SETS.reviews, {
    select: REVIEW_SELECT,
    filter,
    orderBy: ['createdon desc'],
  });
  return rows.map(toReviewRow);
}
