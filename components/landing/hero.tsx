// ABOUTME: Hero section for the landing page.
// ABOUTME: Displays headline, subtitle, and two CTA buttons.
import Link from 'next/link';

export function Hero() {
  return (
    <section className="flex flex-col items-center px-6 py-24 text-center md:py-32">
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-landing-text md:text-6xl">
        How Capable Is AI at Real Engineering?
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-landing-muted md:text-xl">
        aec-bench measures AI performance across 500+ tasks in architecture,
        engineering and construction — from cable sizing to seismic design.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/leaderboard"
          className="rounded-lg bg-accent-amber px-6 py-3 font-semibold text-landing-bg transition-opacity hover:opacity-90"
        >
          Explore Results
        </Link>
        <Link
          href="/docs"
          className="rounded-lg border border-landing-border px-6 py-3 font-semibold text-landing-text transition-colors hover:border-accent-amber"
        >
          Read the Docs
        </Link>
      </div>
    </section>
  );
}
