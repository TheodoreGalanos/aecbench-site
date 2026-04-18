// lib/aec-bench/contracts.ts
// ABOUTME: TypeScript mirrors of aec-bench pydantic contracts plus zod validators.
// ABOUTME: Only the subset the site reads is mirrored — not EnvironmentSpec or ToolSpec.
import { z } from 'zod';

export const DOMAINS = ['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const;
export type Domain = (typeof DOMAINS)[number];

export const PROVIDERS = ['anthropic', 'openai', 'google', 'meta', 'other'] as const;
export type Provider = (typeof PROVIDERS)[number];

// --- Library-mirror contracts ---

export const TrialRecordSchema = z.object({
  trial_id: z.string().min(1),
  experiment_id: z.string().min(1),
  dataset_id: z.string().nullable(),
  timestamp: z.string().min(1),
  task: z.object({
    task_id: z.string().min(1),
    task_revision: z.string().min(1),
  }),
  agent: z.object({
    adapter: z.string().min(1),
    model: z.string().min(1),
    adapter_revision: z.string().nullable(),
    configuration: z.record(z.unknown()),
  }),
  evaluation: z.object({
    reward: z.number().min(0).max(1),
    validity: z.object({
      output_parseable: z.boolean(),
      schema_valid: z.boolean(),
      verifier_completed: z.boolean(),
    }),
  }),
  timing: z.object({
    total_seconds: z.number().nonnegative(),
    agent_seconds: z.number().nonnegative().nullable(),
  }),
  cost: z
    .object({
      tokens_in: z.number().int().nonnegative().nullable(),
      tokens_out: z.number().int().nonnegative().nullable(),
      cache_read_tokens: z.number().int().nonnegative().nullable(),
      cache_write_tokens: z.number().int().nonnegative().nullable(),
      estimated_cost_usd: z.number().nonnegative().nullable(),
    })
    .nullable(),
  completeness: z.enum(['complete', 'partial']),
});
export type TrialRecord = z.infer<typeof TrialRecordSchema>;

export const DatasetTaskEntrySchema = z.object({
  task_id: z.string().min(1),
  domain: z.enum(DOMAINS),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
});
export type DatasetTaskEntry = z.infer<typeof DatasetTaskEntrySchema>;

export const DatasetManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  content_hash: z.string().min(1),
  description: z.object({
    summary: z.string().min(1),
    task_count: z.number().int().nonnegative(),
  }),
  tasks: z.array(DatasetTaskEntrySchema).min(1),
});
export type DatasetManifest = z.infer<typeof DatasetManifestSchema>;

// --- Site-owned contracts ---

export const ModelEntrySchema = z.object({
  match: z.string().min(1),
  display: z.string().min(1),
  provider: z.enum(PROVIDERS),
  family: z.string().optional(),
});
export type ModelEntry = z.infer<typeof ModelEntrySchema>;

export const SubmissionSchema = z.object({
  experiment_id: z.string().min(1),
  dataset: z.string().min(1),
  submitter: z.object({
    github: z.string().min(1),
    organisation: z.string().optional(),
  }),
  model_claim: z.object({
    library_model: z.string().min(1),
    display_override: z.string().optional(),
    provider_override: z.enum(PROVIDERS).optional(),
  }),
  notes: z.string().optional(),
  submitted_at: z.string().min(1),
  mock: z.literal(true).optional(),
  mock_notes: z.string().optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const ActivePointerSchema = z.object({
  benchmark: z.string().min(1),
  version: z.string().min(1),
});
export type ActivePointer = z.infer<typeof ActivePointerSchema>;

// --- Derived aggregates (what the build emits) ---

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  model_key: z.string().min(1),
  model_display: z.string().min(1),
  provider: z.enum(PROVIDERS),
  adapter: z.string().min(1),

  reward: z.number().min(0).max(1),
  reward_ci: z.tuple([z.number(), z.number()]).nullable(),
  per_discipline: z.record(z.enum(DOMAINS), z.number()),

  trials: z.number().int().nonnegative(),
  complete_trials: z.number().int().nonnegative(),
  repetitions: z.number().int().nonnegative(),

  mean_cost_usd: z.number().nullable(),
  total_cost_usd: z.number().nullable(),
  mean_tokens: z.number().nullable(),
  mean_duration_seconds: z.number().nullable(),

  dataset: z.string().min(1),
  last_submission: z.string().min(1),
  submission_count: z.number().int().positive(),
  delta_vs_previous: z.number().nullable(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const RunStatusSchema = z.object({
  tasks: z.number().int().nonnegative(),
  models: z.number().int().nonnegative(),
  adapters: z.number().int().nonnegative(),
  disciplines: z.number().int().nonnegative(),
  last_submission: z.string().min(1),
  generated_at: z.string().min(1),
});
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const LeaderboardArtefactSchema = z.object({
  generated_at: z.string().min(1),
  dataset: DatasetManifestSchema,
  entries: z.array(LeaderboardEntrySchema),
  is_mock: z.boolean(),
  run_status: RunStatusSchema,
});
export type LeaderboardArtefact = z.infer<typeof LeaderboardArtefactSchema>;
