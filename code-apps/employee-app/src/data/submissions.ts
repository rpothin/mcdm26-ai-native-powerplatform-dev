/**
 * PoutineSubmission CRUD, the 5-active-submission cap, and Tag association logic
 * for the "Submit a poutine" experience (Phase 1).
 */
import {
  associateRows,
  createRow,
  deleteRow,
  disassociateRows,
  getRow,
  listRows,
  updateRow,
  uploadFileImage,
  type DataverseRow,
} from '../lib/dataverseClient';
import { createRestaurant } from './restaurants';
import {
  ACTIVE_SUBMISSION_STATUSES,
  ENTITY_SETS,
  MAX_ACTIVE_SUBMISSIONS,
  SUBMISSION_TAG_RELATIONSHIP,
  SubmissionStatus,
  type SubmissionStatusValue,
} from './constants';
import type { TagRow } from './tags';

export interface PoutineSubmissionRow {
  rpo_poutinesubmissionid: string;
  rpo_name: string;
  rpo_description: string | null;
  rpo_price: number | null;
  rpo_status: SubmissionStatusValue;
  restaurantId: string | null;
  restaurantName: string | null;
  createdOn: string | null;
  tags: TagRow[];
}

const SUBMISSION_SELECT = ['rpo_poutinesubmissionid', 'rpo_name', 'rpo_description', 'rpo_price', 'rpo_status', 'rpo_restaurantid', 'createdon'];
const TAG_EXPAND = `${SUBMISSION_TAG_RELATIONSHIP}($select=rpo_tagid,rpo_name)`;

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

function toSubmissionRow(row: DataverseRow): PoutineSubmissionRow {
  const restaurantName = row['_rpo_restaurantid_value@OData.Community.Display.V1.FormattedValue'] as
    | string
    | undefined;
  const relatedTags = (row[SUBMISSION_TAG_RELATIONSHIP] as DataverseRow[] | undefined) ?? [];
  return {
    rpo_poutinesubmissionid: String(row.rpo_poutinesubmissionid),
    rpo_name: (row.rpo_name as string | undefined) ?? '',
    rpo_description: (row.rpo_description as string | null | undefined) ?? null,
    rpo_price: (row.rpo_price as number | null | undefined) ?? null,
    rpo_status: (row.rpo_status as SubmissionStatusValue | undefined) ?? SubmissionStatus.Draft,
    restaurantId: (row._rpo_restaurantid_value as string | null | undefined) ?? null,
    restaurantName: restaurantName ?? null,
    createdOn: (row.createdon as string | null | undefined) ?? null,
    tags: relatedTags.map((t) => ({ rpo_tagid: String(t.rpo_tagid), rpo_name: (t.rpo_name as string) ?? '' })),
  };
}

/** List all submissions created by the given SystemUser, newest first, including their tags. */
export async function listMySubmissions(submitterId: string): Promise<PoutineSubmissionRow[]> {
  const rows = await listRows(ENTITY_SETS.poutineSubmissions, {
    select: SUBMISSION_SELECT,
    filter: `_rpo_submitterid_value eq '${escapeODataString(submitterId)}'`,
    orderBy: ['createdon desc'],
    expand: TAG_EXPAND,
  });
  return rows.map(toSubmissionRow);
}

/** Count how many of the submitter's submissions are in an "active" (cap-counting) status. */
export async function countActiveSubmissions(submitterId: string): Promise<number> {
  const statusFilter = ACTIVE_SUBMISSION_STATUSES.map((s) => `rpo_status eq ${s}`).join(' or ');
  const rows = await listRows(ENTITY_SETS.poutineSubmissions, {
    select: ['rpo_poutinesubmissionid'],
    filter: `_rpo_submitterid_value eq '${escapeODataString(submitterId)}' and (${statusFilter})`,
  });
  return rows.length;
}

export interface CreateSubmissionInput {
  submitterId: string;
  /** GUID of an existing restaurant, when the employee picked one from search results. */
  existingRestaurantId?: string;
  /** Required when existingRestaurantId is not provided. */
  newRestaurantName?: string;
  newRestaurantAddress?: string;
  name: string;
  description: string;
  price: number | null;
  status: typeof SubmissionStatus.Draft | typeof SubmissionStatus.Submitted;
  tagIds: string[];
  photo?: File;
}

/**
 * Creates a PoutineSubmission (creating its Restaurant first if a new one was entered),
 * associates the selected tags, and uploads the photo if one was provided.
 *
 * Callers must enforce the active-submission cap (via {@link countActiveSubmissions})
 * before calling this — it is not re-checked here to keep this function a single
 * atomic sequence of Dataverse calls.
 */
export async function createSubmission(input: CreateSubmissionInput): Promise<PoutineSubmissionRow> {
  let restaurantId = input.existingRestaurantId;
  if (!restaurantId) {
    if (!input.newRestaurantName?.trim() || !input.newRestaurantAddress?.trim()) {
      throw new Error('A restaurant name and address are required when no existing restaurant is selected.');
    }
    const restaurant = await createRestaurant(input.newRestaurantName, input.newRestaurantAddress);
    restaurantId = restaurant.rpo_restaurantid;
  }

  const created = await createRow(ENTITY_SETS.poutineSubmissions, {
    rpo_name: input.name.trim(),
    rpo_description: input.description.trim() || null,
    rpo_price: input.price,
    rpo_status: input.status,
    'rpo_restaurantid@odata.bind': `/${ENTITY_SETS.restaurants}(${restaurantId})`,
    'rpo_submitterid@odata.bind': `/${ENTITY_SETS.systemUsers}(${input.submitterId})`,
  });
  const submissionId = String(created.rpo_poutinesubmissionid);

  for (const tagId of input.tagIds) {
    await associateRows(
      ENTITY_SETS.poutineSubmissions,
      submissionId,
      SUBMISSION_TAG_RELATIONSHIP,
      ENTITY_SETS.tags,
      tagId,
    );
  }

  if (input.photo) {
    await uploadFileImage(ENTITY_SETS.poutineSubmissions, submissionId, 'rpo_photo', input.photo);
  }

  return getSubmission(submissionId);
}

/** Fetch a single submission (with its tags) by id. */
export async function getSubmission(submissionId: string): Promise<PoutineSubmissionRow> {
  const row = await getRow(ENTITY_SETS.poutineSubmissions, submissionId, [...SUBMISSION_SELECT]);
  // GetItem doesn't accept $expand in this connector op the way List does for our purposes here,
  // so tags are fetched separately and merged in.
  const tags = await getSubmissionTags(submissionId);
  return { ...toSubmissionRow(row), tags };
}

/** Fetch the tags currently associated with a submission. */
export async function getSubmissionTags(submissionId: string): Promise<TagRow[]> {
  const rows = await listRows(ENTITY_SETS.poutineSubmissions, {
    select: ['rpo_poutinesubmissionid'],
    filter: `rpo_poutinesubmissionid eq '${escapeODataString(submissionId)}'`,
    expand: TAG_EXPAND,
    top: 1,
  });
  const related = (rows[0]?.[SUBMISSION_TAG_RELATIONSHIP] as DataverseRow[] | undefined) ?? [];
  return related.map((t) => ({ rpo_tagid: String(t.rpo_tagid), rpo_name: (t.rpo_name as string) ?? '' }));
}

export interface UpdateSubmissionInput {
  name: string;
  description: string;
  price: number | null;
  status: SubmissionStatusValue;
  existingRestaurantId?: string;
  newRestaurantName?: string;
  newRestaurantAddress?: string;
  tagIds: string[];
  photo?: File;
}

/** Updates a Draft submission's fields, restaurant, tags (diffed), and optionally its photo. */
export async function updateSubmission(submissionId: string, input: UpdateSubmissionInput): Promise<PoutineSubmissionRow> {
  let restaurantId = input.existingRestaurantId;
  if (!restaurantId) {
    if (!input.newRestaurantName?.trim() || !input.newRestaurantAddress?.trim()) {
      throw new Error('A restaurant name and address are required when no existing restaurant is selected.');
    }
    const restaurant = await createRestaurant(input.newRestaurantName, input.newRestaurantAddress);
    restaurantId = restaurant.rpo_restaurantid;
  }

  await updateRow(ENTITY_SETS.poutineSubmissions, submissionId, {
    rpo_name: input.name.trim(),
    rpo_description: input.description.trim() || null,
    rpo_price: input.price,
    rpo_status: input.status,
    'rpo_restaurantid@odata.bind': `/${ENTITY_SETS.restaurants}(${restaurantId})`,
  });

  const currentTags = await getSubmissionTags(submissionId);
  const currentTagIds = new Set(currentTags.map((t) => t.rpo_tagid));
  const nextTagIds = new Set(input.tagIds);

  for (const tagId of nextTagIds) {
    if (!currentTagIds.has(tagId)) {
      await associateRows(ENTITY_SETS.poutineSubmissions, submissionId, SUBMISSION_TAG_RELATIONSHIP, ENTITY_SETS.tags, tagId);
    }
  }
  for (const tagId of currentTagIds) {
    if (!nextTagIds.has(tagId)) {
      await disassociateRows(ENTITY_SETS.poutineSubmissions, submissionId, SUBMISSION_TAG_RELATIONSHIP, ENTITY_SETS.tags, tagId);
    }
  }

  if (input.photo) {
    await uploadFileImage(ENTITY_SETS.poutineSubmissions, submissionId, 'rpo_photo', input.photo);
  }

  return getSubmission(submissionId);
}

/** Hard-deletes a submission. UI restricts this action to the employee's own Draft submissions. */
export async function withdrawSubmission(submissionId: string): Promise<void> {
  await deleteRow(ENTITY_SETS.poutineSubmissions, submissionId);
}

export { MAX_ACTIVE_SUBMISSIONS };
