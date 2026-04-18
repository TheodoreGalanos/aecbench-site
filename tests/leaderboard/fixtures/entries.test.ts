// ABOUTME: Sanity test for the synthetic LeaderboardEntry fixture helper.
// ABOUTME: The fixtures themselves are trivial; this test just guards their shape.
import { describe, it, expect } from 'vitest';
import { makeEntry, FIXTURE_ENTRIES } from './entries';
import { LeaderboardEntrySchema } from '@/lib/aec-bench/contracts';

describe('fixture entries', () => {
  it('makeEntry produces a schema-valid entry with overridable fields', () => {
    const e = makeEntry({ model_display: 'Test Model', reward: 0.75 });
    expect(LeaderboardEntrySchema.parse(e)).toMatchObject({
      model_display: 'Test Model',
      reward: 0.75,
    });
  });

  it('FIXTURE_ENTRIES is a non-empty, schema-valid array', () => {
    expect(FIXTURE_ENTRIES.length).toBeGreaterThan(3);
    for (const e of FIXTURE_ENTRIES) {
      expect(() => LeaderboardEntrySchema.parse(e)).not.toThrow();
    }
  });

  it('FIXTURE_ENTRIES has varied providers and adapters for downstream tests', () => {
    const providers = new Set(FIXTURE_ENTRIES.map((e) => e.provider));
    const adapters = new Set(FIXTURE_ENTRIES.map((e) => e.adapter));
    expect(providers.size).toBeGreaterThanOrEqual(3);
    expect(adapters.size).toBeGreaterThanOrEqual(2);
  });
});
