// tests/ingest/orchestrator.test.ts
// ABOUTME: End-to-end ingest from a committed fixture tree to emitted artefacts.
// ABOUTME: Exercises discovery, validation, aggregation, ranking, delta, emit in one pass.
import { describe, it, expect, beforeEach } from 'vitest';
import { cp, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runIngest } from '@/scripts/ingest/index';

const FIXTURE_SRC = resolve(__dirname, 'fixtures/e2e');
let tempRoot: string;

beforeEach(async () => {
  tempRoot = await mkdtemp(join(tmpdir(), 'ingest-e2e-'));
  await cp(FIXTURE_SRC, tempRoot, { recursive: true });
});

describe('runIngest', () => {
  it('produces a leaderboard.json matching the expected snapshot', async () => {
    await runIngest({ projectRoot: tempRoot });
    const raw = await readFile(join(tempRoot, 'public/data/leaderboard.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.is_mock).toBe(false);
    expect(parsed.entries[0].rank).toBe(1);
    expect(parsed.entries[1].rank).toBe(2);
    expect(parsed.run_status.models).toBe(2);
  });

  it('sets is_mock=true when any experiment flags mock', async () => {
    // Patch one submission to mock: true
    const subPath = join(tempRoot, 'results/experiments/exp-a/submission.yml');
    const raw = await readFile(subPath, 'utf-8');
    await (await import('node:fs/promises')).writeFile(subPath, raw + '\nmock: true\n');
    await runIngest({ projectRoot: tempRoot });
    const parsed = JSON.parse(
      await readFile(join(tempRoot, 'public/data/leaderboard.json'), 'utf-8'),
    );
    expect(parsed.is_mock).toBe(true);
  });
});
