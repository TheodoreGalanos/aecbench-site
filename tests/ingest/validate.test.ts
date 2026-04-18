// tests/ingest/validate.test.ts
// ABOUTME: Exercises per-experiment validation — submission.yml, trials, cross-file invariants.
// ABOUTME: Every failure produces a ValidationError that names the offending file.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { discoverExperiments } from '@/scripts/ingest/discover';
import { validateExperiment, ValidationError } from '@/scripts/ingest/validate';
import type { DatasetManifest } from '@/lib/aec-bench/contracts';

const VALID_ROOT = resolve(__dirname, 'fixtures/validate/valid');
const MISMATCH_ROOT = resolve(__dirname, 'fixtures/validate/mismatch');
const DUPLICATE_ROOT = resolve(__dirname, 'fixtures/validate/duplicate-trial');

const manifest: DatasetManifest = {
  name: 'aec-bench',
  version: '0.4.1',
  content_hash: 'h',
  description: { summary: 's', task_count: 1 },
  tasks: [{ task_id: 'electrical/pf-droop', domain: 'electrical', difficulty: 'medium', tags: [] }],
};

describe('validateExperiment', () => {
  it('returns a ValidatedExperiment for a well-formed folder', async () => {
    const [exp] = await discoverExperiments(VALID_ROOT);
    const result = await validateExperiment(exp, manifest, 'aec-bench@0.4.1');
    expect(result.submission.experiment_id).toBe('valid-exp');
    expect(result.trials).toHaveLength(1);
    expect(result.trials[0].trial_id).toBe('t-1');
  });

  it('rejects a submission whose dataset does not match active', async () => {
    const [exp] = await discoverExperiments(MISMATCH_ROOT);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(ValidationError);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(/dataset/);
  });

  it('rejects duplicate trial_ids within an experiment', async () => {
    const [exp] = await discoverExperiments(DUPLICATE_ROOT);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(ValidationError);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(/duplicate/i);
  });

  it('rejects trials whose task_id is not in the dataset manifest', async () => {
    const strictManifest: DatasetManifest = {
      ...manifest,
      tasks: [{ task_id: 'ground/foo', domain: 'ground', difficulty: 'easy', tags: [] }],
    };
    const [exp] = await discoverExperiments(VALID_ROOT);
    await expect(validateExperiment(exp, strictManifest, 'aec-bench@0.4.1')).rejects.toThrow(ValidationError);
    await expect(validateExperiment(exp, strictManifest, 'aec-bench@0.4.1')).rejects.toThrow(/task_id/);
  });
});
