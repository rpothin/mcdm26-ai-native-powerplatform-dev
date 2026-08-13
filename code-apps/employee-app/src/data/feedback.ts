/**
 * Aggregates Try/Review data per PoutineSubmission for the Browse feed and
 * detail view (Phase 2). Read-only: Try/Review *creation* is Phase 3.
 */
import { listTriesForSubmissions, type TryRow } from './tries';
import { listReviewsForTries, type ReviewRow } from './reviews';

export interface SubmissionAggregate {
  tryCount: number;
  reviewCount: number;
  /** Simple (unweighted) average of star ratings, or null when there are no reviews yet. */
  averageRating: number | null;
}

function emptyAggregate(): SubmissionAggregate {
  return { tryCount: 0, reviewCount: 0, averageRating: null };
}

/**
 * Computes try count / review count / average rating for each of the given
 * submission ids in just two Dataverse round-trips (all Tries for the set,
 * then all Reviews for those Tries), regardless of how many submissions are
 * passed in — appropriate at this app's demo scale.
 */
export async function getAggregatesForSubmissions(
  submissionIds: string[],
): Promise<Map<string, SubmissionAggregate>> {
  const aggregates = new Map<string, SubmissionAggregate>();
  for (const id of submissionIds) aggregates.set(id, emptyAggregate());
  if (submissionIds.length === 0) return aggregates;

  const tries = await listTriesForSubmissions(submissionIds);
  const tryIdToSubmissionId = new Map<string, string>();
  for (const t of tries) {
    if (!t.poutineSubmissionId) continue;
    const agg = aggregates.get(t.poutineSubmissionId);
    if (agg) agg.tryCount += 1;
    tryIdToSubmissionId.set(t.rpo_tryid, t.poutineSubmissionId);
  }

  const tryIds = tries.map((t) => t.rpo_tryid);
  const reviews = await listReviewsForTries(tryIds);
  const ratingSums = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const submissionId = r.tryId ? tryIdToSubmissionId.get(r.tryId) : undefined;
    if (!submissionId) continue;
    const agg = aggregates.get(submissionId);
    if (agg) agg.reviewCount += 1;
    const bucket = ratingSums.get(submissionId) ?? { sum: 0, count: 0 };
    bucket.sum += r.starRating;
    bucket.count += 1;
    ratingSums.set(submissionId, bucket);
  }
  for (const [submissionId, bucket] of ratingSums) {
    const agg = aggregates.get(submissionId);
    if (agg && bucket.count > 0) agg.averageRating = bucket.sum / bucket.count;
  }

  return aggregates;
}

export interface SubmissionFeedback {
  tries: TryRow[];
  reviews: ReviewRow[];
}

/** Fetches every Try and Review tied to a single submission, for the detail view. */
export async function getFeedbackForSubmission(submissionId: string): Promise<SubmissionFeedback> {
  const tries = await listTriesForSubmissions([submissionId]);
  const tryIds = tries.map((t) => t.rpo_tryid);
  const reviews = await listReviewsForTries(tryIds);
  return { tries, reviews };
}

/**
 * Derives the same {@link SubmissionAggregate} shape as
 * {@link getAggregatesForSubmissions}, but from an already-fetched
 * {@link SubmissionFeedback} for a single submission (no extra Dataverse
 * round-trip). Used by the SubmissionDetail view (Phase 3) to refresh its own
 * try count / review count / average rating right after logging a Try or
 * submitting a Review, and to propagate that update back up to the Browse
 * feed's aggregate map without refetching every submission.
 */
export function aggregateFromFeedback(feedback: SubmissionFeedback): SubmissionAggregate {
  const tryCount = feedback.tries.length;
  const reviewCount = feedback.reviews.length;
  const averageRating =
    reviewCount > 0 ? feedback.reviews.reduce((sum, r) => sum + r.starRating, 0) / reviewCount : null;
  return { tryCount, reviewCount, averageRating };
}
