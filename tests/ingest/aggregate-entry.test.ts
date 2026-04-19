// tests/ingest/aggregate-entry.test.ts
// ABOUTME: End-to-end assembly of a single LeaderboardEntry from a TrialGroup + context.
// ABOUTME: Exercises the full join of reward, discipline, cost, and metadata.
import { describe, it, expect } from 'vitest';
import { buildEntry } from '@/scripts/ingest/aggregate';
import type { DatasetManifest, ModelEntry, TrialRecord } from '@/lib/aec-bench/contracts';

const entry: ModelEntry = {
  match: 'claude-sonnet-4',
  display: 'Claude Sonnet 4',
  provider: 'anthropic',
  family: 'Claude 4',
};
const manifest: DatasetManifest = {
  name: 'aec-bench',
  version: '0.4.1',
  content_hash: 'h',
  description: { summary: 's', task_count: 2 },
  tasks: [
    { task_id: 'civil/a', domain: 'civil', difficulty: 'easy', tags: [] },
    { task_id: 'electrical/b', domain: 'electrical', difficulty: 'easy', tags: [] },
  ],
};

function makeTrial(trial_id: string, task_id: string, reward: number, ts: string): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: ts,
    task: { task_id, task_revision: 'r' },
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
    timing: { total_seconds: 10, agent_seconds: 8 },
    cost: {
      tokens_in: 50000,
      tokens_out: 10000,
      cache_read_tokens: null,
      cache_write_tokens: null,
      estimated_cost_usd: 0.3,
    },
    completeness: 'complete',
  };
}

describe('aggregator — is_mock per entry', () => {
  it('sets is_mock=true when any contributing submission is mock', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8, '2026-04-10T12:00:00Z'),
      makeTrial('b', 'electrical/b', 0.6, '2026-04-11T12:00:00Z'),
    ];
    const result = buildEntry({
      group: { key: 'claude-sonnet-4/tool_loop', entry, adapter: 'tool_loop', trials },
      manifest,
      activeKey: 'aec-bench@0.4.1',
      submissionCount: 1,
      is_mock: true,
    });
    expect(result.is_mock).toBe(true);
  });

  it('sets is_mock=false when all contributing submissions are real', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8, '2026-04-10T12:00:00Z'),
      makeTrial('b', 'electrical/b', 0.6, '2026-04-11T12:00:00Z'),
    ];
    const result = buildEntry({
      group: { key: 'claude-sonnet-4/tool_loop', entry, adapter: 'tool_loop', trials },
      manifest,
      activeKey: 'aec-bench@0.4.1',
      submissionCount: 1,
      is_mock: false,
    });
    expect(result.is_mock).toBe(false);
  });
});

describe('buildEntry', () => {
  it('assembles a LeaderboardEntry from trials + context', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8, '2026-04-10T12:00:00Z'),
      makeTrial('b', 'electrical/b', 0.6, '2026-04-11T12:00:00Z'),
    ];
    const result = buildEntry({
      group: { key: 'claude-sonnet-4/tool_loop', entry, adapter: 'tool_loop', trials },
      manifest,
      activeKey: 'aec-bench@0.4.1',
      submissionCount: 1,
      is_mock: false,
    });

    expect(result.model_key).toBe('claude-sonnet-4/tool_loop');
    expect(result.model_display).toBe('Claude Sonnet 4');
    expect(result.provider).toBe('anthropic');
    expect(result.adapter).toBe('tool_loop');
    expect(result.reward).toBeCloseTo(0.7, 5);
    expect(result.per_discipline).toEqual({ civil: 0.8, electrical: 0.6 });
    expect(result.trials).toBe(2);
    expect(result.complete_trials).toBe(2);
    expect(result.mean_cost_usd).toBeCloseTo(0.3, 5);
    expect(result.dataset).toBe('aec-bench@0.4.1');
    expect(result.last_submission).toBe('2026-04-11T12:00:00Z');
    expect(result.submission_count).toBe(1);
    expect(result.rank).toBe(0); // rank assigned later by rankEntries
  });
});
