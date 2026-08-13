import type { SubmissionAggregate } from '../../data/feedback';
import type { PoutineSubmissionRow } from '../../data/submissions';
import '../TagMultiSelect/TagMultiSelect.css';
import './PoutineCard.css';

interface PoutineCardProps {
  submission: PoutineSubmissionRow;
  aggregate?: SubmissionAggregate;
  onSelect: (submission: PoutineSubmissionRow) => void;
}

function formatPrice(price: number | null): string {
  return price === null ? '\u2014' : `$${price.toFixed(2)}`;
}

/** Renders the "tries/reviews" line: average rating when reviews exist, else a try count, else a nudge. */
function formatAggregate(aggregate: SubmissionAggregate | undefined): string {
  if (!aggregate || aggregate.tryCount === 0) return 'Not tried yet';
  if (aggregate.reviewCount === 0) {
    return `${aggregate.tryCount} ${aggregate.tryCount === 1 ? 'try' : 'tries'} \u00b7 no reviews yet`;
  }
  const rating = aggregate.averageRating ?? 0;
  return `\u2605 ${rating.toFixed(1)} (${aggregate.reviewCount} ${aggregate.reviewCount === 1 ? 'review' : 'reviews'}) \u00b7 ${aggregate.tryCount} ${aggregate.tryCount === 1 ? 'try' : 'tries'}`;
}

/** A single poutine in the public Browse feed. Card treatment matches the Phase 1 submission-card. */
export function PoutineCard({ submission, aggregate, onSelect }: PoutineCardProps) {
  return (
    <li className="poutine-card">
      <button type="button" className="poutine-card__button" onClick={() => onSelect(submission)}>
        <div className="poutine-card__photo-wrap">
          {submission.photoDataUrl ? (
            <img className="poutine-card__photo" src={submission.photoDataUrl} alt="" />
          ) : (
            <div className="poutine-card__photo poutine-card__photo--placeholder" aria-hidden="true">
              🍟
            </div>
          )}
        </div>
        <div className="poutine-card__body">
          <h3 className="poutine-card__title">{submission.rpo_name}</h3>
          {submission.restaurantName && <p className="poutine-card__restaurant">{submission.restaurantName}</p>}
          <p className="poutine-card__meta">{formatPrice(submission.rpo_price)}</p>
          {submission.tags.length > 0 && (
            <div className="poutine-card__tags">
              {submission.tags.map((tag) => (
                <span key={tag.rpo_tagid} className="tag-chip">
                  {tag.rpo_name}
                </span>
              ))}
            </div>
          )}
          <p className="poutine-card__aggregate">{formatAggregate(aggregate)}</p>
        </div>
      </button>
    </li>
  );
}
