// lib/aec-bench/read.ts
// ABOUTME: Thin read-side helpers over the build-emitted leaderboard artefact.
// ABOUTME: Pages import from here instead of reading results/ directly.
import artefact from '@/public/data/leaderboard.json';
import type { LeaderboardArtefact, LeaderboardEntry } from '@/lib/aec-bench/contracts';

const leaderboard = artefact as unknown as LeaderboardArtefact;

export function getTopN(n: number): LeaderboardEntry[] {
  return leaderboard.entries.slice(0, n);
}

export function getAllEntries(): LeaderboardEntry[] {
  return leaderboard.entries;
}

export async function getByDiscipline(domain: string): Promise<LeaderboardArtefact> {
  const mod = await import(`@/public/data/disciplines/${domain}.json`);
  return mod.default as unknown as LeaderboardArtefact;
}

export function getRunStatus() {
  return leaderboard.run_status;
}

export function getDataset() {
  return leaderboard.dataset;
}

export function isMock(): boolean {
  return leaderboard.is_mock;
}
