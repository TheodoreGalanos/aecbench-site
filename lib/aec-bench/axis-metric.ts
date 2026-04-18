// ABOUTME: Axis metric registry — maps axis keys to label, accessor, and formatter.
// ABOUTME: Single source of truth shared by scatter chart, tooltip, and table.
import type { LeaderboardEntry } from './contracts';

export type AxisKey = 'cost' | 'tokens' | 'latency';

export interface AxisMetric {
  key: AxisKey;
  label: string;
  accessor: (e: LeaderboardEntry) => number | null;
  format: (v: number) => string;
}

function formatCost(v: number): string {
  return `$${v.toFixed(2)}`;
}

function formatTokens(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${(v / 1_000).toFixed(1)}k`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}

function formatLatency(v: number): string {
  if (v < 60) return `${v.toFixed(1)}s`;
  return `${(v / 60).toFixed(1)}min`;
}

export const AXIS_METRICS: Record<AxisKey, AxisMetric> = {
  cost: {
    key: 'cost',
    label: 'cost / task (USD)',
    accessor: (e) => e.mean_cost_usd,
    format: formatCost,
  },
  tokens: {
    key: 'tokens',
    label: 'tokens / task (avg)',
    accessor: (e) => e.mean_tokens,
    format: formatTokens,
  },
  latency: {
    key: 'latency',
    label: 'latency / task (avg)',
    accessor: (e) => e.mean_duration_seconds,
    format: formatLatency,
  },
};
