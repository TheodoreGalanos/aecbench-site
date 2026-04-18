// ABOUTME: Single source of truth for /leaderboard interactive state.
// ABOUTME: URL-synced filter/sort/axis/expansion; derived reshaped/sorted/points/frontier.
'use client';
import { useCallback, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { LeaderboardEntry, Domain } from '@/lib/aec-bench/contracts';
import { DOMAINS } from '@/lib/aec-bench/contracts';
import type { AxisKey } from '@/lib/aec-bench/axis-metric';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { filterAndReshape } from '@/lib/aec-bench/filter';
import { sortEntries, type SortColumn, type SortSpec } from '@/lib/aec-bench/sort';
import { computeParetoFrontier, type ScatterPoint } from '@/lib/aec-bench/pareto';

const VALID_AXES: AxisKey[] = ['cost', 'tokens', 'latency'];
const VALID_SORT_COLUMNS: SortColumn[] = [
  'rank', 'model', 'reward', 'delta', 'tokens', 'cost',
  'civil', 'electrical', 'ground', 'mechanical', 'structural',
];

function parseAxis(v: string | null): AxisKey {
  return VALID_AXES.includes(v as AxisKey) ? (v as AxisKey) : 'cost';
}

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseDisciplines(v: string | null): Domain[] {
  return parseList(v).filter((d): d is Domain => DOMAINS.includes(d as Domain));
}

function parseSort(col: string | null, dir: string | null): SortSpec {
  const column = VALID_SORT_COLUMNS.includes(col as SortColumn) ? (col as SortColumn) : 'rank';
  const direction: 'asc' | 'desc' = dir === 'desc' ? 'desc' : 'asc';
  return { column, dir: direction };
}

export interface LeaderboardStateOptions {
  lockedDiscipline?: Domain;
  lockedHarness?: string;
}

export function useLeaderboardState(
  entries: ReadonlyArray<LeaderboardEntry>,
  options: LeaderboardStateOptions,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const axisX = parseAxis(searchParams.get('x'));
  const disciplinesFromUrl = parseDisciplines(searchParams.get('d'));
  const disciplines: Domain[] = options.lockedDiscipline
    ? [options.lockedDiscipline]
    : disciplinesFromUrl;
  const harnessesFromUrl = parseList(searchParams.get('h'));
  const harnesses: string[] = options.lockedHarness
    ? [options.lockedHarness]
    : harnessesFromUrl;
  const sort = parseSort(searchParams.get('sort'), searchParams.get('dir'));

  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);

  const reshaped = useMemo(
    () => filterAndReshape(entries, { disciplines, harnesses }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, disciplines.join(','), harnesses.join(',')],
  );
  const sorted = useMemo(() => sortEntries(reshaped, sort), [reshaped, sort]);
  const points = useMemo<ScatterPoint[]>(() => {
    const metric = AXIS_METRICS[axisX];
    const out: ScatterPoint[] = [];
    for (const e of sorted) {
      const x = metric.accessor(e);
      if (x === null) continue;
      out.push({ key: `${e.model_key}::${e.adapter}`, x, y: e.reward });
    }
    return out;
  }, [sorted, axisX]);
  const frontierKeys = useMemo(() => computeParetoFrontier(points), [points]);

  const expandedRowKeyFromUrl = searchParams.get('open');
  const expandedRowKey = useMemo(() => {
    if (!expandedRowKeyFromUrl) return null;
    const present = sorted.some(
      (e) => `${e.model_key}::${e.adapter}` === expandedRowKeyFromUrl,
    );
    return present ? expandedRowKeyFromUrl : null;
  }, [expandedRowKeyFromUrl, sorted]);

  const write = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setAxisX = useCallback((v: AxisKey) => write({ x: v }), [write]);
  const setDisciplines = useCallback(
    (ds: Domain[]) => write({ d: ds.length ? ds.join(',') : null }),
    [write],
  );
  const setHarnesses = useCallback(
    (hs: string[]) => write({ h: hs.length ? hs.join(',') : null }),
    [write],
  );
  const setSort = useCallback(
    (s: SortSpec) => write({ sort: s.column, dir: s.dir }),
    [write],
  );
  const setExpandedRowKey = useCallback(
    (k: string | null) => write({ open: k }),
    [write],
  );
  const toggleExpanded = useCallback(
    (k: string) => write({ open: expandedRowKey === k ? null : k }),
    [write, expandedRowKey],
  );

  const applyBatch = useCallback(
    (state: { axisX: AxisKey; disciplines: Domain[]; harnesses: string[] }) => {
      write({
        x: state.axisX,
        d: state.disciplines.length ? state.disciplines.join(',') : null,
        h: state.harnesses.length ? state.harnesses.join(',') : null,
      });
    },
    [write],
  );

  return {
    axisX,
    disciplines,
    harnesses,
    sort,
    hoveredRowKey,
    expandedRowKey,
    reshaped,
    sorted,
    points,
    frontierKeys,
    setAxisX,
    setDisciplines,
    setHarnesses,
    setSort,
    setHoveredRowKey,
    setExpandedRowKey,
    toggleExpanded,
    applyBatch,
  };
}
