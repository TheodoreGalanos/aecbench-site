// ABOUTME: Disciplines showcase — 5 cards in a row; metadata pulled from lib/disciplines.
// ABOUTME: Each card links to /leaderboard/[discipline] and displays live built/proposed counts.
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { FadeUp } from './motion-primitives';
import {
  CivilGlyph,
  ElectricalGlyph,
  GroundGlyph,
  MechanicalGlyph,
  StructuralGlyph,
} from './discipline-glyphs';
import type { ComponentType } from 'react';
import type { Domain } from '@/lib/aec-bench/contracts';
import { DISCIPLINE_META, DISCIPLINE_ORDER } from '@/lib/disciplines';

const GLYPHS: Record<Domain, ComponentType<{ className?: string }>> = {
  civil: CivilGlyph,
  electrical: ElectricalGlyph,
  ground: GroundGlyph,
  mechanical: MechanicalGlyph,
  structural: StructuralGlyph,
};

export interface DisciplinesProps {
  counts: Record<Domain, { templates: number; seeds: number }>;
  totalTasks: number;
}

export function Disciplines({ counts, totalTasks }: DisciplinesProps) {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={4} figName="DISCIPLINES" />
      <FadeUp>
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <SectionAnno number={4} name="Disciplines" />
          <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
            Five engineering disciplines
          </h2>
          <p className="mb-8 mt-1 font-mono text-xs text-landing-muted">
            coverage <span className="text-accent-amber">{totalTasks}/{totalTasks}</span> tasks · verified against
            AS/NZS standards
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {DISCIPLINE_ORDER.map((slug) => {
              const meta = DISCIPLINE_META[slug];
              const Glyph = GLYPHS[slug];
              const c = counts[slug] ?? { templates: 0, seeds: 0 };
              return (
                <Link
                  key={slug}
                  href={`/leaderboard/${slug}`}
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
