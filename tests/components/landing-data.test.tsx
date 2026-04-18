// ABOUTME: Validates the shape and values of landing-page stub data.
// ABOUTME: Ensures PreviewModel extensions and runStatus are populated for all consumers.
import { describe, it, expect } from 'vitest';
import { previewModels } from '@/components/landing/data';
import { runStatus } from '@/components/landing/run-status';

describe('previewModels', () => {
  it('has exactly 4 models with extended fields', () => {
    expect(previewModels).toHaveLength(4);
    for (const m of previewModels) {
      expect(m.provider).toMatch(/^(anthropic|openai|google|meta)$/);
      expect(typeof m.tokensMillions).toBe('number');
      expect(typeof m.costUsd).toBe('number');
      expect(typeof m.deltaLastRun).toBe('number');
      expect(typeof m.costPerTask).toBe('number');
    }
  });

  it('puts Claude Sonnet 4 at rank 1', () => {
    expect(previewModels[0].model).toBe('Claude Sonnet 4');
    expect(previewModels[0].provider).toBe('anthropic');
    expect(previewModels[0].rank).toBe(1);
  });
});

describe('runStatus', () => {
  it('exposes the expected fields', () => {
    expect(runStatus.runId).toBe('0412-a7');
    expect(runStatus.tasks).toBe(547);
    expect(runStatus.models).toBe(14);
    expect(runStatus.disciplines).toBe(5);
    expect(runStatus.datasetVersion).toBe('v0.4.1');
    expect(runStatus.lastRunRelative).toBe('2h ago');
  });
});
