// ABOUTME: Pure sort helpers for leaderboard entries.
// ABOUTME: Nulls always sink to the end; stable sort; supports all column keys.
import type { LeaderboardEntry, Domain } from './contracts';

export type SortColumn =
  | 'rank'
  | 'model'
  | 'reward'
  | 'delta'
  | 'tokens'
  | 'cost'
  | 'civil'
  | 'electrical'
  | 'ground'
  | 'mechanical'
  | 'structural';

export interface SortSpec {
  column: SortColumn;
  dir: 'asc' | 'desc';
}

const DOMAIN_COLS: SortColumn[] = ['civil', 'electrical', 'ground', 'mechanical', 'structural'];

function accessor(column: SortColumn): (e: LeaderboardEntry) => number | string | null {
  switch (column) {
    case 'rank':
    case 'reward':
      return (e) => e.reward;
    case 'model':
      return (e) => e.model_display.toLowerCase();
    case 'delta':
      return (e) => e.delta_vs_previous;
    case 'tokens':
      return (e) => e.mean_tokens;
    case 'cost':
      return (e) => e.mean_cost_usd;
    default:
      if (DOMAIN_COLS.includes(column)) {
        const d = column as Domain;
        return (e) => e.per_discipline[d] ?? null;
      }
      throw new Error(`Unknown sort column: ${column}`);
  }
}

function directionFactor(column: SortColumn, dir: 'asc' | 'desc'): 1 | -1 {
  if (column === 'rank') {
    // rank-asc means reward-desc
    return dir === 'asc' ? -1 : 1;
  }
  return dir === 'asc' ? 1 : -1;
}

export function sortEntries(
  entries: ReadonlyArray<LeaderboardEntry>,
  sort: SortSpec,
): LeaderboardEntry[] {
  const get = accessor(sort.column);
  const factor = directionFactor(sort.column, sort.dir);
  return [...entries].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    const aNull = va === null || va === undefined;
    const bNull = vb === null || vb === undefined;
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    if (typeof va === 'string' && typeof vb === 'string') {
      return factor * va.localeCompare(vb);
    }
    return factor * ((va as number) - (vb as number));
  });
}
