// ABOUTME: Pure filter + discipline-reshape for leaderboard entries.
// ABOUTME: When discipline filter is active, entry reward becomes the mean of selected per-discipline scores.
import type { LeaderboardEntry, Domain } from './contracts';

export interface LeaderboardFilters {
  disciplines: Domain[];
  harnesses: string[];
}

export function filterAndReshape(
  entries: ReadonlyArray<LeaderboardEntry>,
  filters: LeaderboardFilters,
): LeaderboardEntry[] {
  const { disciplines, harnesses } = filters;
  const harnessActive = harnesses.length > 0;
  const disciplineActive = disciplines.length > 0;

  const out: LeaderboardEntry[] = [];
  for (const e of entries) {
    if (harnessActive && !harnesses.includes(e.adapter)) continue;

    if (!disciplineActive) {
      out.push(e);
      continue;
    }

    const perDisciplineScores: number[] = [];
    let missing = false;
    for (const d of disciplines) {
      const v = e.per_discipline[d];
      if (v === undefined || v === null) {
        missing = true;
        break;
      }
      perDisciplineScores.push(v);
    }
    if (missing) continue;

    const mean =
      perDisciplineScores.reduce((s, v) => s + v, 0) / perDisciplineScores.length;
    out.push({ ...e, reward: mean, reward_ci: null });
  }
  return out;
}
