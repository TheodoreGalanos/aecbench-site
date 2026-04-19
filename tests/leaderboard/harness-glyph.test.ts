// ABOUTME: Tests for harness glyph mapping (adapter string → SVG shape name).
// ABOUTME: Known adapters map to canonical shapes; unknown adapters fall back to diamond.
import { describe, it, expect } from 'vitest';
import { harnessGlyph, KNOWN_HARNESSES } from '@/lib/aec-bench/harness-glyph';

describe('harnessGlyph', () => {
  it('maps known adapters to their canonical shapes', () => {
    expect(harnessGlyph('tool_loop')).toBe('circle');
    expect(harnessGlyph('rlm')).toBe('square');
    expect(harnessGlyph('direct')).toBe('triangle');
    expect(harnessGlyph('lambda-rlm')).toBe('ring');
  });

  it('falls back to diamond for any unrecognised adapter', () => {
    expect(harnessGlyph('swarm')).toBe('diamond');
    expect(harnessGlyph('')).toBe('diamond');
    expect(harnessGlyph('TOOL_LOOP')).toBe('diamond'); // case-sensitive by design
  });

  it('KNOWN_HARNESSES lists exactly the adapters with canonical shapes', () => {
    expect(KNOWN_HARNESSES).toEqual(['tool_loop', 'rlm', 'direct', 'lambda-rlm']);
  });
});
