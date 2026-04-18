// tests/ingest/aggregate-reward.test.ts
// ABOUTME: Exercises reward mean + bootstrap CI computation per trial group.
// ABOUTME: CI is null for reps < 3; deterministic seeding produces reproducible intervals.
import { describe, it, expect } from 'vitest';
import { computeReward } from '@/scripts/ingest/aggregate';
import type { TrialRecord } from '@/lib/aec-bench/contracts';

function makeTrial(trial_id: string, reward: number, completeness: 'complete' | 'partial' = 'complete'): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: '2026-04-10T12:00:00Z',
    task: { task_id: 't', task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'claude-sonnet-4-6',
      adapter_revision: '1.0.0',
      configuration: {},
    },
    evaluation: {
      reward,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds: 1, agent_seconds: 1 },
    cost: null,
    completeness,
  };
}

describe('computeReward', () => {
  it('averages complete trials only', () => {
    const trials = [makeTrial('a', 1.0), makeTrial('b', 0.5), makeTrial('c', 0.0, 'partial')];
    const { mean, complete, total } = computeReward(trials);
    expect(mean).toBeCloseTo(0.75, 5);
    expect(complete).toBe(2);
    expect(total).toBe(3);
  });

  it('returns mean=0 when no complete trials exist', () => {
    const trials = [makeTrial('a', 0.9, 'partial')];
    const { mean, complete } = computeReward(trials);
    expect(mean).toBe(0);
    expect(complete).toBe(0);
  });

  it('returns ci=null when complete_trials < 3', () => {
    const trials = [makeTrial('a', 0.8), makeTrial('b', 0.6)];
    const { ci } = computeReward(trials);
    expect(ci).toBeNull();
  });

  it('returns a CI when complete_trials >= 3, deterministic across runs', () => {
    const trials = [
      makeTrial('a', 0.8),
      makeTrial('b', 0.7),
      makeTrial('c', 0.9),
      makeTrial('d', 0.75),
    ];
    const first = computeReward(trials).ci;
    const second = computeReward(trials).ci;
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    const [lo, hi] = first!;
    expect(lo).toBeLessThanOrEqual(hi);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(1);
  });
});
