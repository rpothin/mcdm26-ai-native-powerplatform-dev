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
  /**
   * Populated asynchronously by the geocoding Power Automate flow after a
   * restaurant is created (see ARCHITECTURE.md) — may be `null` for a
   * restaurant that hasn't been geocoded yet. Callers (e.g. the Map view)
   * must handle a null latitude/longitude gracefully.
   */
  rpo_latitude?: number | null;
  rpo_longitude?: number | null;
}

const RESTAURANT_SELECT = ['rpo_restaurantid', 'rpo_name', 'rpo_address'];
/** Same as {@link RESTAURANT_SELECT} plus the geocoded coordinates — used by the Map view. */
const RESTAURANT_SELECT_WITH_COORDINATES = [...RESTAURANT_SELECT, 'rpo_latitude', 'rpo_longitude'];

function toRestaurantRow(row: DataverseRow): RestaurantRow {
  return {
    rpo_restaurantid: String(row.rpo_restaurantid),
    rpo_name: (row.rpo_name as string | undefined) ?? '',
    rpo_address: (row.rpo_address as string | null | undefined) ?? null,
    rpo_latitude: (row.rpo_latitude as number | null | undefined) ?? null,
    rpo_longitude: (row.rpo_longitude as number | null | undefined) ?? null,
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
    select: RESTAURANT_SELECT,
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
  const row = await getRow(ENTITY_SETS.restaurants, restaurantId, RESTAURANT_SELECT);
  return toRestaurantRow(row);
}

/**
 * Fetch every restaurant, including its geocoded coordinates (may be null —
 * see {@link RestaurantRow.rpo_latitude}). Used by the Map view to resolve
 * pin positions for a batch of restaurant ids without one round-trip per
 * restaurant.
 */
export async function listAllRestaurantsWithCoordinates(): Promise<RestaurantRow[]> {
  const rows = await listRows(ENTITY_SETS.restaurants, {
    select: RESTAURANT_SELECT_WITH_COORDINATES,
  });
  return rows.map(toRestaurantRow);
}
