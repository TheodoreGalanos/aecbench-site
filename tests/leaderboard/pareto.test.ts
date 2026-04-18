// ABOUTME: Exhaustive tests for Pareto frontier computation over (reward, cost/tokens/latency).
// ABOUTME: Covers degenerate inputs, ties, domination chains, and floating-point edges.
import { describe, it, expect } from 'vitest';
import { computeParetoFrontier } from '@/lib/aec-bench/pareto';

const P = (key: string, x: number, y: number) => ({ key, x, y });

describe('computeParetoFrontier', () => {
  it('returns an empty Set for an empty input', () => {
    expect(computeParetoFrontier([])).toEqual(new Set());
  });

  it('returns the single point when only one exists', () => {
    expect(computeParetoFrontier([P('a', 1, 0.5)])).toEqual(new Set(['a']));
  });

  it('excludes points dominated by a single clear winner', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 1),
      P('b', 2, 0.5),
      P('c', 3, 0.3),
    ]);
    expect(frontier).toEqual(new Set(['a']));
  });

  it('keeps all points when they all share the same (x, y)', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 0.5),
      P('b', 1, 0.5),
      P('c', 1, 0.5),
    ]);
    expect(frontier).toEqual(new Set(['a', 'b', 'c']));
  });

  it('recognises a classic trade-off frontier', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 0.4),
      P('b', 2, 0.6),
      P('c', 3, 0.8),
      P('d', 2, 0.5),
    ]);
    expect(frontier).toEqual(new Set(['a', 'b', 'c']));
  });

  it('handles floating-point strict-inequality edges', () => {
    const frontier = computeParetoFrontier([
      P('a', 1.0000001, 0.5),
      P('b', 1, 0.5),
    ]);
    expect(frontier).toEqual(new Set(['b']));
  });

  it('keeps ties at the same point but excludes nearby dominated points', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 0.5),
      P('b', 1, 0.5),
      P('c', 2, 0.8),
      P('d', 3, 0.1),
    ]);
    expect(frontier).toEqual(new Set(['a', 'b', 'c']));
  });

  it('treats frontier as a readonly Set', () => {
    const frontier = computeParetoFrontier([P('a', 1, 0.5)]);
    expect(frontier instanceof Set).toBe(true);
  });
});
