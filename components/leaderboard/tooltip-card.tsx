// ABOUTME: Floating / sticky tooltip card for the scatter chart.
// ABOUTME: Pure presentational — parent positions the floating variant via inline style.
import { AXIS_METRICS, type AxisMetric } from '@/lib/aec-bench/axis-metric';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';
import { FrontierBadge } from './frontier-badge';
import { clsx } from '@/lib/clsx';

export interface TooltipCardProps {
  entry: LeaderboardEntry;
  axisMetric: AxisMetric;
  onFrontier: boolean;
  variant?: 'floating' | 'sticky';
  className?: string;
  style?: React.CSSProperties;
}

function formatReward(r: number): string {
  return r.toFixed(2);
}

function formatCi(ci: [number, number] | null): string {
  if (!ci) return '—';
  return `[${ci[0].toFixed(2)} – ${ci[1].toFixed(2)}]`;
}

export function TooltipCard({
  entry,
  axisMetric,
  onFrontier,
  variant = 'floating',
  className,
  style,
}: TooltipCardProps) {
  const x = axisMetric.accessor(entry);
  return (
    <div
      role="tooltip"
      data-variant={variant}
      className={clsx(
        'rounded-sm border border-accent-amber bg-[#050505] p-3 font-mono text-xs text-[#c7c7c7] shadow-lg',
        variant === 'floating' && 'pointer-events-none absolute z-30 max-w-[240px]',
        variant === 'sticky' && 'w-full',
        className,
      )}
      style={style}
    >
      <div className="mb-2 text-accent-amber font-bold">
        <span>{entry.model_display}</span> · <span className="text-[#888]">{entry.adapter}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[#a0a0a0]">
        <dt>reward</dt>
        <dd className="text-[#c7c7c7]">
          {formatReward(entry.reward)} <span className="text-[#888]">{formatCi(entry.reward_ci)}</span>
        </dd>
        <dt>CI</dt>
        <dd className="text-[#c7c7c7]">{formatCi(entry.reward_ci)}</dd>
        <dt>{axisMetric.key}</dt>
        <dd className="text-[#c7c7c7]">
          {x === null ? '—' : axisMetric.format(x)}
        </dd>
        <dt>tokens</dt>
        <dd className="text-[#c7c7c7]">
          {entry.mean_tokens === null ? '—' : AXIS_METRICS.tokens.format(entry.mean_tokens)}
        </dd>
        <dt>latency</dt>
        <dd className="text-[#c7c7c7]">
          {entry.mean_duration_seconds === null
            ? '—'
            : AXIS_METRICS.latency.format(entry.mean_duration_seconds)}
        </dd>
        <dt>trials</dt>
        <dd className="text-[#c7c7c7]">
          {entry.trials} · {entry.repetitions} reps
        </dd>
      </dl>
      {onFrontier && (
        <div className="mt-2 border-t border-[#222] pt-2">
          <FrontierBadge />
        </div>
      )}
    </div>
  );
}
