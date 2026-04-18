// ABOUTME: Terminal-style table shell — window chrome, sortable header, rows.
// ABOUTME: Row bodies are ExpandableRow; sort state + handlers are owned by the parent hook.
'use client';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';
import type { SortSpec, SortColumn } from '@/lib/aec-bench/sort';
import { ExpandableRow } from './expandable-row';

export interface LeaderboardTableProps {
  entries: ReadonlyArray<LeaderboardEntry>;
  frontierKeys: ReadonlySet<string>;
  hoveredRowKey: string | null;
  expandedRowKey: string | null;
  sort: SortSpec;
  onSortChange: (next: SortSpec) => void;
  onRowToggle: (key: string) => void;
}

function rowKey(e: LeaderboardEntry): string {
  return `${e.model_key}::${e.adapter}`;
}

interface HeaderCell {
  key: SortColumn | null;
  label: string;
  align?: 'left' | 'right';
  hideMobile?: boolean;
}

const HEADERS: HeaderCell[] = [
  { key: null, label: '#' },
  { key: 'model', label: 'MODEL' },
  { key: null, label: 'PER-DISCIPLINE', hideMobile: true },
  { key: 'reward', label: 'REWARD', align: 'right' },
  { key: 'delta', label: 'Δ LAST', align: 'right', hideMobile: true },
  { key: 'tokens', label: 'TOKENS', align: 'right', hideMobile: true },
  { key: 'cost', label: '$', align: 'right' },
];

function nextSort(current: SortSpec, col: SortColumn): SortSpec {
  if (current.column === col) {
    return { column: col, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  }
  const numeric: SortColumn[] = ['reward', 'delta', 'tokens', 'cost', 'rank'];
  return { column: col, dir: numeric.includes(col) ? 'desc' : 'asc' };
}

export function LeaderboardTable({
  entries,
  frontierKeys,
  hoveredRowKey,
  expandedRowKey,
  sort,
  onSortChange,
  onRowToggle,
}: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-landing-border bg-[#050505]">
      <div className="flex items-center gap-2 border-b border-landing-border bg-landing-bg px-3 py-2 font-mono text-[0.7rem] text-[#666]">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-landing-border" />
          <span className="h-2 w-2 rounded-full bg-landing-border" />
          <span className="h-2 w-2 rounded-full bg-landing-border" />
        </div>
        <span className="ml-1">~/aec-bench / leaderboard</span>
        <span className="ml-auto text-[0.65rem]">
          {entries.length} rows · {frontierKeys.size} on frontier
        </span>
      </div>
      <div className="border-b border-landing-border px-3 py-2 font-mono text-xs text-[#c7c7c7]">
        <span className="text-accent-teal">aec-bench ~ $</span>{' '}
        <span>sort --by </span>
        <span className="text-accent-amber">{sort.column}</span>{' '}
        <span className="text-accent-amber">--{sort.dir}</span>
      </div>
      <div className="overflow-x-auto">
        <table role="table" className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-landing-border text-[0.62rem] uppercase tracking-wider text-[#666]">
              {HEADERS.map((h) => {
                const ariaSort: 'none' | 'ascending' | 'descending' =
                  h.key && sort.column === h.key
                    ? sort.dir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none';
                const caret = h.key && sort.column === h.key ? (sort.dir === 'asc' ? '▴' : '▾') : '';
                return (
                  <th
                    key={h.label}
                    scope="col"
                    aria-sort={ariaSort}
                    onClick={h.key ? () => onSortChange(nextSort(sort, h.key!)) : undefined}
                    className={
                      (h.hideMobile ? 'hidden md:table-cell ' : '') +
                      'px-3 py-2 ' +
                      (h.align === 'right' ? 'text-right ' : '') +
                      (h.key ? 'cursor-pointer select-none hover:text-[#c7c7c7]' : '')
                    }
                  >
                    {h.label} {caret}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <ExpandableRow
                key={rowKey(e)}
                entry={e}
                rankDisplay={i + 1}
                isExpanded={expandedRowKey === rowKey(e)}
                isHoveredFromChart={hoveredRowKey === rowKey(e)}
                onFrontier={frontierKeys.has(rowKey(e))}
                onToggle={() => onRowToggle(rowKey(e))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
