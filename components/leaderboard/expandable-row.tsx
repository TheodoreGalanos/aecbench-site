// ABOUTME: A single table row for the leaderboard — collapsed + expanded states.
// ABOUTME: Framer Motion drives the expansion animation; respects prefers-reduced-motion.
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { FrontierBadge } from './frontier-badge';
import { clsx } from '@/lib/clsx';

export interface ExpandableRowProps {
  entry: LeaderboardEntry;
  rankDisplay: number;
  isExpanded: boolean;
  isHoveredFromChart: boolean;
  onFrontier: boolean;
  onToggle: () => void;
}

function DeltaCell({ v }: { v: number | null }) {
  if (v === null) return <span className="text-[#555]">—</span>;
  const up = v >= 0;
  const sign = up ? '+' : '−';
  return (
    <span className={up ? 'text-[#6fd08a]' : 'text-[#e07b7b]'}>
      {sign}
      {Math.abs(v).toFixed(2)}
    </span>
  );
}

function Bars({ entry }: { entry: LeaderboardEntry }) {
  const values = [
    entry.per_discipline.civil,
    entry.per_discipline.electrical,
    entry.per_discipline.ground,
    entry.per_discipline.mechanical,
    entry.per_discipline.structural,
  ];
  return (
    <div className="flex h-5 items-end gap-[3px]">
      {values.map((v, i) => (
        <div key={i} className="relative min-w-[5px] flex-1 rounded-sm bg-[#1a1a1a]">
          <div
            className="absolute inset-x-0 bottom-0 rounded-sm bg-accent-teal"
            style={{ height: v === null || v === undefined ? 0 : `${Math.round((v as number) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function formatCi(ci: [number, number] | null): string {
  if (!ci) return '—';
  return `[${ci[0].toFixed(2)} – ${ci[1].toFixed(2)}]`;
}

export function ExpandableRow({
  entry,
  rankDisplay,
  isExpanded,
  isHoveredFromChart,
  onFrontier,
  onToggle,
}: ExpandableRowProps) {
  const rowName = `${entry.model_display} ${entry.adapter}`;
  return (
    <>
      <tr
        tabIndex={0}
        aria-label={rowName}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={clsx(
          'cursor-pointer border-b border-[#141414] font-mono text-xs',
          isHoveredFromChart && 'bg-[rgba(232,168,56,0.06)] border-l-2 border-l-accent-amber',
          isExpanded && 'bg-[rgba(232,168,56,0.08)]',
        )}
      >
        <td className="px-3 py-3 font-bold text-accent-amber">
          <span className="text-[#555]">#</span>
          {String(rankDisplay).padStart(2, '0')}
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <div>
              <div className="font-sans font-semibold text-landing-text">{entry.model_display}</div>
              <div className="text-[0.7rem] text-[#888]">
                {entry.provider} · <span className="text-[#888]">{entry.adapter}</span>
                {entry.is_mock && (
                  <span className="ml-2 text-[#888]" aria-label="mock entry">[mock]</span>
                )}
              </div>
            </div>
            {onFrontier && <FrontierBadge />}
          </div>
        </td>
        <td className="hidden px-3 py-3 md:table-cell"><Bars entry={entry} /></td>
        <td className="px-3 py-3 text-right font-bold text-accent-amber">{entry.reward.toFixed(2)}</td>
        <td className="hidden px-3 py-3 md:table-cell"><DeltaCell v={entry.delta_vs_previous} /></td>
        <td className="hidden px-3 py-3 text-right text-[0.72rem] text-[#888] md:table-cell">
          {entry.mean_tokens === null ? '—' : AXIS_METRICS.tokens.format(entry.mean_tokens)}
        </td>
        <td className="px-3 py-3 text-right text-[0.72rem] text-[#888]">
          {entry.mean_cost_usd === null ? '—' : AXIS_METRICS.cost.format(entry.mean_cost_usd)}
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-b border-[#141414] bg-[#080808]"
          >
            <td colSpan={7} className="px-6 py-4 font-mono text-[0.75rem] text-[#c7c7c7]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h4 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">
                    per-discipline reward
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {(['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const).map((d) => (
                      <div key={d} className="flex flex-col items-center">
                        <div className="text-[#888]">{d.slice(0, 3)}</div>
                        <div className="font-bold text-accent-amber">
                          {entry.per_discipline[d]?.toFixed(2) ?? '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[#a0a0a0]">
                    <dt>95% CI</dt>
                    <dd className="text-[#c7c7c7]">{formatCi(entry.reward_ci)}</dd>
                    <dt>trials</dt>
                    <dd className="text-[#c7c7c7]">
                      {entry.trials} ({entry.repetitions} reps)
                    </dd>
                    <dt>last submission</dt>
                    <dd className="text-[#c7c7c7]">{entry.last_submission}</dd>
                    <dt>Δ vs previous</dt>
                    <dd className="text-[#c7c7c7]">
                      <DeltaCell v={entry.delta_vs_previous} />
                    </dd>
                  </dl>
                </section>
              </div>
              <div className="mt-3 text-[0.65rem] text-[#555]">
                full model detail coming in Phase 4 →
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
