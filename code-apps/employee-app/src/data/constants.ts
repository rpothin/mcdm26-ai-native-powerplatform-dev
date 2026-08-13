/**
 * Shared Dataverse constants: entity set names, relationship names, and the
 * PoutineSubmission status option-set values. Kept in one place so the field/entity
 * names used across `src/data/*` stay consistent with the unpacked solution schema
 * under `solutions/poutineleaguecore/`.
 */

export const ENTITY_SETS = {
  poutineSubmissions: 'rpo_poutinesubmissions',
  restaurants: 'rpo_restaurants',
  tags: 'rpo_tags',
  systemUsers: 'systemusers',
  tries: 'rpo_tries',
  reviews: 'rpo_reviews',
  seasons: 'rpo_seasons',
  categories: 'rpo_categories',
  seasonResults: 'rpo_seasonresults',
  seasonResultEntries: 'rpo_seasonresultentries',
  hallOfFameEntries: 'rpo_halloffameentries',
} as const;

/** Schema name of the PoutineSubmission <-> Tag many-to-many relationship. */
export const SUBMISSION_TAG_RELATIONSHIP = 'rpo_PoutineSubmission_Tag';

/** rpo_status option-set values (see solutions/poutineleaguecore Entities/rpo_PoutineSubmission). */
export const SubmissionStatus = {
  Draft: 100000000,
  Submitted: 100000001,
  InReview: 100000002,
  Approved: 100000003,
  Rejected: 100000004,
} as const;

export type SubmissionStatusValue = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatusValue, string> = {
  [SubmissionStatus.Draft]: 'Draft',
  [SubmissionStatus.Submitted]: 'Submitted',
  [SubmissionStatus.InReview]: 'In Review',
  [SubmissionStatus.Approved]: 'Approved',
  [SubmissionStatus.Rejected]: 'Rejected',
};

/**
 * Statuses that count against the employee's active-submission cap.
 * Rejected submissions are excluded so a rejection frees up a slot.
 */
export const ACTIVE_SUBMISSION_STATUSES: SubmissionStatusValue[] = [
  SubmissionStatus.Draft,
  SubmissionStatus.Submitted,
  SubmissionStatus.InReview,
  SubmissionStatus.Approved,
];

export const MAX_ACTIVE_SUBMISSIONS = 5;

/** rpo_status option-set values for Season (see solutions/poutineleaguecore Entities/rpo_Season). */
export const SeasonStatus = {
  Active: 100000000,
  Closed: 100000001,
} as const;

export type SeasonStatusValue = (typeof SeasonStatus)[keyof typeof SeasonStatus];

export const SEASON_STATUS_LABELS: Record<SeasonStatusValue, string> = {
  [SeasonStatus.Active]: 'Active',
  [SeasonStatus.Closed]: 'Closed',
};
