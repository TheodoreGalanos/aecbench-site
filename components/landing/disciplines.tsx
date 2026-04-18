// ABOUTME: Disciplines showcase — 5 cards in a single row on desktop, two on tablet, one on mobile.
// ABOUTME: Each card links to a per-discipline leaderboard subroute (may 404 until Phase 3).
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

interface Discipline {
  slug: string;
  code: string;
  name: string;
  description: string;
  taskCount: number;
  Glyph: ComponentType<{ className?: string }>;
}

const disciplines: Discipline[] = [
  { slug: 'civil',       code: 'CIV·01', name: 'Civil',       description: 'Roads, drainage, hydraulics, earthworks.',     taskCount: 108, Glyph: CivilGlyph      },
  { slug: 'electrical',  code: 'ELE·02', name: 'Electrical',  description: 'Cable sizing, fault current, lighting, power.', taskCount: 121, Glyph: ElectricalGlyph },
  { slug: 'ground',      code: 'GND·03', name: 'Ground',      description: 'Foundations, slopes, retaining walls.',         taskCount: 94,  Glyph: GroundGlyph     },
  { slug: 'mechanical',  code: 'MEC·04', name: 'Mechanical',  description: 'HVAC, fire protection, piping, acoustics.',     taskCount: 116, Glyph: MechanicalGlyph },
  { slug: 'structural',  code: 'STR·05', name: 'Structural',  description: 'Steel/concrete design, seismic, connections.',  taskCount: 108, Glyph: StructuralGlyph },
];

export function Disciplines() {
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
          coverage <span className="text-accent-amber">547/547</span> tasks · verified against
          AS/NZS standards
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {disciplines.map(({ slug, code, name, description, taskCount, Glyph }) => (
            <Link
              key={slug}
              href={`/leaderboard/${slug}`}
              className="group flex min-h-[170px] flex-col overflow-hidden rounded border border-landing-border bg-[#050505] p-4 transition-colors hover:border-accent-amber"
            >
              <div className="mb-2 flex justify-between font-mono text-[0.6rem] uppercase tracking-wider text-[#666]">
                <span>{code.split('·')[0]}·</span>
                <span className="text-accent-amber">{code.split('·')[1]}</span>
              </div>
              <span className="sr-only">{code}</span>
              <Glyph className="mb-2" />
              <h3 className="text-base font-semibold text-landing-text">{name}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-landing-muted">{description}</p>
              <div className="mt-2 font-mono text-xs text-accent-amber">
                {taskCount} <span className="text-[#555]">tasks</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      </FadeUp>
    </BlueprintBg>
  );
}
