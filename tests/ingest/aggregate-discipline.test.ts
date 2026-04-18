// tests/ingest/aggregate-discipline.test.ts
// ABOUTME: Per-discipline reward breakdown via join against the dataset manifest.
// ABOUTME: Missing disciplines (submitter didn't run them) do not appear in the output.
import { describe, it, expect } from 'vitest';
import { computePerDiscipline } from '@/scripts/ingest/aggregate';
import type { DatasetManifest, TrialRecord } from '@/lib/aec-bench/contracts';

const manifest: DatasetManifest = {
  name: 'aec-bench',
  version: '0.4.1',
  content_hash: 'h',
  description: { summary: 's', task_count: 3 },
  tasks: [
    { task_id: 'civil/a', domain: 'civil', difficulty: 'easy', tags: [] },
    { task_id: 'electrical/b', domain: 'electrical', difficulty: 'easy', tags: [] },
    { task_id: 'ground/c', domain: 'ground', difficulty: 'easy', tags: [] },
  ],
};

function makeTrial(trial_id: string, task_id: string, reward: number): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: '2026-04-10T12:00:00Z',
    task: { task_id, task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'x',
      adapter_revision: null,
      configuration: {},
    },
    evaluation: {
      reward,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds: 1, agent_seconds: 1 },
    cost: null,
    completeness: 'complete',
  };
}

describe('computePerDiscipline', () => {
  it('returns mean reward per domain for trials that ran', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8),
      makeTrial('b', 'electrical/b', 0.6),
    ];
    const result = computePerDiscipline(trials, manifest);
    expect(result).toEqual({ civil: 0.8, electrical: 0.6 });
    expect(result).not.toHaveProperty('ground');
  });

  it('averages multiple trials within the same domain', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8),
      makeTrial('b', 'civil/a', 0.4),
    ];
    const result = computePerDiscipline(trials, manifest);
    expect(result.civil).toBeCloseTo(0.6, 5);
  });
});
