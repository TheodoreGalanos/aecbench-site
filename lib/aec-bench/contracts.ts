// lib/aec-bench/contracts.ts
// ABOUTME: Validates current AEC-Bench inputs and normalises the bounded legacy site inputs.
// ABOUTME: Keeps external source contracts separate from the smaller site-owned read models.
import { z } from 'zod';

export const DOMAINS = ['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const;
export type Domain = (typeof DOMAINS)[number];

export const CATALOGUE_DISCIPLINES = [...DOMAINS, 'maritime'] as const;
export type CatalogueDiscipline = (typeof CATALOGUE_DISCIPLINES)[number];

export const PROVIDERS = ['anthropic', 'openai', 'google', 'meta', 'other'] as const;
export type Provider = (typeof PROVIDERS)[number];

// --- Library-mirror contracts ---

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const GitRevisionSchema = z.string().regex(/^[0-9a-f]{40}$/);

export const ArtifactRefSchema = z.object({
  artifact_id: z.string().min(1),
  sha256: Sha256Schema,
  size_bytes: z.number().int().positive(),
  media_type: z.string().min(1),
});
export type ArtifactRef = z.infer<typeof ArtifactRefSchema>;

const EvaluationResultSchema = z.object({
  reward: z.number().min(0).max(1),
  validity: z.object({
    output_parseable: z.boolean(),
    schema_valid: z.boolean(),
    verifier_completed: z.boolean(),
    errors: z.array(z.string()).optional(),
  }),
});

const CostRecordSchema = z.object({
  tokens_in: z.number().int().nonnegative().nullish(),
  tokens_out: z.number().int().nonnegative().nullish(),
  cache_read_tokens: z.number().int().nonnegative().nullish(),
  cache_write_tokens: z.number().int().nonnegative().nullish(),
  estimated_cost_usd: z.number().nonnegative().nullish(),
});

export const LegacyTrialRecordSchema = z.object({
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
  evaluation: EvaluationResultSchema,
  timing: z.object({
    total_seconds: z.number().nonnegative(),
    agent_seconds: z.number().nonnegative().nullable(),
  }),
  cost: CostRecordSchema.nullable(),
  completeness: z.enum(['complete', 'partial']),
});

const DatasetRepositoryRefSchema = z.object({
  kind: z.literal('repository'),
  dataset_id: z.string().min(1),
  source_revision: GitRevisionSchema,
  manifest_path: z.string().min(1),
});

const DatasetBundleRefSchema = z.object({
  kind: z.literal('bundle'),
  dataset_id: z.string().min(1),
  artifact: ArtifactRefSchema,
});

export const DatasetRefSchema = z.discriminatedUnion('kind', [
  DatasetRepositoryRefSchema,
  DatasetBundleRefSchema,
]);

export const RunManifestV2Schema = z.object({
  schema_version: z.literal(2),
  run_id: z.string().min(1),
  experiment_id: z.string().min(1),
  dataset: DatasetRefSchema.nullish(),
  source: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('git'), revision: GitRevisionSchema }),
    z.object({
      kind: z.literal('snapshot'),
      artifact: ArtifactRefSchema,
      base_revision: GitRevisionSchema.nullable().optional(),
    }),
    z.object({ kind: z.literal('unresolved'), reason: z.string().min(1) }),
  ]),
  agent: z.object({
    adapter: z.string().min(1),
    model: z.string().min(1),
    adapter_revision: z.string().min(1).nullish(),
    configuration: z.record(z.string(), z.unknown()).optional(),
  }),
  execution_environment: z.object({
    runtime_image: z.string().min(1),
    compute_backend: z.string().min(1),
    tool_versions: z.record(z.string(), z.string()).nullish(),
  }),
  provider_route: z.object({
    provider: z.string().min(1),
    route: z.string().min(1),
  }),
  expected_authorities: z.array(z.unknown()).optional(),
  evaluation_regime: z.unknown().nullable().optional(),
  qualification: z.unknown().nullable().optional(),
});
export type RunManifestV2 = z.infer<typeof RunManifestV2Schema>;

export const TrialRecordV2Schema = z.object({
  schema_version: z.literal(2),
  trial_id: z.string().min(1),
  run_id: z.string().min(1),
  task_id: z.string().min(1),
  attempt: z.number().int().positive().optional(),
  execution_status: z.enum(['planned', 'running', 'completed', 'failed', 'cancelled', 'invalid']),
  evaluation_status: z.enum(['not_requested', 'pending', 'completed', 'invalid', 'failed']),
  evidence_status: z.enum(['not_required', 'pending', 'verified', 'incomplete', 'invalid']),
  started_at: z.string().min(1),
  completed_at: z.string().min(1).nullish(),
  input: z.object({
    instruction: z.string().min(1),
    task_revision: z.string().min(1),
    task_kind: z.enum(['artifact', 'lifecycle', 'world']).optional(),
    visibility: z.string().nullable().optional(),
  }),
  output: z.record(z.string(), z.unknown()).nullish(),
  evaluation: EvaluationResultSchema.nullish(),
  timing: z.object({
    total_seconds: z.number().nonnegative(),
    agent_seconds: z.number().nonnegative().nullable().optional(),
  }),
  cost: CostRecordSchema.extend({
    model_calls: z.number().int().nonnegative().nullable().optional(),
    advisor_calls: z.number().int().nonnegative().nullable().optional(),
    advisor_input_tokens: z.number().int().nonnegative().nullable().optional(),
    advisor_output_tokens: z.number().int().nonnegative().nullable().optional(),
  }).nullish(),
  authority_evidence: z.array(z.unknown()).optional(),
  provider_evidence: ArtifactRefSchema.nullable().optional(),
  extension_refs: z.array(z.unknown()).optional(),
}).superRefine((trial, context) => {
  const terminal = ['completed', 'failed', 'cancelled', 'invalid'].includes(
    trial.execution_status,
  );
  if (terminal !== Boolean(trial.completed_at)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'terminal execution status and completed_at must be present together',
    });
  }
  if (trial.execution_status === 'completed' && !trial.output) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'completed execution requires an output',
    });
  }
  if (trial.evaluation_status === 'completed' && !trial.evaluation) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'completed evaluation requires an evaluation result',
    });
  }
  if (
    ['not_requested', 'pending'].includes(trial.evaluation_status)
    && trial.evaluation
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'not-requested or pending evaluation cannot include a result',
    });
  }
});
export type TrialRecordV2 = z.infer<typeof TrialRecordV2Schema>;

export const TrialRecordSchema = z.object({
  trial_id: z.string().min(1),
  experiment_id: z.string().min(1),
  run_id: z.string().min(1).nullable(),
  dataset_id: z.string().min(1).nullable(),
  started_at: z.string().min(1),
  completed_at: z.string().min(1).nullable(),
  task: z.object({
    task_id: z.string().min(1),
    task_revision: z.string().min(1),
  }),
  agent: z.object({
    adapter: z.string().min(1),
    model: z.string().min(1),
    adapter_revision: z.string().nullable(),
    configuration: z.record(z.string(), z.unknown()),
  }),
  evaluation: EvaluationResultSchema.nullable(),
  timing: z.object({
    total_seconds: z.number().nonnegative(),
    agent_seconds: z.number().nonnegative().nullable(),
  }),
  cost: CostRecordSchema.nullable(),
  execution_status: z.enum(['planned', 'running', 'completed', 'failed', 'cancelled', 'invalid']),
  evaluation_status: z.enum(['not_requested', 'pending', 'completed', 'invalid', 'failed']),
  evidence_status: z.enum(['not_required', 'pending', 'verified', 'incomplete', 'invalid']),
});
export type TrialRecord = z.infer<typeof TrialRecordSchema>;

const LegacyDatasetTaskEntrySchema = z.object({
  task_id: z.string().min(1),
  domain: z.enum(DOMAINS),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
});

export const LegacyDatasetManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  content_hash: z.string().min(1),
  description: z.object({
    summary: z.string().min(1),
    task_count: z.number().int().nonnegative(),
  }),
  tasks: z.array(LegacyDatasetTaskEntrySchema).min(1),
});

export const DatasetManifestV2Schema = z.object({
  schema_version: z.literal(2),
  dataset_id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
  description: z.string().min(1),
  tasks: z.array(z.object({
    task_id: z.string().min(1),
    path: z.string().min(1),
    task_kind: z.enum(['artifact', 'lifecycle', 'world']),
  })).min(1),
  generation: z.object({
    seed: z.number().int().nullable().optional(),
    config_ref: z.string().min(1).nullable().optional(),
  }).nullable().optional(),
});

export const DatasetSelectionSchema = z.object({
  dataset_id: z.string().min(1),
  release_label: z.string().min(1),
  description: z.string().min(1),
  tasks: z.array(z.object({
    task_id: z.string().min(1),
    domain: z.enum(DOMAINS),
  })).min(1),
});
export type DatasetSelection = z.infer<typeof DatasetSelectionSchema>;

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

export const LegacyActivePointerSchema = z.object({
  benchmark: z.string().min(1),
  version: z.string().min(1),
});

export const CurrentActivePointerSchema = z.object({
  dataset_id: z.string().min(1),
  release_label: z.string().min(1),
});

export const ActivePointerSchema = z
  .union([CurrentActivePointerSchema, LegacyActivePointerSchema])
  .transform((pointer) => (
    'dataset_id' in pointer
      ? pointer
      : { dataset_id: pointer.benchmark, release_label: pointer.version }
  ))
  .refine((pointer) => pointer.release_label.toLowerCase() !== 'latest', {
    message: 'latest is a mutable selector and cannot be persisted',
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
  expected_trials: z.number().int().nonnegative().optional(),
  failed_trials: z.number().int().nonnegative().optional(),
  completion_rate: z.number().min(0).max(1).optional(),
  suite_done: z.boolean().optional(),

  mean_cost_usd: z.number().nullable(),
  total_cost_usd: z.number().nullable(),
  mean_tokens: z.number().nullable(),
  mean_input_tokens: z.number().nullable().optional(),
  mean_output_tokens: z.number().nullable().optional(),
  mean_duration_seconds: z.number().nullable(),
  latency_p95_seconds: z.number().nullable().optional(),
  reward_stddev: z.number().nullable().optional(),
  reliability_adjusted_reward: z.number().min(0).max(1).nullable().optional(),
  zero_reward_rate: z.number().min(0).max(1).optional(),
  partial_credit_rate: z.number().min(0).max(1).optional(),
  perfect_reward_rate: z.number().min(0).max(1).optional(),

  dataset: z.string().min(1),
  last_submission: z.string().min(1),
  submission_count: z.number().int().positive(),
  delta_vs_previous: z.number().nullable(),
  is_mock: z.boolean(),
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

export const LeaderboardDatasetSchema = z.object({
  dataset_id: z.string().min(1),
  release_label: z.string().min(1),
  description: z.string().min(1),
  task_count: z.number().int().nonnegative(),
});
export type LeaderboardDataset = z.infer<typeof LeaderboardDatasetSchema>;

export const LeaderboardArtefactSchema = z.object({
  generated_at: z.string().min(1),
  dataset: LeaderboardDatasetSchema,
  entries: z.array(LeaderboardEntrySchema),
  is_mock: z.boolean(),
  run_status: RunStatusSchema,
});
export type LeaderboardArtefact = z.infer<typeof LeaderboardArtefactSchema>;
