// ABOUTME: Hero section for the landing page.
// ABOUTME: Blueprint grid background, scanline overlay, terminal readout, commanded buttons.
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { HeroReadout } from './hero-readout';
import { FadeUp } from './motion-primitives';

export function Hero() {
  return (
    <BlueprintBg className="scanlines overflow-hidden">
      <SheetCorners figNumber={1} figName="HERO" />
      <HeroReadout />
      <FadeUp>
        <div className="mx-auto flex max-w-3xl flex-col items-start px-6 py-24 md:py-32">
        <SectionAnno number={1} name="Hero" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-landing-text md:text-6xl">
          How capable is AI at real engineering?
          <span
            aria-hidden="true"
            className="ml-1 inline-block h-[0.9em] w-[0.45em] translate-y-[0.05em] bg-accent-amber motion-safe:animate-pulse"
            style={{ boxShadow: '0 0 12px rgba(232,168,56,0.45)' }}
          />
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-landing-muted md:text-base">
          <span className="text-accent-amber">aec-bench</span> measures AI performance across{' '}
          <span className="text-accent-amber">500+</span> tasks in architecture, engineering and
          construction — cable sizing, seismic design, hydraulic modelling, HVAC, geotech. Real
          problems, real standards, automated scoring.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 rounded border border-accent-amber bg-accent-amber px-4 py-3 font-mono text-sm font-semibold text-landing-bg transition-shadow hover:shadow-[0_0_0_3px_rgba(232,168,56,0.2)]"
          >
            <span aria-hidden="true">$</span>explore_results
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm font-semibold text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden="true" className="text-accent-teal">&gt;</span>read_the_docs
          </Link>
        </div>
      </div>
      </FadeUp>
    </BlueprintBg>
  );
}
