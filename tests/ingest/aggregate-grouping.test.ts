// tests/ingest/aggregate-grouping.test.ts
// ABOUTME: Exercises grouping of trials by (model_key, adapter) after registry resolution.
// ABOUTME: Asserts that Bedrock-prefixed and raw provider IDs collapse into the same group.
import { describe, it, expect } from 'vitest';
import { groupTrials } from '@/scripts/ingest/aggregate';
import type { ModelEntry, TrialRecord } from '@/lib/aec-bench/contracts';

const registry: ModelEntry[] = [
  { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic' },
  { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai' },
];

function makeTrial(overrides: Partial<TrialRecord>): TrialRecord {
  return {
    trial_id: 'x',
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
      reward: 0.5,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds: 1, agent_seconds: 1 },
    cost: null,
    completeness: 'complete',
    ...overrides,
  };
}

describe('groupTrials', () => {
  it('groups raw and Bedrock-prefixed model strings together', () => {
    const trials = [
      makeTrial({ trial_id: 'a', agent: { ...makeTrial({}).agent, model: 'claude-sonnet-4-6' } }),
      makeTrial({ trial_id: 'b', agent: { ...makeTrial({}).agent, model: 'au.anthropic.claude-sonnet-4-6' } }),
    ];
    const groups = groupTrials(trials, registry);
    expect(groups.size).toBe(1);
    expect([...groups.keys()][0]).toBe('claude-sonnet-4/tool_loop');
  });

  it('splits the same model across different adapters', () => {
    const trials = [
      makeTrial({ trial_id: 'a', agent: { ...makeTrial({}).agent, adapter: 'tool_loop' } }),
      makeTrial({ trial_id: 'b', agent: { ...makeTrial({}).agent, adapter: 'rlm' } }),
    ];
    const groups = groupTrials(trials, registry);
    expect(groups.size).toBe(2);
  });

  it('splits different models into different groups', () => {
    const trials = [
      makeTrial({ trial_id: 'a', agent: { ...makeTrial({}).agent, model: 'claude-sonnet-4-6' } }),
      makeTrial({ trial_id: 'b', agent: { ...makeTrial({}).agent, model: 'gpt-4.1' } }),
    ];
    const groups = groupTrials(trials, registry);
    expect(groups.size).toBe(2);
  });
});
