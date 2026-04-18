// ABOUTME: Copies the current public/data/leaderboard.json to results/snapshots/ with a date-stamped name.
// ABOUTME: Run manually after a batch of submissions is merged; sets the new baseline for delta.
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function promote(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const src = resolve(process.cwd(), 'public/data/leaderboard.json');
  const dstDir = resolve(process.cwd(), 'results/snapshots');
  const dst = resolve(dstDir, `leaderboard-${today}.json`);
  await mkdir(dstDir, { recursive: true });
  await copyFile(src, dst);
  console.log(`Promoted snapshot to ${dst}`);
}

promote().catch((err) => {
  console.error(err);
  process.exit(1);
});
