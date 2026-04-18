// scripts/ingest/emit.ts
// ABOUTME: Writes leaderboard.json, per-discipline slices, and per-model stubs to public/data.
// ABOUTME: Slices re-rank entries within the discipline; stubs are one LeaderboardEntry per file.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  DOMAINS,
  type Domain,
  type LeaderboardArtefact,
  type LeaderboardEntry,
} from '@/lib/aec-bench/contracts';
import { rankEntries } from '@/scripts/ingest/aggregate';

export async function emitArtefacts(projectRoot: string, artefact: LeaderboardArtefact): Promise<void> {
  const outDir = resolve(projectRoot, 'public/data');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await writeFile(join(outDir, 'leaderboard.json'), JSON.stringify(artefact, null, 2));

  await mkdir(join(outDir, 'disciplines'), { recursive: true });
  for (const domain of DOMAINS) {
    const slice = buildSlice(artefact, domain);
    if (slice.entries.length === 0) continue;
    await writeFile(join(outDir, 'disciplines', `${domain}.json`), JSON.stringify(slice, null, 2));
  }

  await mkdir(join(outDir, 'models'), { recursive: true });
  for (const entry of artefact.entries) {
    const fileKey = entry.model_key.replace('/', '-');
    await writeFile(
      join(outDir, 'models', `${fileKey}.json`),
      JSON.stringify(entry, null, 2),
    );
  }
}

function buildSlice(artefact: LeaderboardArtefact, domain: Domain): LeaderboardArtefact {
  const filtered: LeaderboardEntry[] = artefact.entries
    .filter((e) => e.per_discipline[domain] !== undefined)
    .map((e) => ({
      ...e,
      reward: e.per_discipline[domain] ?? e.reward,
    }));
  return {
    ...artefact,
    entries: rankEntries(filtered),
  };
}
