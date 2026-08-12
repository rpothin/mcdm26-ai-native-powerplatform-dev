import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import type { RestaurantRow } from '../../data/restaurants';
import { getRestaurantById } from '../../data/restaurants';
import type { PoutineSubmissionRow } from '../../data/submissions';
import { getSubmissionWithPhoto } from '../../data/submissions';
import {
  aggregateFromFeedback,
  getFeedbackForSubmission,
  type SubmissionAggregate,
  type SubmissionFeedback,
} from '../../data/feedback';
import { createTry, getTryForEmployee } from '../../data/tries';
import { createReview, getReviewForTryAndReviewer } from '../../data/reviews';
import { getCurrentUser, type CurrentUser } from '../../data/currentUser';
import '../TagMultiSelect/TagMultiSelect.css';
import '../StatusBadge/StatusBadge.css';
import './SubmissionDetail.css';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
  /**
   * Called after a Try or Review is successfully created, with the freshly
   * recomputed aggregate for this submission — lets the Browse feed
   * (BrowseScreen) update this poutine's card without refetching or reloading
   * the whole list.
   */
  onAggregateChange?: (submissionId: string, aggregate: SubmissionAggregate) => void;
}

function formatPrice(price: number | null): string {
  return price === null ? '\u2014' : `$${price.toFixed(2)}`;
}

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Detail view for one approved poutine: full submission info, restaurant
 * details, tags, existing Tries/Reviews, and (Phase 3) the signed-in
 * employee's own "Log a try" / "Leave a review" actions.
 */
export function SubmissionDetail({ submissionId, onBack, onAggregateChange }: SubmissionDetailProps) {
  const [submission, setSubmission] = useState<PoutineSubmissionRow | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [feedback, setFeedback] = useState<SubmissionFeedback | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isLoggingTry, setIsLoggingTry] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const sub = await getSubmissionWithPhoto(submissionId);
        if (cancelled) return;
        setSubmission(sub);
        const [restaurantRow, feedbackData, user] = await Promise.all([
          sub.restaurantId ? getRestaurantById(sub.restaurantId) : Promise.resolve(null),
          getFeedbackForSubmission(submissionId),
          getCurrentUser(),
        ]);
        if (cancelled) return;
        setRestaurant(restaurantRow);
        setFeedback(feedbackData);
        setCurrentUser(user);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load this poutine.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const myTry = useMemo(() => {
    if (!feedback || !currentUser) return null;
    return feedback.tries.find((t) => t.employeeId === currentUser.systemUserId) ?? null;
  }, [feedback, currentUser]);

  const myReview = useMemo(() => {
    if (!feedback || !currentUser || !myTry) return null;
    return feedback.reviews.find((r) => r.tryId === myTry.rpo_tryid && r.reviewerId === currentUser.systemUserId) ?? null;
  }, [feedback, currentUser, myTry]);

  /** Re-fetches Tries/Reviews for this submission and propagates the recomputed aggregate upward. */
  async function refreshFeedback() {
    const updated = await getFeedbackForSubmission(submissionId);
    setFeedback(updated);
    onAggregateChange?.(submissionId, aggregateFromFeedback(updated));
  }

  async function handleLogTry() {
    if (!currentUser) return;
    setActionError(null);
    setIsLoggingTry(true);
    try {
      // Race guard: re-check right before creating, in case of a double-click or a
      // Try logged from another tab/session since this view loaded.
      const existing = await getTryForEmployee(submissionId, currentUser.systemUserId);
      if (!existing) {
        await createTry({ submissionId, employeeId: currentUser.systemUserId });
      }
      await refreshFeedback();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to log your try.');
    } finally {
      setIsLoggingTry(false);
    }
  }

  async function handleSubmitReview(e: FormEvent) {
    e.preventDefault();
    if (!currentUser || !myTry) return;
    if (rating < 1 || rating > 5) {
      setActionError('Please choose a star rating from 1 to 5.');
      return;
    }
    setActionError(null);
    setIsSubmittingReview(true);
    try {
      // Race guard: one review per employee per poutine (see memory-bank.md's
      // Phase 3 decision) — re-check right before creating.
      const existing = await getReviewForTryAndReviewer(myTry.rpo_tryid, currentUser.systemUserId);
      if (existing) {
        setActionError("You've already reviewed this poutine.");
        return;
      }
      await createReview({
        tryId: myTry.rpo_tryid,
        reviewerId: currentUser.systemUserId,
        starRating: rating,
        comment: comment.trim() || null,
      });
      setShowReviewForm(false);
      setRating(0);
      setComment('');
      await refreshFeedback();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit your review.');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (isLoading) {
    return <EmptyState title="Loading" description="Loading this poutine…" />;
  }

  if (loadError || !submission) {
    return <EmptyState title="Couldn't load this poutine" description={loadError ?? 'Unknown error.'} />;
  }

  return (
    <div className="submission-detail">
      <button type="button" className="btn btn--secondary btn--small submission-detail__back" onClick={onBack}>
        {'\u2190'} Back to Browse
      </button>

      <div className="submission-detail__card">
        {submission.photoDataUrl && (
          <img className="submission-detail__photo" src={submission.photoDataUrl} alt={submission.rpo_name} />
        )}

        <h1 className="submission-detail__title">{submission.rpo_name}</h1>
        {restaurant && <p className="submission-detail__restaurant">{restaurant.rpo_name}</p>}
        {restaurant?.rpo_address && <p className="submission-detail__address">{restaurant.rpo_address}</p>}
        <p className="submission-detail__meta">{formatPrice(submission.rpo_price)}</p>

        {submission.tags.length > 0 && (
          <div className="submission-detail__tags">
            {submission.tags.map((tag) => (
              <span key={tag.rpo_tagid} className="tag-chip">
                {tag.rpo_name}
              </span>
            ))}
          </div>
        )}

        {submission.rpo_description && <p className="submission-detail__description">{submission.rpo_description}</p>}
      </div>

      <section className="submission-detail__actions">
        {actionError && <p className="form-field__error">{actionError}</p>}

        {!myTry && (
          <button type="button" className="btn btn--primary" onClick={handleLogTry} disabled={isLoggingTry}>
            {isLoggingTry ? 'Logging…' : "I've tried this!"}
          </button>
        )}

        {myTry && !myReview && !showReviewForm && (
          <div className="submission-detail__action-row">
            <span className="status-badge status-badge--tried">
              Tried{myTry.triedOn ? ` on ${formatDate(myTry.triedOn)}` : ''}
            </span>
            <button type="button" className="btn btn--secondary btn--small" onClick={() => setShowReviewForm(true)}>
              Leave a review
            </button>
          </div>
        )}

        {myTry && myReview && (
          <span className="status-badge status-badge--tried">
            You reviewed this {'\u2605'.repeat(myReview.starRating)}
          </span>
        )}

        {showReviewForm && (
          <form className="submission-detail__review-form" onSubmit={handleSubmitReview}>
            <div className="form-field">
              <span className="form-field__label">Your rating</span>
              <div className="submission-detail__star-picker" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`submission-detail__star-btn${
                      n <= rating ? ' submission-detail__star-btn--filled' : ''
                    }`}
                    role="radio"
                    aria-checked={n === rating}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    onClick={() => setRating(n)}
                  >
                    {'\u2605'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="submission-detail-review-comment">
                Comment (optional)
              </label>
              <textarea
                id="submission-detail-review-comment"
                className="form-field__textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think?"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary btn--small" disabled={isSubmittingReview || rating === 0}>
                {isSubmittingReview ? 'Submitting…' : 'Submit review'}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => {
                  setShowReviewForm(false);
                  setActionError(null);
                  setRating(0);
                  setComment('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="submission-detail__feedback">
        <h2 className="submission-detail__section-title">
          Tries {feedback ? `(${feedback.tries.length})` : ''}
        </h2>
        {!feedback || feedback.tries.length === 0 ? (
          <p className="submission-detail__empty">No one has tried this poutine yet.</p>
        ) : (
          <ul className="submission-detail__try-list">
            {feedback.tries.map((t) => (
              <li key={t.rpo_tryid} className="submission-detail__try-item">
                {t.employeeName ?? 'An employee'} tried this{t.triedOn ? ` on ${formatDate(t.triedOn)}` : ''}
              </li>
            ))}
          </ul>
        )}

        <h2 className="submission-detail__section-title">
          Reviews {feedback ? `(${feedback.reviews.length})` : ''}
        </h2>
        {!feedback || feedback.reviews.length === 0 ? (
          <p className="submission-detail__empty">No reviews yet.</p>
        ) : (
          <ul className="submission-detail__review-list">
            {feedback.reviews.map((r) => (
              <li key={r.rpo_reviewid} className="submission-detail__review-item">
                <div className="submission-detail__review-header">
                  <span className="submission-detail__review-rating">{'\u2605'.repeat(r.starRating)}</span>
                  <span className="submission-detail__review-author">{r.reviewerName ?? 'An employee'}</span>
                  {r.createdOn && <span className="submission-detail__review-date">{formatDate(r.createdOn)}</span>}
                </div>
                {r.comment && <p className="submission-detail__review-comment">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
