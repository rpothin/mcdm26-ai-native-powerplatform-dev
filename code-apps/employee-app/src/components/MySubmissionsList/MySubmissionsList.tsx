import { useState } from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { SubmissionStatus, type SubmissionStatusValue } from '../../data/constants';
import type { PoutineSubmissionRow } from '../../data/submissions';
import './MySubmissionsList.css';

interface MySubmissionsListProps {
  submissions: PoutineSubmissionRow[];
  onEdit: (submission: PoutineSubmissionRow) => void;
  onWithdraw: (submission: PoutineSubmissionRow) => Promise<void>;
}

const EDITABLE_STATUSES: SubmissionStatusValue[] = [SubmissionStatus.Draft];

function formatPrice(price: number | null): string {
  return price === null ? '\u2014' : `$${price.toFixed(2)}`;
}

/** Card list of the current employee's own submissions, with Edit/Withdraw restricted to Drafts. */
export function MySubmissionsList({ submissions, onEdit, onWithdraw }: MySubmissionsListProps) {
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No submissions yet"
        description="Once you submit a poutine, it will show up here so you can track its status, edit a draft, or withdraw it."
      />
    );
  }

  async function handleWithdraw(submission: PoutineSubmissionRow) {
    if (!window.confirm(`Withdraw "${submission.rpo_name}"? This can't be undone.`)) return;
    setWithdrawingId(submission.rpo_poutinesubmissionid);
    try {
      await onWithdraw(submission);
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <ul className="my-submissions-list">
      {submissions.map((submission) => {
        const isEditable = EDITABLE_STATUSES.includes(submission.rpo_status);
        return (
          <li className="submission-card" key={submission.rpo_poutinesubmissionid}>
            <div className="submission-card__header">
              <h3 className="submission-card__title">{submission.rpo_name}</h3>
              <StatusBadge status={submission.rpo_status} />
            </div>
            {submission.restaurantName && <p className="submission-card__restaurant">{submission.restaurantName}</p>}
            <p className="submission-card__meta">{formatPrice(submission.rpo_price)}</p>
            {submission.tags.length > 0 && (
              <div className="submission-card__tags">
                {submission.tags.map((tag) => (
                  <span key={tag.rpo_tagid} className="tag-chip">
                    {tag.rpo_name}
                  </span>
                ))}
              </div>
            )}
            {isEditable && (
              <div className="submission-card__actions">
                <button type="button" className="btn btn--secondary btn--small" onClick={() => onEdit(submission)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn--destructive btn--small"
                  disabled={withdrawingId === submission.rpo_poutinesubmissionid}
                  onClick={() => handleWithdraw(submission)}
                >
                  {withdrawingId === submission.rpo_poutinesubmissionid ? 'Withdrawing…' : 'Withdraw'}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
