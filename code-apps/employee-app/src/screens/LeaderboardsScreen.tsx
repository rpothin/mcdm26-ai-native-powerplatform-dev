import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState/EmptyState";
import { Badge } from "../components/StatusBadge/StatusBadge";
import { LeaderboardTable } from "../components/LeaderboardTable/LeaderboardTable";
import { HallOfFameList } from "../components/HallOfFame/HallOfFameList";
import {
  listCategories,
  listHallOfFameEntries,
  listSeasonResultEntries,
  listSeasons,
  pickDefaultSeason,
  type CategoryRow,
  type HallOfFameEntryRow,
  type SeasonResultEntryRow,
  type SeasonRow,
} from "../data/leaderboards";
import { SeasonStatus } from "../data/constants";
import "./LeaderboardsScreen.css";

/**
 * Leaderboards & Hall of Fame (Phase 5) — a read-only display of the
 * already-computed `SeasonResult`/`SeasonResultEntry`/`HallOfFameEntry`
 * snapshot (see src/data/leaderboards.ts and memory-bank.md's v1 scope
 * decision). This screen never computes standings itself.
 */
export function LeaderboardsScreen() {
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [entries, setEntries] = useState<SeasonResultEntryRow[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntryRow[]>([]);
  const [isLoadingShell, setIsLoadingShell] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoadingShell(true);
        const [seasonRows, categoryRows, hallOfFameRows] = await Promise.all([
          listSeasons(),
          listCategories(),
          listHallOfFameEntries(),
        ]);
        if (cancelled) return;
        setSeasons(seasonRows);
        setCategories(categoryRows);
        setHallOfFame(hallOfFameRows);
        setSelectedSeasonId(pickDefaultSeason(seasonRows)?.rpo_seasonid ?? null);
        setSelectedCategoryId(categoryRows[0]?.rpo_categoryid ?? null);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load leaderboards.");
      } finally {
        if (!cancelled) setIsLoadingShell(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSeasonId || !selectedCategoryId) return;
    let cancelled = false;
    async function loadEntries() {
      setIsLoadingEntries(true);
      try {
        const rows = await listSeasonResultEntries(selectedSeasonId!, selectedCategoryId!);
        if (cancelled) return;
        setEntries(rows);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load standings.");
      } finally {
        if (!cancelled) setIsLoadingEntries(false);
      }
    }
    loadEntries();
    return () => {
      cancelled = true;
    };
  }, [selectedSeasonId, selectedCategoryId]);

  const selectedSeason = useMemo(
    () => seasons.find((s) => s.rpo_seasonid === selectedSeasonId) ?? null,
    [seasons, selectedSeasonId],
  );
  const selectedCategory = useMemo(
    () => categories.find((c) => c.rpo_categoryid === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  if (isLoadingShell) {
    return <EmptyState title="Leaderboards & Hall of Fame" description="Loading seasons\u2026" />;
  }

  if (loadError) {
    return <EmptyState title="Leaderboards & Hall of Fame" description={loadError} />;
  }

  if (seasons.length === 0) {
    return (
      <EmptyState
        title="Leaderboards & Hall of Fame"
        description="No seasons have been created yet. Once a Season is set up in Dataverse, standings will appear here."
      />
    );
  }

  return (
    <div className="leaderboards-screen">
      <header className="leaderboards-screen__header">
        <p className="leaderboards-screen__eyebrow">Phase 5</p>
        <h1 className="leaderboards-screen__title">Leaderboards & Hall of Fame</h1>
      </header>

      <section className="leaderboards-screen__section">
        <div className="leaderboards-screen__season-row">
          <label className="leaderboards-screen__season-label" htmlFor="season-select">
            Season
          </label>
          <select
            id="season-select"
            className="leaderboards-screen__season-select"
            value={selectedSeasonId ?? ""}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
          >
            {seasons.map((season) => (
              <option key={season.rpo_seasonid} value={season.rpo_seasonid}>
                {season.rpo_name}
              </option>
            ))}
          </select>
          {selectedSeason && (
            <Badge
              label={selectedSeason.status === SeasonStatus.Active ? "Active" : "Closed"}
              variant={selectedSeason.status === SeasonStatus.Active ? "approved" : "draft"}
            />
          )}
        </div>

        <nav className="leaderboards-screen__tabs" aria-label="Leaderboard categories">
          {categories.map((category) => (
            <button
              key={category.rpo_categoryid}
              type="button"
              className={`leaderboards-screen__tab${
                category.rpo_categoryid === selectedCategoryId ? " leaderboards-screen__tab--active" : ""
              }`}
              onClick={() => setSelectedCategoryId(category.rpo_categoryid)}
            >
              {category.rpo_name}
            </button>
          ))}
        </nav>

        {selectedCategory && (
          <LeaderboardTable category={selectedCategory} entries={entries} isLoading={isLoadingEntries} />
        )}
      </section>

      <section className="leaderboards-screen__section">
        <h2 className="leaderboards-screen__section-title">Hall of Fame</h2>
        <HallOfFameList entries={hallOfFame} isLoading={false} />
      </section>
    </div>
  );
}
