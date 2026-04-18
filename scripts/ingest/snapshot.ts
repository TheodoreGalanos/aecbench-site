// scripts/ingest/snapshot.ts
// ABOUTME: Loads the most-recent committed leaderboard snapshot for delta computation.
// ABOUTME: Only the (model_key, reward) pairs are needed; the rest of the artefact is ignored.
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { PreviousRow } from '@/scripts/ingest/aggregate';

export async function loadPreviousSnapshot(projectRoot: string): Promise<PreviousRow[]> {
  const dir = resolve(projectRoot, 'results/snapshots');
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const snapshots = files.filter((f) => f.startsWith('leaderboard-') && f.endsWith('.json')).sort();
  if (snapshots.length === 0) return [];
  const latest = snapshots[snapshots.length - 1];
  const raw = await readFile(join(dir, latest), 'utf-8');
  const parsed = JSON.parse(raw) as { entries: Array<{ model_key: string; reward: number }> };
  return parsed.entries.map(({ model_key, reward }) => ({ model_key, reward }));
}
