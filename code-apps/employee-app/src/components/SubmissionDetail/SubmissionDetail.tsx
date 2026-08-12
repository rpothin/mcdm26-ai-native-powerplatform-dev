import { useEffect, useState } from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import type { RestaurantRow } from '../../data/restaurants';
import { getRestaurantById } from '../../data/restaurants';
import type { PoutineSubmissionRow } from '../../data/submissions';
import { getSubmissionWithPhoto } from '../../data/submissions';
import { getFeedbackForSubmission, type SubmissionFeedback } from '../../data/feedback';
import '../TagMultiSelect/TagMultiSelect.css';
import './SubmissionDetail.css';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

function formatPrice(price: number | null): string {
  return price === null ? '\u2014' : `$${price.toFixed(2)}`;
}

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Read-only detail view for one approved poutine: full submission info, restaurant
 * details, tags, and any existing Tries/Reviews. Try/Review *creation* is Phase 3 —
 * this phase only displays what already exists.
 */
export function SubmissionDetail({ submissionId, onBack }: SubmissionDetailProps) {
  const [submission, setSubmission] = useState<PoutineSubmissionRow | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [feedback, setFeedback] = useState<SubmissionFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const sub = await getSubmissionWithPhoto(submissionId);
        if (cancelled) return;
        setSubmission(sub);
        const [restaurantRow, feedbackData] = await Promise.all([
          sub.restaurantId ? getRestaurantById(sub.restaurantId) : Promise.resolve(null),
          getFeedbackForSubmission(submissionId),
        ]);
        if (cancelled) return;
        setRestaurant(restaurantRow);
        setFeedback(feedbackData);
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
