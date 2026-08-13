import { SUBMISSION_STATUS_LABELS, SubmissionStatus, type SubmissionStatusValue } from '../../data/constants';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: SubmissionStatusValue;
}

const STATUS_MODIFIER: Record<SubmissionStatusValue, string> = {
  [SubmissionStatus.Draft]: 'draft',
  [SubmissionStatus.Submitted]: 'submitted',
  [SubmissionStatus.InReview]: 'in-review',
  [SubmissionStatus.Approved]: 'approved',
  [SubmissionStatus.Rejected]: 'rejected',
};

/** Status chip per DESIGN.md: color communicates meaning, always paired with a text label. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${STATUS_MODIFIER[status]}`}>{SUBMISSION_STATUS_LABELS[status]}</span>;
}

export type BadgeVariant = 'draft' | 'submitted' | 'in-review' | 'approved' | 'rejected' | 'tried';

/**
 * Generic version of the same chip treatment for non-submission-status labels
 * (e.g. Season `Active`/`Closed` on the Leaderboards screen, Phase 5) — reuses
 * the `status-badge` visual language instead of introducing a new component.
 */
export function Badge({ label, variant }: { label: string; variant: BadgeVariant }) {
  return <span className={`status-badge status-badge--${variant}`}>{label}</span>;
}
