// ABOUTME: Bottom-sheet filter UI for <640px. Batches selections locally until [apply].
// ABOUTME: Used in place of the inline ControlStrip on mobile.
'use client';
import { useState } from 'react';
import type { Domain } from '@/lib/aec-bench/contracts';
import { DOMAINS } from '@/lib/aec-bench/contracts';
import type { AxisKey } from '@/lib/aec-bench/axis-metric';
import { clsx } from '@/lib/clsx';

export interface MobileFilterSheetProps {
  axisX: AxisKey;
  disciplines: ReadonlyArray<Domain>;
  harnesses: ReadonlyArray<string>;
  harnessOptions: ReadonlyArray<string>;
  activeFilterCount: number;
  onApply: (state: { axisX: AxisKey; disciplines: Domain[]; harnesses: string[] }) => void;
}

const AXES: AxisKey[] = ['cost', 'tokens', 'latency'];

export function MobileFilterSheet({
  axisX,
  disciplines,
  harnesses,
  harnessOptions,
  activeFilterCount,
  onApply,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    axisX,
    disciplines: [...disciplines] as Domain[],
    harnesses: [...harnesses],
  });

  function openSheet() {
    setDraft({ axisX, disciplines: [...disciplines], harnesses: [...harnesses] });
    setOpen(true);
  }

  function toggle<T extends string>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="rounded-sm border border-landing-border bg-[#050505] px-3 py-1.5 font-mono text-xs text-[#c7c7c7]"
      >
        filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="filters"
          className="fixed inset-0 z-40 flex items-end bg-black/60"
        >
          <div className="mx-auto w-full max-w-2xl rounded-t-md border-t border-x border-landing-border bg-[#0a0a0a] p-4 font-mono text-xs text-[#c7c7c7]">
            <section className="mb-4">
              <h3 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">x-axis</h3>
              <div className="flex gap-1">
                {AXES.map((a) => (
                  <button
                    key={a}
                    role="option"
                    aria-selected={draft.axisX === a}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, axisX: a }))}
                    className={clsx(
                      'rounded-sm border px-3 py-1.5',
                      draft.axisX === a ? 'border-accent-amber text-accent-amber' : 'border-[#222]',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-4">
              <h3 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">--discipline</h3>
              <div className="flex flex-wrap gap-1">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    role="option"
                    aria-selected={draft.disciplines.includes(d)}
                    type="button"
                    onClick={() => setDraft((dr) => ({ ...dr, disciplines: toggle(dr.disciplines, d) }))}
                    className={clsx(
                      'rounded-full border px-3 py-1',
                      draft.disciplines.includes(d)
                        ? 'border-accent-amber text-accent-amber'
                        : 'border-[#222]',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-6">
              <h3 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">--harness</h3>
              <div className="flex flex-wrap gap-1">
                {harnessOptions.map((h) => (
                  <button
                    key={h}
                    role="option"
                    aria-selected={draft.harnesses.includes(h)}
                    type="button"
                    onClick={() => setDraft((dr) => ({ ...dr, harnesses: toggle(dr.harnesses, h) }))}
                    className={clsx(
                      'rounded-full border px-3 py-1',
                      draft.harnesses.includes(h)
                        ? 'border-accent-amber text-accent-amber'
                        : 'border-[#222]',
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-[#222] px-4 py-1.5"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                className="rounded-sm border border-accent-amber bg-accent-amber/10 px-4 py-1.5 text-accent-amber"
              >
                apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
