// scripts/ingest/validate.ts
// ABOUTME: Per-experiment validation — parse submission + trials, enforce cross-file invariants.
// ABOUTME: Any failure throws a ValidationError that names the offending file.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { load } from 'js-yaml';
import {
  SubmissionSchema,
  LegacyTrialRecordSchema,
  RunManifestV2Schema,
  TrialRecordSchema,
  TrialRecordV2Schema,
  type DatasetSelection,
  type Submission,
  type TrialRecord,
} from '@/lib/aec-bench/contracts';
import type { DiscoveredExperiment } from '@/scripts/ingest/discover';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidatedExperiment {
  id: string;
  dir: string;
  submission: Submission;
  trials: TrialRecord[];
}

export async function validateExperiment(
  exp: DiscoveredExperiment,
  manifest: DatasetSelection,
  activeDataset: string,
): Promise<ValidatedExperiment> {
  // 1. Parse submission.yml
  const submission = await parseSubmission(exp.submissionPath);

  // 2. Enforce: submission.experiment_id must match folder name
  if (submission.experiment_id !== exp.id) {
    throw new ValidationError(
      `${exp.submissionPath}: submission.experiment_id "${submission.experiment_id}" does not match folder name "${exp.id}"`,
    );
  }

  // 3. Enforce: submission.dataset must match active dataset
  if (submission.dataset !== activeDataset) {
    throw new ValidationError(
      `${exp.submissionPath}: submission.dataset "${submission.dataset}" does not match active dataset "${activeDataset}"`,
    );
  }

  // 4. Parse every trial
  const trials = await parseTrials(exp.trialsDir);

  // 5. Enforce: every trial.experiment_id == folder id
  for (const trial of trials) {
    if (trial.experiment_id !== exp.id) {
      throw new ValidationError(
        `${exp.trialsDir}/${trial.trial_id}.json: trial.experiment_id "${trial.experiment_id}" does not match folder "${exp.id}"`,
      );
    }
  }

  // 6. Enforce: trial_ids unique within experiment
  const seen = new Set<string>();
  for (const trial of trials) {
    if (seen.has(trial.trial_id)) {
      throw new ValidationError(`${exp.trialsDir}: duplicate trial_id "${trial.trial_id}"`);
    }
    seen.add(trial.trial_id);
  }

  // 7. Enforce: every trial.task.task_id appears in the active manifest
  const manifestTaskIds = new Set(manifest.tasks.map((t) => t.task_id));
  for (const trial of trials) {
    if (!manifestTaskIds.has(trial.task.task_id)) {
      throw new ValidationError(
        `${exp.trialsDir}/${trial.trial_id}.json: task_id "${trial.task.task_id}" not in active dataset manifest`,
      );
    }
  }

  return { id: exp.id, dir: exp.dir, submission, trials };
}

async function parseSubmission(path: string): Promise<Submission> {
  const raw = await readFile(path, 'utf-8');
  try {
    return SubmissionSchema.parse(load(raw));
  } catch (err) {
    throw new ValidationError(`${path}: ${(err as Error).message}`);
  }
}

async function parseTrials(dir: string): Promise<TrialRecord[]> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    throw new ValidationError(`${dir}: trials directory missing`);
  }
  const trials: TrialRecord[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const path = join(dir, file);
    const raw = await readFile(path, 'utf-8');
    try {
      const value = JSON.parse(raw) as { schema_version?: unknown };
      trials.push(
        value.schema_version === 2
          ? await parseCurrentTrial(value, dir)
          : parseLegacyTrial(value),
      );
    } catch (err) {
      throw new ValidationError(`${path}: ${(err as Error).message}`);
    }
  }
  return trials;
}

function parseLegacyTrial(value: unknown): TrialRecord {
  const legacy = LegacyTrialRecordSchema.parse(value);
  const complete = legacy.completeness === 'complete';
  return TrialRecordSchema.parse({
    trial_id: legacy.trial_id,
    experiment_id: legacy.experiment_id,
    run_id: null,
    dataset_id: legacy.dataset_id,
    started_at: legacy.timestamp,
    completed_at: complete ? legacy.timestamp : null,
    task: legacy.task,
    agent: legacy.agent,
    evaluation: legacy.evaluation,
    timing: legacy.timing,
    cost: legacy.cost,
    execution_status: complete ? 'completed' : 'invalid',
    evaluation_status: legacy.evaluation.validity.verifier_completed ? 'completed' : 'failed',
    evidence_status: complete ? 'not_required' : 'incomplete',
  });
}

async function parseCurrentTrial(value: unknown, trialsDir: string): Promise<TrialRecord> {
  const trial = TrialRecordV2Schema.parse(value);
  const manifestName = createHash('sha256').update(trial.run_id).digest('hex');
  const manifestPath = join(trialsDir, '_runs', `${manifestName}.json`);

  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, 'utf-8');
  } catch {
    throw new Error(`${manifestPath}: run manifest missing for run_id "${trial.run_id}"`);
  }
  const manifest = RunManifestV2Schema.parse(JSON.parse(manifestRaw));
  if (manifest.run_id !== trial.run_id) {
    throw new Error(`${manifestPath}: run_id does not match trial run_id "${trial.run_id}"`);
  }

  return TrialRecordSchema.parse({
    trial_id: trial.trial_id,
    experiment_id: manifest.experiment_id,
    run_id: trial.run_id,
    dataset_id: manifest.dataset?.dataset_id ?? null,
    started_at: trial.started_at,
    completed_at: trial.completed_at ?? null,
    task: { task_id: trial.task_id, task_revision: trial.input.task_revision },
    agent: {
      adapter: manifest.agent.adapter,
      model: manifest.agent.model,
      adapter_revision: manifest.agent.adapter_revision ?? null,
      configuration: manifest.agent.configuration ?? {},
    },
    evaluation: trial.evaluation ?? null,
    timing: {
      total_seconds: trial.timing.total_seconds,
      agent_seconds: trial.timing.agent_seconds ?? null,
    },
    cost: trial.cost
      ? {
          tokens_in: trial.cost.tokens_in ?? null,
          tokens_out: trial.cost.tokens_out ?? null,
          cache_read_tokens: trial.cost.cache_read_tokens ?? null,
          cache_write_tokens: trial.cost.cache_write_tokens ?? null,
          estimated_cost_usd: trial.cost.estimated_cost_usd ?? null,
        }
      : null,
    execution_status: trial.execution_status,
    evaluation_status: trial.evaluation_status,
    evidence_status: trial.evidence_status,
  });
}
