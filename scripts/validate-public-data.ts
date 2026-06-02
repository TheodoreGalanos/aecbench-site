// ABOUTME: Validates committed public/data leaderboard artefacts before dev/build.
// ABOUTME: Prevents Vercel from deploying malformed or stale generated JSON.
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DOMAINS, LeaderboardArtefactSchema, LeaderboardEntrySchema } from '@/lib/aec-bench/contracts';

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf-8'));
}

async function main() {
  const root = process.cwd();
  const dataDir = resolve(root, 'public/data');
  const leaderboardPath = join(dataDir, 'leaderboard.json');
  const leaderboard = LeaderboardArtefactSchema.parse(await readJson(leaderboardPath));

  for (const domain of DOMAINS) {
    const slicePath = join(dataDir, 'disciplines', `${domain}.json`);
    const slice = LeaderboardArtefactSchema.parse(await readJson(slicePath));
    for (const entry of slice.entries) {
      if (entry.per_discipline[domain] === undefined) {
        throw new Error(`${slicePath}: ${entry.model_key} is missing ${domain} reward`);
      }
    }
  }

  for (const entry of leaderboard.entries) {
    const modelPath = join(dataDir, 'models', `${entry.model_key.replace('/', '-')}.json`);
    const model = await readJson(modelPath);
    LeaderboardEntrySchema.parse(model);
  }

  process.stdout.write(
    `[data:validate] ${leaderboard.entries.length} models, ${leaderboard.run_status.tasks} tasks, ` +
      `${leaderboard.is_mock ? 'preview' : 'real'} data\n`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
