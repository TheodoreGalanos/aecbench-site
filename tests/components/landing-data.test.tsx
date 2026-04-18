// tests/components/landing-data.test.tsx
// ABOUTME: Validates the shape of previewModels as adapted from the live leaderboard artefact.
// ABOUTME: We assert field types, not specific values — real rewards change over time.
import { describe, it, expect } from 'vitest';
import { previewModels } from '@/components/landing/data';

describe('previewModels', () => {
  it('produces 4 adapted preview rows', () => {
    expect(previewModels).toHaveLength(4);
  });

  it('every row carries extended shape fields with the right types', () => {
    for (const m of previewModels) {
      expect(typeof m.rank).toBe('number');
      expect(typeof m.model).toBe('string');
      expect(m.provider).toMatch(/^(anthropic|openai|google|meta|other)$/);
      expect(typeof m.overallScore).toBe('number');
      expect(typeof m.tokensMillions).toBe('number');
      expect(typeof m.costUsd).toBe('number');
      expect(typeof m.deltaLastRun).toBe('number');
      expect(typeof m.costPerTask).toBe('number');
      expect(m.disciplines).toHaveProperty('civil');
      expect(m.disciplines).toHaveProperty('electrical');
    }
  });

  it('is sorted by rank ascending', () => {
    const ranks = previewModels.map((m) => m.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
