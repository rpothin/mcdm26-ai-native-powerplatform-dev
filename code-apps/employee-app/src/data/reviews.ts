/**
 * Review lookup + creation helpers. A Review is a star rating + comment left
 * after a Try — see ARCHITECTURE.md's data model. Phase 2 added the read-only
 * lookups below; Phase 3 adds `getReviewForTryAndReviewer` + `createReview` so
 * the SubmissionDetail view can let an employee leave a review after a Try.
 */
import { createRow, listRows, type DataverseRow } from '../lib/dataverseClient';
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

/**
 * Finds an existing Review left by this reviewer on this Try, if any.
 *
 * See memory-bank.md's Phase 3 "one review per employee per poutine" decision:
 * combined with "one Try per employee per submission" (see `./tries`), checking
 * per-Try is equivalent to checking per-employee-per-submission, and avoids a
 * second round-trip to re-resolve the submission id from the Try. The schema
 * has no alternate key enforcing this, so this check-then-create pattern is the
 * enforcement mechanism (same convention as the submission cap / Try dedup).
 */
export async function getReviewForTryAndReviewer(tryId: string, reviewerId: string): Promise<ReviewRow | null> {
  const rows = await listRows(ENTITY_SETS.reviews, {
    select: REVIEW_SELECT,
    filter:
      `_rpo_tryid_value eq '${escapeODataString(tryId)}' ` +
      `and _rpo_reviewerid_value eq '${escapeODataString(reviewerId)}'`,
    top: 1,
  });
  return rows.length > 0 ? toReviewRow(rows[0]) : null;
}

export interface CreateReviewInput {
  tryId: string;
  reviewerId: string;
  /** 1-5, required (matches the `rpo_starrating` schema-required field). */
  starRating: number;
  /** Optional written comment (schema-optional, but product intent is a review = rating + comment). */
  comment: string | null;
}

/**
 * Creates a Review tied to a Try. Callers should check
 * {@link getReviewForTryAndReviewer} first and refuse a second review instead
 * of calling this again — it is not re-checked here, following the same
 * "caller enforces, function stays a single atomic call" convention as
 * `src/data/submissions.ts#createSubmission`.
 */
export async function createReview(input: CreateReviewInput): Promise<ReviewRow> {
  if (!Number.isInteger(input.starRating) || input.starRating < 1 || input.starRating > 5) {
    throw new Error('Star rating must be a whole number between 1 and 5.');
  }
  const comment = input.comment?.trim() || null;
  const created = await createRow(ENTITY_SETS.reviews, {
    'rpo_tryid@odata.bind': `/${ENTITY_SETS.tries}(${input.tryId})`,
    'rpo_reviewerid@odata.bind': `/${ENTITY_SETS.systemUsers}(${input.reviewerId})`,
    rpo_starrating: input.starRating,
    rpo_comment: comment,
  });
  return {
    rpo_reviewid: String(created.rpo_reviewid),
    tryId: input.tryId,
    reviewerId: input.reviewerId,
    reviewerName: null,
    starRating: input.starRating,
    comment,
    helpfulnessScore: null,
    createdOn: new Date().toISOString(),
  };
}
