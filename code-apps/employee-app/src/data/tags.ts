/** Tag lookup helpers — Tags are seeded master data (no create-from-app in this phase). */
import { listRows, type DataverseRow } from '../lib/dataverseClient';
import { ENTITY_SETS } from './constants';

export interface TagRow {
  rpo_tagid: string;
  rpo_name: string;
}

function toTagRow(row: DataverseRow): TagRow {
  return {
    rpo_tagid: String(row.rpo_tagid),
    rpo_name: (row.rpo_name as string | undefined) ?? '',
  };
}

/** List all seeded tags, sorted by name. */
export async function listTags(): Promise<TagRow[]> {
  const rows = await listRows(ENTITY_SETS.tags, {
    select: ['rpo_tagid', 'rpo_name'],
    orderBy: ['rpo_name asc'],
  });
  return rows.map(toTagRow);
}
