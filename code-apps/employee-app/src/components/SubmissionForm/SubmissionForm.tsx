import { useState, type FormEvent } from 'react';
import { RestaurantPicker, type RestaurantSelection } from '../RestaurantPicker/RestaurantPicker';
import { TagMultiSelect } from '../TagMultiSelect/TagMultiSelect';
import { SubmissionStatus, type SubmissionStatusValue } from '../../data/constants';
import type { TagRow } from '../../data/tags';
import './SubmissionForm.css';

export interface SubmissionFormValues {
  restaurant: RestaurantSelection;
  name: string;
  description: string;
  price: number | null;
  tagIds: string[];
  photo?: File;
}

interface SubmissionFormProps {
  tags: TagRow[];
  initialValues?: SubmissionFormValues;
  /** Draft-only actions disable the "Submit" button in edit mode after a submission has moved past Draft. */
  allowedStatuses?: SubmissionStatusValue[];
  onSave: (values: SubmissionFormValues, status: SubmissionStatusValue) => Promise<void>;
  onCancel?: () => void;
  /** When true (create mode, cap already reached), the whole form is disabled. */
  capReached?: boolean;
}

const EMPTY_VALUES: SubmissionFormValues = {
  restaurant: { name: '', address: '' },
  name: '',
  description: '',
  price: null,
  tagIds: [],
};

/**
 * Shared form for creating a new poutine submission and editing an existing Draft.
 * "Save Draft" persists with status=Draft; "Submit" persists with status=Submitted —
 * there is no moderation step in this phase, so Submitted rows simply wait for a
 * later review flow.
 */
export function SubmissionForm({ tags, initialValues, allowedStatuses, onSave, onCancel, capReached }: SubmissionFormProps) {
  const [values, setValues] = useState<SubmissionFormValues>(initialValues ?? EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<SubmissionStatusValue | null>(null);

  const canSubmit = allowedStatuses ? allowedStatuses.includes(SubmissionStatus.Submitted) : true;
  const isBusy = savingStatus !== null;
  const isDisabled = capReached || isBusy;

  function validate(): string | null {
    if (!values.restaurant.existingRestaurantId && (!values.restaurant.name.trim() || !values.restaurant.address.trim())) {
      return 'Enter a restaurant name and address, or pick an existing restaurant.';
    }
    if (!values.name.trim()) return 'Give your poutine a name.';
    if (values.price !== null && values.price < 0) return 'Price can\u2019t be negative.';
    return null;
  }

  async function handleSave(status: SubmissionStatusValue, e?: FormEvent) {
    e?.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSavingStatus(status);
    try {
      await onSave(values, status);
      if (!initialValues) setValues(EMPTY_VALUES); // reset after a successful create
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving your submission.');
    } finally {
      setSavingStatus(null);
    }
  }

  return (
    <form className="submission-form" onSubmit={(e) => handleSave(SubmissionStatus.Draft, e)}>
      {capReached && (
        <p className="form-field__error" role="alert">
          You already have 5 active submissions. Withdraw a draft, or wait for a decision, before adding another.
        </p>
      )}

      <RestaurantPicker
        value={values.restaurant}
        onChange={(restaurant) => setValues((v) => ({ ...v, restaurant }))}
        disabled={isDisabled}
      />

      <label className="form-field">
        <span className="form-field__label">Poutine name</span>
        <input
          type="text"
          className="form-field__input"
          value={values.name}
          placeholder="e.g. The Late Shift Special"
          disabled={isDisabled}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Description</span>
        <textarea
          className="form-field__textarea"
          value={values.description}
          placeholder="What makes it worth the trip?"
          disabled={isDisabled}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Price ($)</span>
        <input
          type="number"
          className="form-field__input"
          min={0}
          step={0.01}
          value={values.price ?? ''}
          disabled={isDisabled}
          onChange={(e) => setValues((v) => ({ ...v, price: e.target.value === '' ? null : Number(e.target.value) }))}
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Photo</span>
        <input
          type="file"
          accept="image/*"
          className="form-field__input"
          disabled={isDisabled}
          onChange={(e) => setValues((v) => ({ ...v, photo: e.target.files?.[0] }))}
        />
        <span className="form-field__hint">Optional — you can also add one later.</span>
      </label>

      <label className="form-field">
        <span className="form-field__label">Tags</span>
        <TagMultiSelect
          tags={tags}
          selectedTagIds={values.tagIds}
          onChange={(tagIds) => setValues((v) => ({ ...v, tagIds }))}
          disabled={isDisabled}
        />
      </label>

      {error && <p className="form-field__error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn--secondary" disabled={isDisabled}>
          {savingStatus === SubmissionStatus.Draft ? 'Saving…' : 'Save Draft'}
        </button>
        {canSubmit && (
          <button type="button" className="btn btn--primary" disabled={isDisabled} onClick={() => handleSave(SubmissionStatus.Submitted)}>
            {savingStatus === SubmissionStatus.Submitted ? 'Submitting…' : 'Submit'}
          </button>
        )}
        {onCancel && (
          <button type="button" className="btn btn--secondary" disabled={isBusy} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
