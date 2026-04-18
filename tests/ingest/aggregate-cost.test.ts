// tests/ingest/aggregate-cost.test.ts
// ABOUTME: Cost/tokens/duration rollup — null trials contribute to reward but not cost.
// ABOUTME: If all trials have null cost, mean_cost_usd and mean_tokens are null (prevents fake-cheap ranks).
import { describe, it, expect } from 'vitest';
import { computeCostAndTiming } from '@/scripts/ingest/aggregate';
import type { TrialRecord } from '@/lib/aec-bench/contracts';

function makeTrial(
  trial_id: string,
  cost: TrialRecord['cost'],
  total_seconds = 10,
): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: '2026-04-10T12:00:00Z',
    task: { task_id: 't', task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'x',
      adapter_revision: null,
      configuration: {},
    },
    evaluation: {
      reward: 0.5,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds, agent_seconds: total_seconds * 0.8 },
    cost,
    completeness: 'complete',
  };
}

const fullCost = (usd: number, inTokens = 50000, outTokens = 10000) => ({
  tokens_in: inTokens,
  tokens_out: outTokens,
  cache_read_tokens: null,
  cache_write_tokens: null,
  estimated_cost_usd: usd,
});

describe('computeCostAndTiming', () => {
  it('averages cost per task across all trials that have cost data', () => {
    const trials = [makeTrial('a', fullCost(0.3)), makeTrial('b', fullCost(0.4))];
    const { mean_cost_usd, total_cost_usd } = computeCostAndTiming(trials);
    expect(mean_cost_usd).toBeCloseTo(0.35, 5);
    expect(total_cost_usd).toBeCloseTo(0.7, 5);
  });

  it('ignores null-cost trials when averaging', () => {
    const trials = [makeTrial('a', fullCost(0.3)), makeTrial('b', null)];
    const { mean_cost_usd } = computeCostAndTiming(trials);
    expect(mean_cost_usd).toBeCloseTo(0.3, 5);
  });

  it('returns null for cost when no trial has cost data', () => {
    const trials = [makeTrial('a', null), makeTrial('b', null)];
    const { mean_cost_usd, total_cost_usd, mean_tokens } = computeCostAndTiming(trials);
    expect(mean_cost_usd).toBeNull();
    expect(total_cost_usd).toBeNull();
    expect(mean_tokens).toBeNull();
  });

  it('averages tokens_in + tokens_out per trial', () => {
    const trials = [makeTrial('a', fullCost(0.3, 40000, 8000))];
    const { mean_tokens } = computeCostAndTiming(trials);
    expect(mean_tokens).toBe(48000);
  });

  it('averages total_seconds across all trials (including null cost)', () => {
    const trials = [makeTrial('a', null, 10), makeTrial('b', null, 20)];
    const { mean_duration_seconds } = computeCostAndTiming(trials);
    expect(mean_duration_seconds).toBe(15);
  });
});
