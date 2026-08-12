import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { BrowseFilters } from '../components/BrowseFilters/BrowseFilters';
import { PoutineCard } from '../components/PoutineCard/PoutineCard';
import { SubmissionDetail } from '../components/SubmissionDetail/SubmissionDetail';
import { listTags, type TagRow } from '../data/tags';
import { listApprovedSubmissions, type PoutineSubmissionRow } from '../data/submissions';
import { getAggregatesForSubmissions, type SubmissionAggregate } from '../data/feedback';
import './BrowseScreen.css';

type View = 'list' | 'detail';

/** Case-insensitive contains check for the poutine/restaurant name search. */
function matchesSearch(submission: PoutineSubmissionRow, query: string): boolean {
  if (!query) return true;
  const haystack = `${submission.rpo_name} ${submission.restaurantName ?? ''}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

/** A submission matches the tag filter if it carries at least one of the selected tags. */
function matchesTags(submission: PoutineSubmissionRow, selectedTagIds: string[]): boolean {
  if (selectedTagIds.length === 0) return true;
  const submissionTagIds = new Set(submission.tags.map((t) => t.rpo_tagid));
  return selectedTagIds.some((id) => submissionTagIds.has(id));
}

/**
 * Phase 2 — the public discovery feed: approved poutines only, filterable by
 * tag and free-text (poutine/restaurant name), with a tap-through read-only
 * detail view. Filtering happens client-side after a single fetch of all
 * approved submissions, which is appropriate at this app's demo scale and
 * avoids fragile server-side OData filters across N:N tag relationships.
 */
export function BrowseScreen() {
  const [view, setView] = useState<View>('list');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<PoutineSubmissionRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [aggregates, setAggregates] = useState<Map<string, SubmissionAggregate>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [approvedSubmissions, tagRows] = await Promise.all([listApprovedSubmissions(), listTags()]);
        if (cancelled) return;
        setSubmissions(approvedSubmissions);
        setTags(tagRows);
        const aggregateMap = await getAggregatesForSubmissions(
          approvedSubmissions.map((s) => s.rpo_poutinesubmissionid),
        );
        if (cancelled) return;
        setAggregates(aggregateMap);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load the Browse feed.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSubmissions = useMemo(
    () => submissions.filter((s) => matchesSearch(s, searchText) && matchesTags(s, selectedTagIds)),
    [submissions, searchText, selectedTagIds],
  );

  function handleSelect(submission: PoutineSubmissionRow) {
    setSelectedSubmissionId(submission.rpo_poutinesubmissionid);
    setView('detail');
  }

  function handleBack() {
    setSelectedSubmissionId(null);
    setView('list');
  }

  if (view === 'detail' && selectedSubmissionId) {
    return <SubmissionDetail submissionId={selectedSubmissionId} onBack={handleBack} />;
  }

  if (isLoading) {
    return <EmptyState title="Browse poutines" description="Loading approved poutines…" />;
  }

  if (loadError) {
    return <EmptyState title="Browse poutines" description={loadError} />;
  }

  return (
    <div className="browse-screen">
      <header className="browse-screen__header">
        <h1 className="browse-screen__title">Browse poutines</h1>
        <p className="browse-screen__count">
          {filteredSubmissions.length} of {submissions.length} approved poutines
        </p>
      </header>

      <BrowseFilters
        searchText={searchText}
        onSearchTextChange={setSearchText}
        tags={tags}
        selectedTagIds={selectedTagIds}
        onSelectedTagIdsChange={setSelectedTagIds}
      />

      {filteredSubmissions.length === 0 ? (
        <EmptyState
          title="No poutines match"
          description={
            submissions.length === 0
              ? 'No poutines have been approved yet — check back soon!'
              : 'Try clearing your search or tag filters.'
          }
        />
      ) : (
        <ul className="browse-screen__list">
          {filteredSubmissions.map((submission) => (
            <PoutineCard
              key={submission.rpo_poutinesubmissionid}
              submission={submission}
              aggregate={aggregates.get(submission.rpo_poutinesubmissionid)}
              onSelect={handleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
