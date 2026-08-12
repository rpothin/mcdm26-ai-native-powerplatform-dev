import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState/EmptyState";
import { SubmissionForm, type SubmissionFormValues } from "../components/SubmissionForm/SubmissionForm";
import { MySubmissionsList } from "../components/MySubmissionsList/MySubmissionsList";
import { getCurrentUser } from "../data/currentUser";
import { getRestaurantById } from "../data/restaurants";
import { listTags, type TagRow } from "../data/tags";
import { SubmissionStatus, type SubmissionStatusValue } from "../data/constants";
import {
  MAX_ACTIVE_SUBMISSIONS,
  countActiveSubmissions,
  createSubmission,
  listMySubmissions,
  updateSubmission,
  withdrawSubmission,
  type PoutineSubmissionRow,
} from "../data/submissions";
import "./SubmitScreen.css";

type View = "new" | "mine" | "edit";

/** Draft-only, per the Phase 1 scope: only Draft submissions can be edited. */
const EDITABLE_STATUSES: SubmissionStatusValue[] = [SubmissionStatus.Draft];

export function SubmitScreen() {
  const [view, setView] = useState<View>("new");
  const [submitterId, setSubmitterId] = useState<string | null>(null);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [submissions, setSubmissions] = useState<PoutineSubmissionRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [editingSubmission, setEditingSubmission] = useState<PoutineSubmissionRow | null>(null);
  const [editingInitialValues, setEditingInitialValues] = useState<SubmissionFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async (userId: string) => {
    const [mySubmissions, active] = await Promise.all([listMySubmissions(userId), countActiveSubmissions(userId)]);
    setSubmissions(mySubmissions);
    setActiveCount(active);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const [user, tagRows] = await Promise.all([getCurrentUser(), listTags()]);
        if (cancelled) return;
        setSubmitterId(user.systemUserId);
        setTags(tagRows);
        await refresh(user.systemUserId);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load your submissions.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const capReached = activeCount >= MAX_ACTIVE_SUBMISSIONS;

  async function handleCreate(values: SubmissionFormValues, status: SubmissionStatusValue) {
    if (!submitterId) throw new Error("Could not determine the current user.");
    // Re-check right before writing, in case the count changed since the form loaded.
    const currentActive = await countActiveSubmissions(submitterId);
    if (currentActive >= MAX_ACTIVE_SUBMISSIONS) {
      setActiveCount(currentActive);
      throw new Error(`You already have ${MAX_ACTIVE_SUBMISSIONS} active submissions. Withdraw a draft first.`);
    }
    await createSubmission({
      submitterId,
      existingRestaurantId: values.restaurant.existingRestaurantId,
      newRestaurantName: values.restaurant.existingRestaurantId ? undefined : values.restaurant.name,
      newRestaurantAddress: values.restaurant.existingRestaurantId ? undefined : values.restaurant.address,
      name: values.name,
      description: values.description,
      price: values.price,
      status: status as typeof SubmissionStatus.Draft | typeof SubmissionStatus.Submitted,
      tagIds: values.tagIds,
      photo: values.photo,
    });
    await refresh(submitterId);
  }

  async function handleEditSelect(submission: PoutineSubmissionRow) {
    setEditingSubmission(submission);
    setEditingInitialValues(null);
    setView("edit");
    const restaurant = submission.restaurantId ? await getRestaurantById(submission.restaurantId) : null;
    setEditingInitialValues({
      restaurant: restaurant
        ? { existingRestaurantId: restaurant.rpo_restaurantid, name: restaurant.rpo_name, address: restaurant.rpo_address ?? "" }
        : { name: "", address: "" },
      name: submission.rpo_name,
      description: submission.rpo_description ?? "",
      price: submission.rpo_price,
      tagIds: submission.tags.map((t) => t.rpo_tagid),
    });
  }

  async function handleUpdate(values: SubmissionFormValues, status: SubmissionStatusValue) {
    if (!editingSubmission || !submitterId) return;
    await updateSubmission(editingSubmission.rpo_poutinesubmissionid, {
      name: values.name,
      description: values.description,
      price: values.price,
      status,
      existingRestaurantId: values.restaurant.existingRestaurantId,
      newRestaurantName: values.restaurant.existingRestaurantId ? undefined : values.restaurant.name,
      newRestaurantAddress: values.restaurant.existingRestaurantId ? undefined : values.restaurant.address,
      tagIds: values.tagIds,
      photo: values.photo,
    });
    setEditingSubmission(null);
    setEditingInitialValues(null);
    setView("mine");
    await refresh(submitterId);
  }

  async function handleWithdraw(submission: PoutineSubmissionRow) {
    if (!submitterId) return;
    await withdrawSubmission(submission.rpo_poutinesubmissionid);
    await refresh(submitterId);
  }

  const capMessage = useMemo(
    () => `${activeCount} of ${MAX_ACTIVE_SUBMISSIONS} active submissions used`,
    [activeCount],
  );

  if (isLoading) {
    return <EmptyState title="Submit a poutine" description="Loading your submissions…" />;
  }

  if (loadError) {
    return <EmptyState title="Submit a poutine" description={loadError} />;
  }

  return (
    <div className="submit-screen">
      <header className="submit-screen__header">
        <p className="submit-screen__eyebrow">Phase 1</p>
        <h1 className="submit-screen__title">Submit a poutine</h1>
        <p className="submit-screen__cap">{capMessage}</p>
      </header>

      <nav className="submit-screen__tabs" aria-label="Submission views">
        <button
          type="button"
          className={`submit-screen__tab${view === "new" ? " submit-screen__tab--active" : ""}`}
          onClick={() => setView("new")}
        >
          New submission
        </button>
        <button
          type="button"
          className={`submit-screen__tab${view === "mine" ? " submit-screen__tab--active" : ""}`}
          onClick={() => setView("mine")}
        >
          My submissions ({submissions.length})
        </button>
      </nav>

      {view === "new" && <SubmissionForm tags={tags} onSave={handleCreate} capReached={capReached} />}

      {view === "mine" && (
        <MySubmissionsList submissions={submissions} onEdit={handleEditSelect} onWithdraw={handleWithdraw} />
      )}

      {view === "edit" &&
        editingSubmission &&
        (editingInitialValues ? (
          <SubmissionForm
            tags={tags}
            initialValues={editingInitialValues}
            allowedStatuses={EDITABLE_STATUSES}
            onSave={handleUpdate}
            onCancel={() => {
              setEditingSubmission(null);
              setEditingInitialValues(null);
              setView("mine");
            }}
          />
        ) : (
          <EmptyState title="Loading" description="Loading this submission…" />
        ))}
    </div>
  );
}
