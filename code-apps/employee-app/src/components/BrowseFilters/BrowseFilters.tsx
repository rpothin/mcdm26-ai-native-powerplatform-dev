import { TagMultiSelect } from '../TagMultiSelect/TagMultiSelect';
import type { TagRow } from '../../data/tags';
import './BrowseFilters.css';

interface BrowseFiltersProps {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  tags: TagRow[];
  selectedTagIds: string[];
  onSelectedTagIdsChange: (tagIds: string[]) => void;
}

/**
 * Search box (poutine or restaurant name) + tag chip filter for the Browse feed.
 * Reuses {@link TagMultiSelect} from Phase 1 as-is — its chip-toggle UI works
 * equally well as a filter control, not just a form input.
 */
export function BrowseFilters({
  searchText,
  onSearchTextChange,
  tags,
  selectedTagIds,
  onSelectedTagIdsChange,
}: BrowseFiltersProps) {
  return (
    <div className="browse-filters">
      <div className="form-field">
        <label className="form-field__label" htmlFor="browse-search">
          Search
        </label>
        <input
          id="browse-search"
          type="search"
          className="form-field__input"
          placeholder="Poutine or restaurant name…"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
        />
      </div>
      {tags.length > 0 && (
        <div className="form-field">
          <span className="form-field__label">Tags</span>
          <TagMultiSelect tags={tags} selectedTagIds={selectedTagIds} onChange={onSelectedTagIdsChange} />
        </div>
      )}
    </div>
  );
}
