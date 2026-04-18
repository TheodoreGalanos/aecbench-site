// scripts/ingest/aggregate.ts
// ABOUTME: Aggregation — grouping, reward mean+CI, per-discipline, cost rollup, ranking, delta.
// ABOUTME: Functions are pure. Orchestrator calls them in sequence.
import type {
  DatasetManifest,
  Domain,
  LeaderboardEntry,
  ModelEntry,
  TrialRecord,
} from '@/lib/aec-bench/contracts';
import { modelKey, resolveModel } from '@/scripts/ingest/registry';
import seedrandom from 'seedrandom';

export interface TrialGroup {
  key: string;          // model_key/adapter
  entry: ModelEntry;    // resolved registry entry
  adapter: string;
  trials: TrialRecord[];
}

// LeaderboardEntry will be consumed by subsequent aggregation functions in Tasks 9–13.
export type { LeaderboardEntry };

export function groupTrials(trials: TrialRecord[], registry: ModelEntry[]): Map<string, TrialGroup> {
  const groups = new Map<string, TrialGroup>();
  for (const trial of trials) {
    const entry = resolveModel(trial.agent.model, registry);
    const adapter = trial.agent.adapter;
    const key = modelKey(entry, adapter);
    const existing = groups.get(key);
    if (existing) {
      existing.trials.push(trial);
    } else {
      groups.set(key, { key, entry, adapter, trials: [trial] });
    }
  }
  return groups;
}

export interface RewardStats {
  mean: number;
  ci: [number, number] | null;
  complete: number;
  total: number;
}

const BOOTSTRAP_RESAMPLES = 10_000;

export function computeReward(trials: TrialRecord[]): RewardStats {
  const complete = trials.filter(isComplete);
  const values = complete.map((t) => t.evaluation.reward);
  const mean = values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

  let ci: [number, number] | null = null;
  if (complete.length >= 3) {
    const seed = seedOf(complete.map((t) => t.trial_id));
    const rng = seedrandom(seed);
    const samples = new Array<number>(BOOTSTRAP_RESAMPLES);
    for (let i = 0; i < BOOTSTRAP_RESAMPLES; i++) {
      let sum = 0;
      for (let j = 0; j < values.length; j++) {
        sum += values[Math.floor(rng() * values.length)];
      }
      samples[i] = sum / values.length;
    }
    samples.sort((a, b) => a - b);
    const lo = samples[Math.floor(0.025 * BOOTSTRAP_RESAMPLES)];
    const hi = samples[Math.floor(0.975 * BOOTSTRAP_RESAMPLES)];
    ci = [round2(lo), round2(hi)];
  }

  return { mean: round2(mean), ci, complete: complete.length, total: trials.length };
}

export type PerDiscipline = Partial<Record<Domain, number>>;

export function computePerDiscipline(trials: TrialRecord[], manifest: DatasetManifest): PerDiscipline {
  const taskDomain = new Map(manifest.tasks.map((t) => [t.task_id, t.domain]));
  const buckets = new Map<Domain, number[]>();
  for (const trial of trials.filter(isComplete)) {
    const domain = taskDomain.get(trial.task.task_id);
    if (!domain) continue;
    const arr = buckets.get(domain) ?? [];
    arr.push(trial.evaluation.reward);
    buckets.set(domain, arr);
  }
  const out: PerDiscipline = {};
  for (const [domain, values] of buckets) {
    out[domain] = round2(values.reduce((a, b) => a + b, 0) / values.length);
  }
  return out;
}

function isComplete(t: TrialRecord): boolean {
  return t.completeness === 'complete' && t.evaluation.validity.verifier_completed;
}

function seedOf(trialIds: string[]): string {
  return [...trialIds].sort().join('|');
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
