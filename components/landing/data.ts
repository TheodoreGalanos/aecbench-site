// components/landing/data.ts
// ABOUTME: Adapts the build-emitted leaderboard artefact into the PreviewModel shape.
// ABOUTME: Existing landing components read PreviewModel without knowing the source changed.
import { getTopN } from '@/lib/aec-bench/read';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';

export type Provider = 'anthropic' | 'openai' | 'google' | 'meta' | 'other';

export interface PreviewModel {
  rank: number;
  model: string;
  provider: Provider;
  overallScore: number;
  disciplines: {
    civil: number;
    electrical: number;
    ground: number;
    mechanical: number;
    structural: number;
  };
  tokensMillions: number;
  costUsd: number;
  /** Change vs previous run — positive means improvement (reward went up). */
  deltaLastRun: number;
  costPerTask: number;
}

function adapt(entry: LeaderboardEntry): PreviewModel {
  return {
    rank: entry.rank,
    model: entry.model_display,
    provider: entry.provider,
    overallScore: entry.reward,
    disciplines: {
      civil: entry.per_discipline.civil ?? 0,
      electrical: entry.per_discipline.electrical ?? 0,
      ground: entry.per_discipline.ground ?? 0,
      mechanical: entry.per_discipline.mechanical ?? 0,
      structural: entry.per_discipline.structural ?? 0,
    },
    tokensMillions:
      entry.mean_tokens === null ? 0 : Math.round((entry.mean_tokens * entry.trials) / 1e4) / 100,
    costUsd: entry.total_cost_usd ?? 0,
    deltaLastRun: entry.delta_vs_previous ?? 0,
    costPerTask: entry.mean_cost_usd ?? 0,
  };
}

export const previewModels: PreviewModel[] = getTopN(4).map(adapt);
