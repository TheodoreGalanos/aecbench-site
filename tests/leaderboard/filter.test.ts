// ABOUTME: Tests for filter + discipline reshape logic.
// ABOUTME: Covers: no-op, harness-only, single-discipline reshape, multi-discipline mean, and CI nulling.
import { describe, it, expect } from 'vitest';
import { filterAndReshape } from '@/lib/aec-bench/filter';
import { FIXTURE_ENTRIES, makeEntry } from './fixtures/entries';

describe('filterAndReshape', () => {
  it('returns entries unchanged when no filters are set', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, { disciplines: [], harnesses: [] });
    expect(out).toEqual(FIXTURE_ENTRIES);
  });

  it('filters by harness (adapter) without reshaping reward', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: [],
      harnesses: ['tool_loop'],
    });
    expect(out.every((e) => e.adapter === 'tool_loop')).toBe(true);
    const llama = out.find((e) => e.model_key === 'llama-3.3-70b');
    expect(llama?.reward).toBe(0.66);
    expect(llama?.reward_ci).toEqual([0.62, 0.70]);
  });

  it('reshapes reward to per-discipline when one discipline is selected', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: ['civil'],
      harnesses: [],
    });
    const opus = out.find((e) => e.model_key === 'claude-opus-4.7');
    expect(opus?.reward).toBe(0.84);
    expect(opus?.reward_ci).toBeNull();
  });

  it('reshapes reward to the mean of selected disciplines when multiple are picked', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: ['civil', 'electrical'],
      harnesses: [],
    });
    const opus = out.find((e) => e.model_key === 'claude-opus-4.7');
    expect(opus?.reward).toBeCloseTo(0.815, 5);
    expect(opus?.reward_ci).toBeNull();
  });

  it('combines harness and discipline filters', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: ['civil'],
      harnesses: ['rlm'],
    });
    expect(out.length).toBe(1);
    expect(out[0].model_key).toBe('claude-opus-4.7');
    expect(out[0].reward).toBe(0.84);
  });

  it('drops entries that have no per-discipline score for any selected discipline', () => {
    const e = makeEntry({
      model_key: 'incomplete',
      per_discipline: { civil: 0.9 } as any,
    });
    const out = filterAndReshape([e], { disciplines: ['mechanical'], harnesses: [] });
    expect(out).toEqual([]);
  });

  it('does not mutate the input entries', () => {
    const before = structuredClone(FIXTURE_ENTRIES);
    filterAndReshape(FIXTURE_ENTRIES, { disciplines: ['civil'], harnesses: [] });
    expect(FIXTURE_ENTRIES).toEqual(before);
  });
});
