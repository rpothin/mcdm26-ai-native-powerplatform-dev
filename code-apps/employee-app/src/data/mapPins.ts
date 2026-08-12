/**
 * Groups approved poutine submissions by restaurant and resolves each
 * restaurant's geocoded coordinates for the Map view (Phase 4).
 *
 * Restaurants are geocoded asynchronously by a separate Power Automate flow
 * after creation (see ARCHITECTURE.md) — a restaurant's latitude/longitude
 * may still be null by the time an employee views the map. Those restaurants
 * are reported separately as "ungeocoded" instead of being plotted, so the
 * map never crashes or silently drops a poutine.
 */
import { listApprovedSubmissions, type PoutineSubmissionRow } from './submissions';
import { listAllRestaurantsWithCoordinates, type RestaurantRow } from './restaurants';

export interface RestaurantPin {
  restaurantId: string;
  restaurantName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  submissions: PoutineSubmissionRow[];
}

/** An approved-submission restaurant that has no coordinates yet. */
export interface UngeocodedRestaurant {
  restaurantId: string;
  restaurantName: string;
  submissions: PoutineSubmissionRow[];
}

export interface MapPinsResult {
  pins: RestaurantPin[];
  ungeocoded: UngeocodedRestaurant[];
}

function hasCoordinates(restaurant: RestaurantRow): restaurant is RestaurantRow & { rpo_latitude: number; rpo_longitude: number } {
  return typeof restaurant.rpo_latitude === 'number' && typeof restaurant.rpo_longitude === 'number';
}

/**
 * Loads all approved submissions and groups them by restaurant, splitting
 * restaurants with valid geocoded coordinates (plottable `pins`) from those
 * still awaiting geocoding (`ungeocoded`).
 */
export async function getMapPins(): Promise<MapPinsResult> {
  const [submissions, restaurants] = await Promise.all([
    listApprovedSubmissions(),
    listAllRestaurantsWithCoordinates(),
  ]);

  const restaurantById = new Map(restaurants.map((r) => [r.rpo_restaurantid, r]));
  const submissionsByRestaurant = new Map<string, PoutineSubmissionRow[]>();
  for (const submission of submissions) {
    if (!submission.restaurantId) continue;
    const bucket = submissionsByRestaurant.get(submission.restaurantId) ?? [];
    bucket.push(submission);
    submissionsByRestaurant.set(submission.restaurantId, bucket);
  }

  const pins: RestaurantPin[] = [];
  const ungeocoded: UngeocodedRestaurant[] = [];

  for (const [restaurantId, restaurantSubmissions] of submissionsByRestaurant) {
    const restaurant = restaurantById.get(restaurantId);
    const restaurantName = restaurant?.rpo_name ?? restaurantSubmissions[0]?.restaurantName ?? 'Unknown restaurant';
    if (restaurant && hasCoordinates(restaurant)) {
      pins.push({
        restaurantId,
        restaurantName,
        address: restaurant.rpo_address ?? null,
        latitude: restaurant.rpo_latitude,
        longitude: restaurant.rpo_longitude,
        submissions: restaurantSubmissions,
      });
    } else {
      ungeocoded.push({ restaurantId, restaurantName, submissions: restaurantSubmissions });
    }
  }

  return { pins, ungeocoded };
}
