// tests/ingest/aggregate-rank.test.ts
// ABOUTME: Ranking by reward desc, cost asc tiebreak, complete_trials desc second tiebreak.
// ABOUTME: Delta is computed against a previous snapshot; new rows produce delta=null.
import { describe, it, expect } from 'vitest';
import { rankEntries, applyDelta } from '@/scripts/ingest/aggregate';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';

function makeEntry(over: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    rank: 0,
    model_key: 'm/tool_loop',
    model_display: 'M',
    provider: 'anthropic',
    adapter: 'tool_loop',
    reward: 0.5,
    reward_ci: null,
    per_discipline: {},
    trials: 1,
    complete_trials: 1,
    repetitions: 1,
    mean_cost_usd: null,
    total_cost_usd: null,
    mean_tokens: null,
    mean_duration_seconds: null,
    dataset: 'aec-bench@0.4.1',
    last_submission: '2026-04-10T12:00:00Z',
    submission_count: 1,
    delta_vs_previous: null,
    ...over,
  };
}

describe('rankEntries', () => {
  it('sorts by reward desc primary', () => {
    const input = [
      makeEntry({ model_key: 'a/t', reward: 0.5 }),
      makeEntry({ model_key: 'b/t', reward: 0.7 }),
      makeEntry({ model_key: 'c/t', reward: 0.6 }),
    ];
    const ranked = rankEntries(input);
    expect(ranked.map((e) => e.model_key)).toEqual(['b/t', 'c/t', 'a/t']);
    expect(ranked.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it('tiebreaks by mean_cost_usd asc, nulls last', () => {
    const input = [
      makeEntry({ model_key: 'a/t', reward: 0.7, mean_cost_usd: 0.5 }),
      makeEntry({ model_key: 'b/t', reward: 0.7, mean_cost_usd: 0.3 }),
      makeEntry({ model_key: 'c/t', reward: 0.7, mean_cost_usd: null }),
    ];
    const ranked = rankEntries(input);
    expect(ranked.map((e) => e.model_key)).toEqual(['b/t', 'a/t', 'c/t']);
  });

  it('tiebreaks second on complete_trials desc', () => {
    const input = [
      makeEntry({ model_key: 'a/t', reward: 0.7, mean_cost_usd: 0.3, complete_trials: 2 }),
      makeEntry({ model_key: 'b/t', reward: 0.7, mean_cost_usd: 0.3, complete_trials: 5 }),
    ];
    const ranked = rankEntries(input);
    expect(ranked[0].model_key).toBe('b/t');
  });
});

describe('applyDelta', () => {
  it('sets delta_vs_previous to the difference for matched rows', () => {
    const current = [makeEntry({ model_key: 'a/t', reward: 0.7 })];
    const previous = [{ model_key: 'a/t', reward: 0.65 }];
    const out = applyDelta(current, previous);
    expect(out[0].delta_vs_previous).toBeCloseTo(0.05, 5);
  });

  it('sets delta=null for new rows not present previously', () => {
    const current = [makeEntry({ model_key: 'a/t', reward: 0.7 })];
    const previous: Array<{ model_key: string; reward: number }> = [];
    const out = applyDelta(current, previous);
    expect(out[0].delta_vs_previous).toBeNull();
  });
});
