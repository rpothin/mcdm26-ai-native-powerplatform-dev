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
