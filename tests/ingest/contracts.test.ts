// tests/ingest/contracts.test.ts
// ABOUTME: Exercises zod schemas mirroring aec-bench library pydantic contracts.
// ABOUTME: Asserts every schema accepts a valid fixture and rejects known malformations.
import { describe, it, expect } from 'vitest';
import {
  TrialRecordSchema,
  DatasetManifestSchema,
  SubmissionSchema,
  ModelEntrySchema,
} from '@/lib/aec-bench/contracts';

const validTrial = {
  trial_id: 'pf-droop__abc123',
  experiment_id: 'sonnet4-tool-loop',
  dataset_id: 'aec-bench@0.4.1',
  timestamp: '2026-04-10T12:00:00Z',
  task: { task_id: 'electrical/pf-droop', task_revision: 'deadbeef' },
  agent: {
    adapter: 'tool_loop',
    model: 'claude-sonnet-4-6',
    adapter_revision: '1.0.0',
    configuration: {},
  },
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
  completeness: 'complete' as const,
};

describe('TrialRecordSchema', () => {
  it('accepts a valid TrialRecord', () => {
    expect(() => TrialRecordSchema.parse(validTrial)).not.toThrow();
  });

  it('rejects reward outside [0, 1]', () => {
    const bad = { ...validTrial, evaluation: { ...validTrial.evaluation, reward: 1.5 } };
    expect(() => TrialRecordSchema.parse(bad)).toThrow();
  });

  it('rejects unknown completeness', () => {
    const bad = { ...validTrial, completeness: 'maybe' as unknown as 'complete' };
    expect(() => TrialRecordSchema.parse(bad)).toThrow();
  });

  it('allows cost to be null', () => {
    expect(() => TrialRecordSchema.parse({ ...validTrial, cost: null })).not.toThrow();
  });
});

describe('DatasetManifestSchema', () => {
  it('accepts a valid manifest', () => {
    const manifest = {
      name: 'aec-bench',
      version: '0.4.1',
      content_hash: 'hash-' + 'a'.repeat(56),
      description: { summary: 'AEC engineering tasks', task_count: 547 },
      tasks: [
        { task_id: 'electrical/pf-droop', domain: 'electrical', difficulty: 'medium', tags: [] },
      ],
    };
    expect(() => DatasetManifestSchema.parse(manifest)).not.toThrow();
  });

  it('rejects unknown domain', () => {
    const bad = {
      name: 'x',
      version: '0.0.1',
      content_hash: 'h',
      description: { summary: 's', task_count: 1 },
      tasks: [{ task_id: 't', domain: 'biology', difficulty: 'medium', tags: [] }],
    };
    expect(() => DatasetManifestSchema.parse(bad)).toThrow();
  });
});

describe('SubmissionSchema', () => {
  it('accepts a real submission without mock flag', () => {
    const sub = {
      experiment_id: 'e1',
      dataset: 'aec-bench@0.4.1',
      submitter: { github: 'aurecon' },
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
