// tests/ingest/contracts.test.ts
// ABOUTME: Exercises the current AEC-Bench source contracts used by site ingestion.
// ABOUTME: Keeps source schema versions separate from the site-owned normalised models.
import { describe, it, expect } from 'vitest';
import {
  TrialRecordV2Schema,
  DatasetManifestV2Schema,
  SubmissionSchema,
  ModelEntrySchema,
  LeaderboardEntrySchema,
  ActivePointerSchema,
} from '@/lib/aec-bench/contracts';

const validTrial = {
  schema_version: 2 as const,
  trial_id: 'pf-droop__abc123',
  run_id: 'run-1',
  task_id: 'electrical/pf-droop',
  attempt: 1,
  execution_status: 'completed' as const,
  evaluation_status: 'completed' as const,
  evidence_status: 'not_required' as const,
  started_at: '2026-04-10T12:00:00Z',
  completed_at: '2026-04-10T12:00:42.500Z',
  input: { instruction: 'Calculate the result.', task_revision: 'deadbeef' },
  output: {},
  evaluation: {
    reward: 0.82,
    validity: {
      output_parseable: true,
      schema_valid: true,
      verifier_completed: true,
    },
  },
  timing: { total_seconds: 42.5, agent_seconds: 30.1 },
  cost: {
    tokens_in: 50000,
    tokens_out: 10000,
    cache_read_tokens: null,
    cache_write_tokens: null,
    estimated_cost_usd: 0.3,
  },
  authority_evidence: [],
  provider_evidence: null,
  extension_refs: [],
};

describe('TrialRecordV2Schema', () => {
  it('accepts a current TrialRecord', () => {
    expect(() => TrialRecordV2Schema.parse(validTrial)).not.toThrow();
  });

  it('rejects reward outside [0, 1]', () => {
    const bad = { ...validTrial, evaluation: { ...validTrial.evaluation, reward: 1.5 } };
    expect(() => TrialRecordV2Schema.parse(bad)).toThrow();
  });

  it('rejects an unknown evidence status', () => {
    const bad = { ...validTrial, evidence_status: 'maybe' };
    expect(() => TrialRecordV2Schema.parse(bad)).toThrow();
  });

  it('allows cost to be null', () => {
    expect(() => TrialRecordV2Schema.parse({ ...validTrial, cost: null })).not.toThrow();
  });

  it('rejects a completed trial without output', () => {
    expect(() => TrialRecordV2Schema.parse({ ...validTrial, output: null })).toThrow();
  });
});

describe('ActivePointerSchema', () => {
  it('rejects persisted latest selection', () => {
    expect(() => ActivePointerSchema.parse({
      dataset_id: 'aec-bench',
      release_label: 'latest',
    })).toThrow();
  });
});

describe('DatasetManifestV2Schema', () => {
  it('accepts a current semantic manifest', () => {
    const manifest = {
      schema_version: 2 as const,
      dataset_id: 'aec-bench',
      description: 'AEC engineering tasks',
      tasks: [
        {
          task_id: 'electrical/pf-droop',
          path: 'tasks/electrical/pf-droop',
          task_kind: 'artifact' as const,
        },
      ],
    };
    expect(() => DatasetManifestV2Schema.parse(manifest)).not.toThrow();
  });

  it('rejects a mutable latest dataset ID', () => {
    const bad = {
      schema_version: 2,
      dataset_id: 'bad/id',
      description: 's',
      tasks: [{ task_id: 't', path: 'tasks/t', task_kind: 'artifact' }],
    };
    expect(() => DatasetManifestV2Schema.parse(bad)).toThrow();
  });
});

describe('SubmissionSchema', () => {
  it('accepts a real submission without mock flag', () => {
    const sub = {
      experiment_id: 'e1',
      dataset: 'aec-bench@0.4.1',
      submitter: { github: 'TheodoreGalanos' },
      model_claim: { library_model: 'claude-sonnet-4-6' },
      submitted_at: '2026-04-10T12:00:00Z',
    };
    expect(() => SubmissionSchema.parse(sub)).not.toThrow();
  });

  it('accepts mock: true with mock_notes', () => {
    const sub = {
      experiment_id: 'mock-1',
      dataset: 'aec-bench@0.4.1',
      submitter: { github: 'aec-bench-bot' },
      model_claim: { library_model: 'claude-sonnet-4-6' },
      submitted_at: '2026-04-10T12:00:00Z',
      mock: true,
      mock_notes: 'Synthetic seed data',
    };
    expect(() => SubmissionSchema.parse(sub)).not.toThrow();
  });
});

describe('ModelEntrySchema', () => {
  it('accepts a valid entry', () => {
    const entry = {
      match: 'claude-sonnet-4',
      display: 'Claude Sonnet 4',
      provider: 'anthropic',
      family: 'Claude 4',
    };
    expect(() => ModelEntrySchema.parse(entry)).not.toThrow();
  });

  it('rejects unknown provider', () => {
    const bad = {
      match: 'foo',
      display: 'Foo',
      provider: 'acme',
    };
    expect(() => ModelEntrySchema.parse(bad)).toThrow();
  });
});

describe('LeaderboardEntrySchema — is_mock field', () => {
  it('requires is_mock to be a boolean', () => {
    const minimal = {
      rank: 1, model_key: 'm', model_display: 'M', provider: 'anthropic',
      adapter: 'rlm', reward: 0.5, reward_ci: null,
      per_discipline: { civil: 0.5, electrical: 0.5, ground: 0.5, mechanical: 0.5, structural: 0.5 },
      trials: 10, complete_trials: 10, repetitions: 1,
      mean_cost_usd: null, total_cost_usd: null, mean_tokens: null, mean_duration_seconds: null,
      dataset: 'aec-bench@0.4.1', last_submission: '2026-04-18T00:00:00Z',
      submission_count: 1, delta_vs_previous: null, is_mock: false,
    };
    expect(() => LeaderboardEntrySchema.parse(minimal)).not.toThrow();
    const { is_mock, ...withoutMock } = minimal;
    expect(() => LeaderboardEntrySchema.parse(withoutMock)).toThrow();
    expect(() => LeaderboardEntrySchema.parse({ ...minimal, is_mock: 'yes' })).toThrow();
  });
});
