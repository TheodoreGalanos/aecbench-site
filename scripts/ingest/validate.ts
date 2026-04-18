// scripts/ingest/validate.ts
// ABOUTME: Per-experiment validation — parse submission + trials, enforce cross-file invariants.
// ABOUTME: Any failure throws a ValidationError that names the offending file.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'js-yaml';
import {
  SubmissionSchema,
  TrialRecordSchema,
  type DatasetManifest,
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
  manifest: DatasetManifest,
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
      trials.push(TrialRecordSchema.parse(JSON.parse(raw)));
    } catch (err) {
      throw new ValidationError(`${path}: ${(err as Error).message}`);
    }
  }
  return trials;
}
