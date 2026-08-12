import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { SubmissionDetail } from '../components/SubmissionDetail/SubmissionDetail';
import { getMapPins, type RestaurantPin } from '../data/mapPins';
import './MapScreen.css';

/** Montreal city centre — used as the default view when there are no pins to fit yet. */
const MONTREAL_CENTER: LatLngTuple = [45.5017, -73.5673];
const DEFAULT_ZOOM = 12;

/**
 * Circular fry-gold pin with a gravy-ink border, matching DESIGN.md's
 * "Map pins" rule ("circular fry-gold-filled pins with gravy-ink border
 * matching the rank-badge shape language"). Implemented as a `divIcon` (not
 * an image) so it can be styled entirely with the shared design tokens.
 */
const pinIcon = new L.DivIcon({
  className: 'map-pin-icon',
  html: '<span class="map-pin-icon__dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
  popupAnchor: [0, -24],
});

function formatPrice(price: number | null): string {
  return price === null ? '\u2014' : `$${price.toFixed(2)}`;
}

/** Recenters/fits the map to the given pins whenever the pin set changes. Renders nothing itself. */
function FitBounds({ pins }: { pins: RestaurantPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].latitude, pins[0].longitude], DEFAULT_ZOOM);
      return;
    }
    const bounds: LatLngBoundsExpression = pins.map((p) => [p.latitude, p.longitude]);
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, pins]);

  return null;
}

/**
 * Phase 4 — the public discovery map: one pin per restaurant with at least one
 * approved poutine, popup listing that restaurant's poutine(s) with a
 * tap-through to the same read-only `SubmissionDetail` view used by Browse
 * (Phase 2). Restaurants without geocoded coordinates yet are surfaced as a
 * small notice below the map instead of being plotted or crashing the view —
 * see memory-bank.md for the reasoning.
 */
export function MapScreen() {
  const [pins, setPins] = useState<RestaurantPin[]>([]);
  const [ungeocodedCount, setUngeocodedCount] = useState(0);
  const [ungeocodedNames, setUngeocodedNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const { pins: loadedPins, ungeocoded } = await getMapPins();
        if (cancelled) return;
        setPins(loadedPins);
        setUngeocodedCount(ungeocoded.length);
        setUngeocodedNames(ungeocoded.map((r) => r.restaurantName));
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load the map.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPoutines = useMemo(() => pins.reduce((sum, pin) => sum + pin.submissions.length, 0), [pins]);

  function handleBack() {
    setSelectedSubmissionId(null);
  }

  function handleAggregateChange() {
    // The map doesn't render try/review aggregates on pins, so there's nothing
    // to patch locally — SubmissionDetail still calls this after a successful
    // Try/Review create, we just don't need to act on it here.
  }

  if (selectedSubmissionId) {
    return (
      <SubmissionDetail
        submissionId={selectedSubmissionId}
        onBack={handleBack}
        onAggregateChange={handleAggregateChange}
      />
    );
  }

  if (isLoading) {
    return <EmptyState eyebrow="Phase 4" title="Map view" description="Loading the map…" />;
  }

  if (loadError) {
    return <EmptyState eyebrow="Phase 4" title="Map view" description={loadError} />;
  }

  if (pins.length === 0) {
    return (
      <EmptyState
        eyebrow="Phase 4"
        title="Map view"
        description={
          ungeocodedCount > 0
            ? `No approved poutines have geocoded coordinates yet (${ungeocodedCount} restaurant${
                ungeocodedCount === 1 ? '' : 's'
              } awaiting geocoding). Check back once the geocoding flow has run.`
            : 'No poutines have been approved yet — check back soon!'
        }
      />
    );
  }

  return (
    <div className="map-screen">
      <header className="map-screen__header">
        <p className="map-screen__eyebrow">Phase 4</p>
        <h1 className="map-screen__title">Map view</h1>
        <p className="map-screen__count">
          {totalPoutines} approved poutine{totalPoutines === 1 ? '' : 's'} across {pins.length} restaurant
          {pins.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="map-screen__map-wrap">
        <MapContainer
          center={MONTREAL_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className="map-screen__map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds pins={pins} />
          {pins.map((pin) => (
            <Marker key={pin.restaurantId} position={[pin.latitude, pin.longitude]} icon={pinIcon}>
              <Popup className="map-screen__popup" minWidth={220}>
                <div className="map-popup">
                  <h3 className="map-popup__title">{pin.restaurantName}</h3>
                  {pin.address && <p className="map-popup__address">{pin.address}</p>}
                  <ul className="map-popup__list">
                    {pin.submissions.map((submission) => (
                      <li key={submission.rpo_poutinesubmissionid} className="map-popup__item">
                        <div className="map-popup__item-info">
                          <span className="map-popup__item-name">{submission.rpo_name}</span>
                          <span className="map-popup__item-price">{formatPrice(submission.rpo_price)}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn--secondary btn--small"
                          onClick={() => setSelectedSubmissionId(submission.rpo_poutinesubmissionid)}
                        >
                          View details
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {ungeocodedCount > 0 && (
        <p className="map-screen__ungeocoded-notice">
          {ungeocodedCount} restaurant{ungeocodedCount === 1 ? '' : 's'} awaiting geocoding, not shown on the map yet:{' '}
          {ungeocodedNames.join(', ')}.
        </p>
      )}
    </div>
  );
}
