// ABOUTME: Top-level client container for /leaderboard and /leaderboard/[discipline].
// ABOUTME: Composes ControlStrip (or MobileFilterSheet), ScatterChart, Legend, Table, trailingSlot.
'use client';
import { useMemo } from 'react';
import type { LeaderboardEntry, Domain, RunStatus } from '@/lib/aec-bench/contracts';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { useLeaderboardState } from './use-leaderboard-state';
import { ControlStrip } from './control-strip';
import { MobileFilterSheet } from './mobile-filter-sheet';
import { ScatterChart } from './scatter-chart';
import { Legend } from './legend';
import { LeaderboardTable } from './leaderboard-table';

export interface LeaderboardSurfaceProps {
  entries: ReadonlyArray<LeaderboardEntry>;
  isMock: boolean;
  runStatus: RunStatus;
  heading: string;
  subheading?: string;
  lockedDiscipline?: Domain;
  lockedHarness?: string;
  trailingSlot?: React.ReactNode;
}

export function LeaderboardSurface({
  entries,
  isMock,
  runStatus,
  heading,
  subheading,
  lockedDiscipline,
  lockedHarness,
  trailingSlot,
}: LeaderboardSurfaceProps) {
  const state = useLeaderboardState(entries, { lockedDiscipline, lockedHarness });

  const harnessOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(e.adapter);
    return Array.from(set).sort();
  }, [entries]);

  const activeFilterCount =
    (lockedDiscipline ? 0 : state.disciplines.length) +
    (lockedHarness ? 0 : state.harnesses.length);

  const yAxisLabel =
    state.disciplines.length === 0
      ? 'reward'
      : state.disciplines.length === 1
        ? `reward (${state.disciplines[0]})`
        : `reward (${state.disciplines.join(' + ')} mean)`;

  const dataset = entries[0]?.dataset ?? 'dataset';
  const headingId = 'leaderboard-heading';

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <header className="mb-6">
        <h1 id={headingId} className="text-3xl font-bold text-landing-text md:text-4xl">
          {heading}
        </h1>
        {subheading && <p className="mt-2 text-sm text-landing-muted">{subheading}</p>}
        <p className="mt-2 font-mono text-xs text-landing-muted">
          dataset <span className="text-accent-amber">{dataset}</span> · {runStatus.tasks} tasks ·{' '}
          {runStatus.disciplines} disciplines · {runStatus.models} models
        </p>
        {isMock && (
          <p className="mt-2 font-mono text-[0.7rem] text-[#888]">
            ⚠ frontier and values are from mock submissions — real data lands as submissions arrive
          </p>
        )}
      </header>

      <div className="mb-4 hidden md:block">
        <ControlStrip
          axisX={state.axisX}
          disciplines={state.disciplines}
          harnesses={state.harnesses}
          harnessOptions={harnessOptions}
          lockedDiscipline={lockedDiscipline}
          lockedHarness={lockedHarness}
          onAxisChange={state.setAxisX}
          onDisciplinesChange={state.setDisciplines}
          onHarnessesChange={state.setHarnesses}
        />
      </div>
      <div className="mb-4 md:hidden">
        <MobileFilterSheet
          axisX={state.axisX}
          disciplines={state.disciplines}
          harnesses={state.harnesses}
          harnessOptions={harnessOptions}
          activeFilterCount={activeFilterCount}
          onApply={state.applyBatch}
        />
      </div>

      <div className="mb-2">
        <ScatterChart
          entries={state.sorted}
          axisMetric={AXIS_METRICS[state.axisX]}
          yAxisLabel={yAxisLabel}
          frontierKeys={state.frontierKeys}
          hoveredRowKey={state.hoveredRowKey}
          expandedRowKey={state.expandedRowKey}
          onDotHover={state.setHoveredRowKey}
          onDotClick={state.toggleExpanded}
        />
      </div>
      {state.disciplines.length > 0 && (
        <p className="mb-2 font-mono text-[0.65rem] text-[#666]">
          ⓘ cost / tokens / latency are overall across all disciplines — library does not yet track
          per-discipline costs
        </p>
      )}
      <div className="mb-6">
        <Legend />
      </div>

      <LeaderboardTable
        entries={state.sorted}
        frontierKeys={state.frontierKeys}
        hoveredRowKey={state.hoveredRowKey}
        expandedRowKey={state.expandedRowKey}
        sort={state.sort}
        onSortChange={state.setSort}
        onRowToggle={state.toggleExpanded}
      />

      {trailingSlot && <div className="mt-8">{trailingSlot}</div>}
    </section>
  );
}
