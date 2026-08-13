import type { TagRow } from '../../data/tags';
import './TagMultiSelect.css';

interface TagMultiSelectProps {
  tags: TagRow[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
}

/** Chip-style multi-select for the seeded Tag table (DESIGN.md `chip-tag` component). */
export function TagMultiSelect({ tags, selectedTagIds, onChange, disabled }: TagMultiSelectProps) {
  function toggle(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  if (tags.length === 0) {
    return <p className="form-field__hint">No tags are available yet.</p>;
  }

  return (
    <div className="tag-multi-select" role="group" aria-label="Tags">
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.rpo_tagid);
        return (
          <button
            type="button"
            key={tag.rpo_tagid}
            className={`tag-chip${isSelected ? ' tag-chip--selected' : ''}`}
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => toggle(tag.rpo_tagid)}
          >
            {tag.rpo_name}
          </button>
        );
      })}
    </div>
  );
}
