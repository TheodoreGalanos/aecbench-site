// ABOUTME: Exercises the page-side helpers over the emitted leaderboard artefact.
// ABOUTME: Assumes committed public/data/leaderboard.json exists and validates as release data.
import { describe, it, expect } from 'vitest';
import { getTopN, getRunStatus, isMock } from '@/lib/aec-bench/read';

describe('read layer', () => {
  it('returns the top N entries sorted by rank', () => {
    const top = getTopN(3);
    expect(top).toHaveLength(3);
    expect(top[0].rank).toBe(1);
    expect(top[2].rank).toBe(3);
  });

  it('exposes run_status for the status bar', () => {
    const status = getRunStatus();
    expect(status.tasks).toBe(552);
    expect(status.models).toBe(18);
    expect(status.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('reports is_mock correctly from the committed artefact', () => {
    expect(isMock()).toBe(false);
  });
});
