import type { CategoryRow, SeasonResultEntryRow } from '../../data/leaderboards';
import { EmptyState } from '../EmptyState/EmptyState';
import './LeaderboardTable.css';

interface LeaderboardTableProps {
  category: CategoryRow;
  entries: SeasonResultEntryRow[];
  isLoading: boolean;
}

/** Formats a SeasonResultEntry's score for display, based on the category's computation type. */
function formatScore(score: number | null, computationType: string | null): string {
  if (score === null) return '\u2014';
  switch (computationType) {
    case 'try_count_by_submitter':
    case 'try_count_by_employee':
      return `${Math.round(score)} ${Math.round(score) === 1 ? 'try' : 'tries'}`;
    case 'weighted_rating':
      return `\u2605 ${score.toFixed(2)}`;
    case 'review_helpfulness_score':
      return `${Math.round(score * 100)}%`;
    default:
      return score.toFixed(2);
  }
}

const RANK_MODIFIER: Record<number, string> = { 1: 'gold', 2: 'silver', 3: 'bronze' };

/**
 * Renders the ranked standings for one Category within the selected Season,
 * reading the already-computed `SeasonResultEntry` snapshot (Phase 5). Shows
 * the full ranked list per ARCHITECTURE.md's "full ranked-list snapshot"
 * decision, with the top 3 visually emphasized (see memory-bank.md's v1
 * scope decision on display depth). Renders an {@link EmptyState} instead of
 * a table when the nightly computation hasn't produced results yet.
 */
export function LeaderboardTable({ category, entries, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return <EmptyState title={category.rpo_name} description="Loading standings\u2026" />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title={category.rpo_name}
        description="No standings yet for this season \u2014 the nightly leaderboard computation hasn't run for this category, or the season just started. Check back soon."
      />
    );
  }

  return (
    <div className="leaderboard-table">
      {category.description && <p className="leaderboard-table__description">{category.description}</p>}
      <ol className="leaderboard-table__list">
        {entries.map((entry) => {
          const modifier = RANK_MODIFIER[entry.rank];
          const name = entry.employeeName ?? entry.poutineSubmissionName ?? 'Unknown';
          return (
            <li
              key={entry.rpo_seasonresultentryid}
              className={`leaderboard-table__row${modifier ? ` leaderboard-table__row--${modifier}` : ''}`}
            >
              <span className="leaderboard-table__rank">#{entry.rank}</span>
              <span className="leaderboard-table__name">{name}</span>
              <span className="leaderboard-table__score">{formatScore(entry.score, category.computationType)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
