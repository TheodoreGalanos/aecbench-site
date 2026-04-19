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

export interface CostTiming {
  mean_cost_usd: number | null;
  total_cost_usd: number | null;
  mean_tokens: number | null;
  mean_duration_seconds: number | null;
}

export function computeCostAndTiming(trials: TrialRecord[]): CostTiming {
  const withCost = trials.filter((t) => t.cost !== null) as Array<
    TrialRecord & { cost: NonNullable<TrialRecord['cost']> }
  >;

  const costs = withCost
    .map((t) => t.cost.estimated_cost_usd)
    .filter((v): v is number => v !== null);
  const tokens = withCost
    .map((t) => {
      const tin = t.cost.tokens_in ?? 0;
      const tout = t.cost.tokens_out ?? 0;
      return t.cost.tokens_in === null && t.cost.tokens_out === null ? null : tin + tout;
    })
    .filter((v): v is number => v !== null);

  const mean = (xs: number[]): number | null =>
    xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
  const total = (xs: number[]): number | null =>
    xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0);

  return {
    mean_cost_usd: mean(costs) !== null ? round4(mean(costs)!) : null,
    total_cost_usd: total(costs) !== null ? round4(total(costs)!) : null,
    mean_tokens: mean(tokens) !== null ? Math.round(mean(tokens)!) : null,
    mean_duration_seconds:
      trials.length === 0
        ? null
        : round2(trials.reduce((a, b) => a + b.timing.total_seconds, 0) / trials.length),
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function rankEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.reward !== a.reward) return b.reward - a.reward;
    const aCost = a.mean_cost_usd ?? Number.POSITIVE_INFINITY;
    const bCost = b.mean_cost_usd ?? Number.POSITIVE_INFINITY;
    if (aCost !== bCost) return aCost - bCost;
    return b.complete_trials - a.complete_trials;
  });
  return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
}

export interface PreviousRow {
  model_key: string;
  reward: number;
}

export function applyDelta(
  current: LeaderboardEntry[],
  previous: PreviousRow[],
): LeaderboardEntry[] {
  const prev = new Map(previous.map((p) => [p.model_key, p.reward]));
  return current.map((e) => {
    const prior = prev.get(e.model_key);
    if (prior === undefined) {
      return { ...e, delta_vs_previous: null };
    }
    return { ...e, delta_vs_previous: round2(e.reward - prior) };
  });
}

export interface BuildEntryContext {
  group: TrialGroup;
  manifest: DatasetManifest;
  activeKey: string;
  submissionCount: number;
  is_mock: boolean;
}

export function buildEntry(ctx: BuildEntryContext): LeaderboardEntry {
  const { group, manifest, activeKey, submissionCount, is_mock } = ctx;
  const reward = computeReward(group.trials);
  const perDiscipline = computePerDiscipline(group.trials, manifest);
  const costTiming = computeCostAndTiming(group.trials);

  const lastSubmission = group.trials
    .map((t) => t.timestamp)
    .sort()
    .at(-1)!;

  const uniqueTasks = new Set(group.trials.map((t) => t.task.task_id));
  const repetitions =
    uniqueTasks.size === 0 ? 0 : Math.floor(reward.complete / uniqueTasks.size);

  return {
    rank: 0,
    model_key: group.key,
    model_display: group.entry.display,
    provider: group.entry.provider,
    adapter: group.adapter,
    reward: reward.mean,
    reward_ci: reward.ci,
    per_discipline: perDiscipline,
    trials: reward.total,
    complete_trials: reward.complete,
    repetitions,
    mean_cost_usd: costTiming.mean_cost_usd,
    total_cost_usd: costTiming.total_cost_usd,
    mean_tokens: costTiming.mean_tokens,
    mean_duration_seconds: costTiming.mean_duration_seconds,
    dataset: activeKey,
    last_submission: lastSubmission,
    submission_count: submissionCount,
    delta_vs_previous: null,
    is_mock,
  };
}
