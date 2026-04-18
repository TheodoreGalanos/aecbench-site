// ABOUTME: Tests for axis metric accessors and formatters across cost / tokens / latency.
// ABOUTME: Format strings must degrade gracefully for extreme magnitudes and nulls.
import { describe, it, expect } from 'vitest';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { makeEntry } from './fixtures/entries';

describe('AXIS_METRICS', () => {
  it('exposes cost / tokens / latency keys', () => {
    expect(Object.keys(AXIS_METRICS).sort()).toEqual(['cost', 'latency', 'tokens']);
  });

  describe('cost', () => {
    const m = AXIS_METRICS.cost;
    it('accesses mean_cost_usd', () => {
      expect(m.accessor(makeEntry({ mean_cost_usd: 1.5 }))).toBe(1.5);
      expect(m.accessor(makeEntry({ mean_cost_usd: null }))).toBeNull();
    });
    it('formats small values with two decimals', () => {
      expect(m.format(0.01)).toBe('$0.01');
      expect(m.format(1.8)).toBe('$1.80');
      expect(m.format(1234.56)).toBe('$1234.56');
    });
  });

  describe('tokens', () => {
    const m = AXIS_METRICS.tokens;
    it('accesses mean_tokens', () => {
      expect(m.accessor(makeEntry({ mean_tokens: 46000 }))).toBe(46000);
      expect(m.accessor(makeEntry({ mean_tokens: null }))).toBeNull();
    });
    it('formats as k / M with one decimal above 10k', () => {
      expect(m.format(500)).toBe('500');
      expect(m.format(9_999)).toBe('10.0k');
      expect(m.format(46_000)).toBe('46.0k');
      expect(m.format(1_200_000)).toBe('1.2M');
    });
  });

  describe('latency', () => {
    const m = AXIS_METRICS.latency;
    it('accesses mean_duration_seconds', () => {
      expect(m.accessor(makeEntry({ mean_duration_seconds: 12.4 }))).toBe(12.4);
      expect(m.accessor(makeEntry({ mean_duration_seconds: null }))).toBeNull();
    });
    it('formats seconds below 60 as Ns, otherwise as Nmin', () => {
      expect(m.format(5.1)).toBe('5.1s');
      expect(m.format(12.4)).toBe('12.4s');
      expect(m.format(59.9)).toBe('59.9s');
      expect(m.format(60)).toBe('1.0min');
      expect(m.format(138)).toBe('2.3min');
    });
  });

  it('carries a label with units', () => {
    expect(AXIS_METRICS.cost.label).toMatch(/cost/i);
    expect(AXIS_METRICS.tokens.label).toMatch(/tokens/i);
    expect(AXIS_METRICS.latency.label).toMatch(/latency/i);
  });
});
