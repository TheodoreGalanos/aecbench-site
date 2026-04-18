// scripts/ingest/aggregate.ts
// ABOUTME: Aggregation — grouping, reward mean+CI, per-discipline, cost rollup, ranking, delta.
// ABOUTME: Functions are pure. Orchestrator calls them in sequence.
import type {
  LeaderboardEntry,
  ModelEntry,
  TrialRecord,
} from '@/lib/aec-bench/contracts';
import { modelKey, resolveModel } from '@/scripts/ingest/registry';

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
