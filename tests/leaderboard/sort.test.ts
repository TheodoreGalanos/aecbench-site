// ABOUTME: Tests for leaderboard sort helpers (numeric, alpha, nullable delta, per-discipline).
// ABOUTME: Null values always sink to the end regardless of asc/desc.
import { describe, it, expect } from 'vitest';
import { sortEntries, type SortColumn } from '@/lib/aec-bench/sort';
import { FIXTURE_ENTRIES, makeEntry } from './fixtures/entries';

describe('sortEntries', () => {
  it('sorts by reward descending by default (rank=asc)', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'rank', dir: 'asc' });
    expect(out.map((e) => e.model_key)).toEqual([
      'claude-opus-4.7', 'gpt-4o', 'gemini-2.5-pro', 'llama-3.3-70b', 'haiku-4.5',
    ]);
  });

  it('sorts by reward ascending', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'reward', dir: 'asc' });
    expect(out[0].model_key).toBe('haiku-4.5');
    expect(out[out.length - 1].model_key).toBe('claude-opus-4.7');
  });

  it('sorts by cost ascending', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'cost', dir: 'asc' });
    expect(out[0].model_key).toBe('haiku-4.5');
  });

  it('sinks null delta to the end regardless of direction', () => {
    const ascOut = sortEntries(FIXTURE_ENTRIES, { column: 'delta', dir: 'asc' });
    expect(ascOut[ascOut.length - 1].model_key).toBe('llama-3.3-70b');
    const descOut = sortEntries(FIXTURE_ENTRIES, { column: 'delta', dir: 'desc' });
    expect(descOut[descOut.length - 1].model_key).toBe('llama-3.3-70b');
  });

  it('sorts alphabetically by model display', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'model', dir: 'asc' });
    const first = out[0].model_display.toLowerCase();
    const last = out[out.length - 1].model_display.toLowerCase();
    expect(first.localeCompare(last)).toBeLessThan(0);
  });

  it('sorts by a per-discipline column', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'mechanical', dir: 'desc' });
    expect(out[0].per_discipline.mechanical).toBeGreaterThanOrEqual(out[1].per_discipline.mechanical!);
  });

  it('is stable under ties', () => {
    const a = makeEntry({ model_key: 'a', reward: 0.5 });
    const b = makeEntry({ model_key: 'b', reward: 0.5 });
    const c = makeEntry({ model_key: 'c', reward: 0.5 });
    const out = sortEntries([a, b, c], { column: 'reward', dir: 'desc' });
    expect(out.map((e) => e.model_key)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input array', () => {
    const before = [...FIXTURE_ENTRIES];
    sortEntries(FIXTURE_ENTRIES, { column: 'reward', dir: 'asc' });
    expect(FIXTURE_ENTRIES).toEqual(before);
  });

  it('accepts all sort columns without throwing', () => {
    const cols: SortColumn[] = [
      'rank', 'model', 'reward', 'delta', 'tokens', 'cost',
      'civil', 'electrical', 'ground', 'mechanical', 'structural',
    ];
    for (const c of cols) {
      expect(() => sortEntries(FIXTURE_ENTRIES, { column: c, dir: 'asc' })).not.toThrow();
    }
  });
});
