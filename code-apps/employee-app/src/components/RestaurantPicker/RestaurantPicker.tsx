import { useEffect, useRef, useState } from 'react';
import { searchRestaurants, type RestaurantRow } from '../../data/restaurants';
import './RestaurantPicker.css';

export interface RestaurantSelection {
  existingRestaurantId?: string;
  name: string;
  address: string;
}

interface RestaurantPickerProps {
  value: RestaurantSelection;
  onChange: (value: RestaurantSelection) => void;
  disabled?: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Restaurant/place field for the submission form: searches existing restaurants as the
 * employee types a name, lets them pick one (locking the address to the existing record),
 * or fall through to entering a brand-new restaurant name + address.
 */
export function RestaurantPicker({ value, onChange, disabled }: RestaurantPickerProps) {
  const [results, setResults] = useState<RestaurantRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isExisting = Boolean(value.existingRestaurantId);

  useEffect(() => {
    if (isExisting || !value.name.trim()) {
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsSearching(true);
      searchRestaurants(value.name)
        .then((rows) => setResults(rows))
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [value.name, isExisting]);

  function selectExisting(restaurant: RestaurantRow) {
    onChange({ existingRestaurantId: restaurant.rpo_restaurantid, name: restaurant.rpo_name, address: restaurant.rpo_address ?? '' });
    setShowResults(false);
  }

  function clearSelection() {
    onChange({ name: '', address: '' });
    setShowResults(true);
  }

  return (
    <div className="restaurant-picker">
      <label className="form-field">
        <span className="form-field__label">Restaurant / place name</span>
        {isExisting ? (
          <div className="restaurant-picker__selected">
            <span className="restaurant-picker__selected-name">{value.name}</span>
            <button type="button" className="restaurant-picker__change" onClick={clearSelection} disabled={disabled}>
              Change
            </button>
          </div>
        ) : (
          <input
            type="text"
            className="form-field__input"
            value={value.name}
            placeholder="e.g. La Belle Province"
            disabled={disabled}
            onFocus={() => setShowResults(true)}
            onChange={(e) => onChange({ name: e.target.value, address: value.address })}
            autoComplete="off"
            required
          />
        )}
        {!isExisting && showResults && value.name.trim() && (
          <div className="restaurant-picker__results">
            {isSearching && <p className="restaurant-picker__hint">Searching…</p>}
            {!isSearching && results.length === 0 && (
              <p className="restaurant-picker__hint">No match — this will create a new restaurant.</p>
            )}
            {results.map((r) => (
              <button
                type="button"
                key={r.rpo_restaurantid}
                className="restaurant-picker__result"
                onClick={() => selectExisting(r)}
              >
                <span className="restaurant-picker__result-name">{r.rpo_name}</span>
                {r.rpo_address && <span className="restaurant-picker__result-address">{r.rpo_address}</span>}
              </button>
            ))}
          </div>
        )}
      </label>

      <label className="form-field">
        <span className="form-field__label">Address</span>
        <input
          type="text"
          className="form-field__input"
          value={value.address}
          placeholder="Street, city"
          disabled={disabled || isExisting}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          required
        />
      </label>
    </div>
  );
}
