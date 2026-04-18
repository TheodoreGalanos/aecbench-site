// ABOUTME: Run-status values read from the build-emitted artefact.
// ABOUTME: Field names align with the new LeaderboardArtefact.run_status shape.
import { getRunStatus, getDataset } from '@/lib/aec-bench/read';

export interface RunStatus {
  tasks: number;
  models: number;
  adapters: number;
  disciplines: number;
  lastSubmissionIso: string;
  generatedAtIso: string;
  datasetVersion: string;
}

const raw = getRunStatus();
const dataset = getDataset();

export const runStatus: RunStatus = {
  tasks: raw.tasks,
  models: raw.models,
  adapters: raw.adapters,
  disciplines: raw.disciplines,
  lastSubmissionIso: raw.last_submission,
  generatedAtIso: raw.generated_at,
  datasetVersion: `v${dataset.version}`,
};
