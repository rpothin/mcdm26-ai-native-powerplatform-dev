/**
 * Read-only Leaderboards + Hall of Fame data access (Phase 5).
 *
 * Season, Category, Season Result, Season Result Entry, and Hall of Fame Entry
 * are all populated server-side by the nightly leaderboard computation flow
 * and the season rollover flow (see ARCHITECTURE.md §4 and its data model
 * §1) — including the AI-assisted "Best Critic" review-helpfulness score,
 * which only that backend flow can compute (via the Review Quality agent).
 * This module never writes to these tables and never re-derives scores
 * client-side; it only reads the already-computed snapshot.
 *
 * See memory-bank.md's Phase 5 "v1 scope decision" for why the *current*
 * season's standings are also read from the persisted `SeasonResultEntry`
 * snapshot here, rather than live-recomputed on demand as ARCHITECTURE.md's
 * "on-demand" note describes — flagged there for human revisit.
 */
import { listRows, type DataverseRow } from '../lib/dataverseClient';
import { ENTITY_SETS, SeasonStatus, type SeasonStatusValue } from './constants';

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

function formattedValue(row: DataverseRow, lookupField: string): string | null {
  return (row[`${lookupField}@OData.Community.Display.V1.FormattedValue`] as string | undefined) ?? null;
}

export interface SeasonRow {
  rpo_seasonid: string;
  rpo_name: string;
  startDate: string | null;
  endDate: string | null;
  status: SeasonStatusValue;
}

const SEASON_SELECT = ['rpo_seasonid', 'rpo_name', 'rpo_startdate', 'rpo_enddate', 'rpo_status'];

function toSeasonRow(row: DataverseRow): SeasonRow {
  return {
    rpo_seasonid: String(row.rpo_seasonid),
    rpo_name: (row.rpo_name as string | undefined) ?? '',
    startDate: (row.rpo_startdate as string | null | undefined) ?? null,
    endDate: (row.rpo_enddate as string | null | undefined) ?? null,
    status: (row.rpo_status as SeasonStatusValue | undefined) ?? SeasonStatus.Closed,
  };
}

/** All seasons, most recently started first. */
export async function listSeasons(): Promise<SeasonRow[]> {
  const rows = await listRows(ENTITY_SETS.seasons, {
    select: SEASON_SELECT,
    orderBy: ['rpo_startdate desc'],
  });
  return rows.map(toSeasonRow);
}

/**
 * The season the Leaderboards screen defaults to: the `Active` season if one
 * exists, otherwise the most recently started season (e.g. briefly between a
 * season close and the next season opening).
 */
export function pickDefaultSeason(seasons: SeasonRow[]): SeasonRow | null {
  return seasons.find((s) => s.status === SeasonStatus.Active) ?? seasons[0] ?? null;
}

export interface CategoryRow {
  rpo_categoryid: string;
  rpo_name: string;
  description: string | null;
  computationType: string | null;
}

const CATEGORY_SELECT = ['rpo_categoryid', 'rpo_name', 'rpo_description', 'rpo_computationtype'];

function toCategoryRow(row: DataverseRow): CategoryRow {
  return {
    rpo_categoryid: String(row.rpo_categoryid),
    rpo_name: (row.rpo_name as string | undefined) ?? '',
    description: (row.rpo_description as string | null | undefined) ?? null,
    computationType: (row.rpo_computationtype as string | null | undefined) ?? null,
  };
}

/**
 * Display order for the four launch categories (PRODUCT.md §Capabilities and
 * Constraints). See memory-bank.md's Phase 5 v1 scope decision. Any category
 * introduced later that isn't in this list is appended after these four,
 * alphabetically, rather than being hidden.
 */
export const LEADERBOARD_CATEGORY_ORDER = ['Best Seller', 'Top Poutine', 'Best Supporter', 'Best Critic'];

/** All Categories, ordered per {@link LEADERBOARD_CATEGORY_ORDER}. */
export async function listCategories(): Promise<CategoryRow[]> {
  const rows = await listRows(ENTITY_SETS.categories, { select: CATEGORY_SELECT });
  const categories = rows.map(toCategoryRow);
  return categories.sort((a, b) => {
    const indexA = LEADERBOARD_CATEGORY_ORDER.indexOf(a.rpo_name);
    const indexB = LEADERBOARD_CATEGORY_ORDER.indexOf(b.rpo_name);
    if (indexA === -1 && indexB === -1) return a.rpo_name.localeCompare(b.rpo_name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

export interface SeasonResultEntryRow {
  rpo_seasonresultentryid: string;
  rank: number;
  score: number | null;
  employeeId: string | null;
  employeeName: string | null;
  poutineSubmissionId: string | null;
  poutineSubmissionName: string | null;
}

/**
 * The ranked entries for a season/category, already sorted by rank. Returns
 * an empty array — never an error — when the nightly flow hasn't computed a
 * `SeasonResult` for this season/category yet, so callers render an empty
 * state instead of crashing.
 */
export async function listSeasonResultEntries(seasonId: string, categoryId: string): Promise<SeasonResultEntryRow[]> {
  const seasonResults = await listRows(ENTITY_SETS.seasonResults, {
    select: ['rpo_seasonresultid'],
    filter:
      `_rpo_seasonid_value eq '${escapeODataString(seasonId)}' ` +
      `and _rpo_categoryid_value eq '${escapeODataString(categoryId)}'`,
    top: 1,
  });
  const seasonResult = seasonResults[0];
  if (!seasonResult) return [];

  const entryRows = await listRows(ENTITY_SETS.seasonResultEntries, {
    select: ['rpo_seasonresultentryid', 'rpo_rank', 'rpo_score', '_rpo_employeeid_value', '_rpo_poutinesubmissionid_value'],
    filter: `_rpo_seasonresultid_value eq '${escapeODataString(String(seasonResult.rpo_seasonresultid))}'`,
    orderBy: ['rpo_rank asc'],
  });

  return entryRows.map((row) => ({
    rpo_seasonresultentryid: String(row.rpo_seasonresultentryid),
    rank: Number(row.rpo_rank ?? 0),
    score: (row.rpo_score as number | null | undefined) ?? null,
    employeeId: (row._rpo_employeeid_value as string | null | undefined) ?? null,
    employeeName: formattedValue(row, '_rpo_employeeid_value'),
    poutineSubmissionId: (row._rpo_poutinesubmissionid_value as string | null | undefined) ?? null,
    poutineSubmissionName: formattedValue(row, '_rpo_poutinesubmissionid_value'),
  }));
}

export interface HallOfFameEntryRow {
  rpo_halloffameentryid: string;
  seasonId: string | null;
  seasonName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  employeeId: string | null;
  employeeName: string | null;
  poutineSubmissionId: string | null;
  poutineSubmissionName: string | null;
  badgeTitle: string | null;
}

/** All-time Hall of Fame entries, most recently archived first. */
export async function listHallOfFameEntries(): Promise<HallOfFameEntryRow[]> {
  const rows = await listRows(ENTITY_SETS.hallOfFameEntries, {
    select: [
      'rpo_halloffameentryid',
      'rpo_badgetitle',
      '_rpo_seasonid_value',
      '_rpo_categoryid_value',
      '_rpo_employeeid_value',
      '_rpo_poutinesubmissionid_value',
    ],
    orderBy: ['createdon desc'],
  });
  return rows.map((row) => ({
    rpo_halloffameentryid: String(row.rpo_halloffameentryid),
    seasonId: (row._rpo_seasonid_value as string | null | undefined) ?? null,
    seasonName: formattedValue(row, '_rpo_seasonid_value'),
    categoryId: (row._rpo_categoryid_value as string | null | undefined) ?? null,
    categoryName: formattedValue(row, '_rpo_categoryid_value'),
    employeeId: (row._rpo_employeeid_value as string | null | undefined) ?? null,
    employeeName: formattedValue(row, '_rpo_employeeid_value'),
    poutineSubmissionId: (row._rpo_poutinesubmissionid_value as string | null | undefined) ?? null,
    poutineSubmissionName: formattedValue(row, '_rpo_poutinesubmissionid_value'),
    badgeTitle: (row.rpo_badgetitle as string | null | undefined) ?? null,
  }));
}
