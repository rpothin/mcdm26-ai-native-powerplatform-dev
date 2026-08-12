/**
 * Restaurant lookup + find-or-create helpers used by the submission form so employees
 * can attach a new poutine to an existing Restaurant row instead of creating duplicates.
 */
import { createRow, getRow, listRows, type DataverseRow } from '../lib/dataverseClient';
import { ENTITY_SETS } from './constants';

export interface RestaurantRow {
  rpo_restaurantid: string;
  rpo_name: string;
  rpo_address?: string | null;
}

function toRestaurantRow(row: DataverseRow): RestaurantRow {
  return {
    rpo_restaurantid: String(row.rpo_restaurantid),
    rpo_name: (row.rpo_name as string | undefined) ?? '',
    rpo_address: (row.rpo_address as string | null | undefined) ?? null,
  };
}

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

/** Search existing restaurants by (partial, case-insensitive) name match. */
export async function searchRestaurants(query: string, top = 8): Promise<RestaurantRow[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const rows = await listRows(ENTITY_SETS.restaurants, {
    select: ['rpo_restaurantid', 'rpo_name', 'rpo_address'],
    filter: `contains(rpo_name, '${escapeODataString(trimmed)}')`,
    orderBy: ['rpo_name asc'],
    top,
  });
  return rows.map(toRestaurantRow);
}

/** Creates a new Restaurant row. Latitude/longitude are left unset (populated later by a separate geocoding flow). */
export async function createRestaurant(name: string, address: string): Promise<RestaurantRow> {
  const created = await createRow(ENTITY_SETS.restaurants, {
    rpo_name: name.trim(),
    rpo_address: address.trim(),
  });
  return toRestaurantRow(created);
}

/** Fetch a single restaurant by id (used to pre-fill the picker when editing an existing submission). */
export async function getRestaurantById(restaurantId: string): Promise<RestaurantRow> {
  const row = await getRow(ENTITY_SETS.restaurants, restaurantId, ['rpo_restaurantid', 'rpo_name', 'rpo_address']);
  return toRestaurantRow(row);
}
