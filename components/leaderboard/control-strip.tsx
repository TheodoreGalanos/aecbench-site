// ABOUTME: CLI-prompt row with three chips (--x, --discipline, --harness).
// ABOUTME: Each chip opens a ControlStripPopover. Locked filters hide the chip.
'use client';
import { useState } from 'react';
import type { Domain } from '@/lib/aec-bench/contracts';
import { DOMAINS } from '@/lib/aec-bench/contracts';
import type { AxisKey } from '@/lib/aec-bench/axis-metric';
import { ControlStripPopover } from './control-strip-popover';
import { clsx } from '@/lib/clsx';

const AXIS_OPTIONS = [
  { value: 'cost', label: 'cost' },
  { value: 'tokens', label: 'tokens' },
  { value: 'latency', label: 'latency' },
] as const;

const DISCIPLINE_OPTIONS = DOMAINS.map((d) => ({ value: d, label: d }));

function summarise(picked: ReadonlyArray<string>, allLabel = 'all'): string {
  if (picked.length === 0) return allLabel;
  if (picked.length === 1) return picked[0];
  return `${picked[0]} +${picked.length - 1}`;
}

interface Props {
  axisX: AxisKey;
  disciplines: ReadonlyArray<Domain>;
  harnesses: ReadonlyArray<string>;
  harnessOptions: ReadonlyArray<string>;
  lockedDiscipline?: Domain;
  lockedHarness?: string;
  onAxisChange: (next: AxisKey) => void;
  onDisciplinesChange: (next: Domain[]) => void;
  onHarnessesChange: (next: string[]) => void;
}

type OpenChip = 'x' | 'discipline' | 'harness' | null;

export function ControlStrip(props: Props) {
  const [open, setOpen] = useState<OpenChip>(null);

  function Chip({
    flag,
    value,
    chip,
    children,
  }: {
    flag: string;
    value: string;
    chip: OpenChip;
    children?: React.ReactNode;
  }) {
    return (
      <span className="relative inline-flex items-center gap-1">
        <span className="text-accent-amber">{flag}</span>
        <button
          type="button"
          onClick={() => setOpen(open === chip ? null : chip)}
          aria-label={`${flag} ${value}`}
          className={clsx(
            'rounded-sm border px-1.5 py-0.5 text-[#c7c7c7]',
            open === chip ? 'border-accent-amber bg-[rgba(232,168,56,0.1)]' : 'border-[#222] hover:border-accent-teal',
          )}
        >
          {value} ▾
        </button>
        {children}
      </span>
    );
  }

  return (
    <div className="rounded-sm border border-landing-border bg-[#050505] p-3 font-mono text-xs text-[#c7c7c7]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-accent-teal">$</span>
        <span>bench leaderboard</span>

        <Chip flag="--x" value={props.axisX} chip="x">
          {open === 'x' && (
            <ControlStripPopover
              options={AXIS_OPTIONS}
              selected={[props.axisX]}
              multi={false}
              onChange={(next) => {
                if (next[0]) props.onAxisChange(next[0] as AxisKey);
                setOpen(null);
              }}
              onClose={() => setOpen(null)}
            />
          )}
        </Chip>

        {!props.lockedDiscipline && (
          <Chip flag="--discipline" value={summarise(props.disciplines)} chip="discipline">
            {open === 'discipline' && (
              <ControlStripPopover
                options={DISCIPLINE_OPTIONS}
                selected={[...props.disciplines]}
                multi
                showClear
                onChange={(next) => props.onDisciplinesChange(next as Domain[])}
                onClose={() => setOpen(null)}
              />
            )}
          </Chip>
        )}

        {!props.lockedHarness && (
          <Chip flag="--harness" value={summarise(props.harnesses)} chip="harness">
            {open === 'harness' && (
              <ControlStripPopover
                options={props.harnessOptions.map((h) => ({ value: h, label: h }))}
                selected={[...props.harnesses]}
                multi
                showClear
                onChange={(next) => props.onHarnessesChange(next)}
                onClose={() => setOpen(null)}
              />
            )}
          </Chip>
        )}
      </div>
    </div>
  );
}
