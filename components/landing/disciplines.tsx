// ABOUTME: Disciplines showcase for all six public catalogue disciplines.
// ABOUTME: Each card links to /tasks#discipline and displays live built/proposed counts.
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { FadeUp } from './motion-primitives';
import {
  CivilGlyph,
  ElectricalGlyph,
  GroundGlyph,
  MaritimeGlyph,
  MechanicalGlyph,
  StructuralGlyph,
} from './discipline-glyphs';
import type { ComponentType } from 'react';
import type { CatalogueDiscipline } from '@/lib/aec-bench/contracts';
import { CATALOGUE_DISCIPLINE_ORDER, DISCIPLINE_META } from '@/lib/disciplines';

const GLYPHS: Record<CatalogueDiscipline, ComponentType<{ className?: string }>> = {
  civil: CivilGlyph,
  electrical: ElectricalGlyph,
  ground: GroundGlyph,
  mechanical: MechanicalGlyph,
  structural: StructuralGlyph,
  maritime: MaritimeGlyph,
};

export interface DisciplinesProps {
  counts: Record<CatalogueDiscipline, { templates: number; seeds: number }>;
  totalTasks: number;
}

export function Disciplines({ counts, totalTasks }: DisciplinesProps) {
  const built = Object.values(counts).reduce((total, count) => total + count.templates, 0);
  const proposed = Object.values(counts).reduce((total, count) => total + count.seeds, 0);

  return (
    <BlueprintBg>
      <SheetCorners figNumber={4} figName="DISCIPLINES" />
      <FadeUp>
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <SectionAnno number={4} name="Disciplines" />
          <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
            Six engineering disciplines
          </h2>
          <p className="mb-8 mt-1 font-mono text-xs text-landing-muted">
            <span className="text-accent-amber">{built} built</span> · {proposed} proposed ·{' '}
            {totalTasks} catalogue entries
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {CATALOGUE_DISCIPLINE_ORDER.map((slug) => {
              const meta = DISCIPLINE_META[slug];
              const Glyph = GLYPHS[slug];
              const c = counts[slug] ?? { templates: 0, seeds: 0 };
              return (
                <Link
                  key={slug}
                  href={`/tasks#${slug}-tasks-heading`}
                  className="group flex min-h-[170px] flex-col overflow-hidden rounded border border-landing-border bg-[#050505] p-4 transition-colors hover:border-accent-amber"
                >
                  <div className="mb-2 flex justify-between font-mono text-[0.6rem] uppercase tracking-wider text-[#666]">
                    <span>{meta.code.split('·')[0]}·</span>
                    <span className="text-accent-amber">{meta.code.split('·')[1]}</span>
                  </div>
                  <span className="sr-only">{meta.code}</span>
                  <Glyph className="mb-2" />
                  <h3 className="text-base font-semibold text-landing-text">{meta.name}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-landing-muted">
                    {meta.description}
                  </p>
                  <div className="mt-2 font-mono text-xs">
                    <span className="text-accent-amber">{c.templates} built</span>
                  </div>
                  <div className="font-mono text-[0.65rem] text-landing-muted">
                    + {c.seeds} proposed
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </FadeUp>
    </BlueprintBg>
  );
}
