import type { HallOfFameEntryRow } from '../../data/leaderboards';
import { EmptyState } from '../EmptyState/EmptyState';
import './HallOfFameList.css';

interface HallOfFameListProps {
  entries: HallOfFameEntryRow[];
  isLoading: boolean;
}

/**
 * All-time Hall of Fame: one crowned champion per season/category, archived
 * by the season rollover flow (ARCHITECTURE.md §4). Grouped by season,
 * most-recently-archived season first.
 */
export function HallOfFameList({ entries, isLoading }: HallOfFameListProps) {
  if (isLoading) {
    return <EmptyState title="Hall of Fame" description="Loading past champions\u2026" />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Hall of Fame"
        description="No seasons have closed yet \u2014 champions are crowned here once the season rollover flow archives a season's winners."
      />
    );
  }

  const bySeasonName = new Map<string, HallOfFameEntryRow[]>();
  for (const entry of entries) {
    const key = entry.seasonName ?? 'Unknown season';
    const group = bySeasonName.get(key) ?? [];
    group.push(entry);
    bySeasonName.set(key, group);
  }

  return (
    <div className="hall-of-fame">
      {Array.from(bySeasonName.entries()).map(([seasonName, seasonEntries]) => (
        <section key={seasonName} className="hall-of-fame__season">
          <h3 className="hall-of-fame__season-title">{seasonName}</h3>
          <ul className="hall-of-fame__list">
            {seasonEntries.map((entry) => (
              <li key={entry.rpo_halloffameentryid} className="hall-of-fame__card">
                <span className="hall-of-fame__medal" aria-hidden="true">
                  🏆
                </span>
                <div className="hall-of-fame__body">
                  <p className="hall-of-fame__category">{entry.categoryName ?? 'Category'}</p>
                  <p className="hall-of-fame__winner">{entry.employeeName ?? entry.poutineSubmissionName ?? 'Unknown'}</p>
                  {entry.badgeTitle && <p className="hall-of-fame__badge">{entry.badgeTitle}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
