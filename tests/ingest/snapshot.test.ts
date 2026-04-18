// tests/ingest/snapshot.test.ts
// ABOUTME: Loads the most-recent committed leaderboard snapshot for delta computation.
// ABOUTME: Absence is not an error — returns an empty previous set.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { loadPreviousSnapshot } from '@/scripts/ingest/snapshot';

const WITH_ROOT = resolve(__dirname, 'fixtures/snapshot/with');
const WITHOUT_ROOT = resolve(__dirname, 'fixtures/snapshot/without');

describe('loadPreviousSnapshot', () => {
  it('returns the most-recent snapshot when multiple exist', async () => {
    const rows = await loadPreviousSnapshot(WITH_ROOT);
    expect(rows).toContainEqual({ model_key: 'claude-sonnet-4/tool_loop', reward: 0.7 });
  });

  it('returns [] when no snapshots are committed', async () => {
    const rows = await loadPreviousSnapshot(WITHOUT_ROOT);
    expect(rows).toEqual([]);
  });
});
