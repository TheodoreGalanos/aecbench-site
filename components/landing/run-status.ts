// ABOUTME: Run-status data consumed by the persistent landing status bar.
// ABOUTME: Stubbed here; replaced by Supabase queries in Phase 3.

export interface RunStatus {
  runId: string;
  tasks: number;
  models: number;
  disciplines: number;
  datasetVersion: string;
  lastRunRelative: string;
}

export const runStatus: RunStatus = {
  runId: '0412-a7',
  tasks: 547,
  models: 14,
  disciplines: 5,
  datasetVersion: 'v0.4.1',
  lastRunRelative: '2h ago',
};
