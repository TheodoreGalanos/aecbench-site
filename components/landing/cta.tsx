// ABOUTME: Bottom call-to-action — pip install copy-box, version meta line, three secondary commands.
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { CopyBox } from './copy-box';

export function CallToAction() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={6} figName="CTA" />
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <div className="flex justify-center">
          <SectionAnno number={6} name="Run it yourself" />
        </div>
        <h2 className="mt-3 text-3xl font-bold leading-tight text-landing-text md:text-4xl">
          Benchmark your model against real engineering.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-landing-muted">
          Open-source. Reproducible. Runs locally or against any provider.
        </p>

        <div className="mt-8">
          <CopyBox command="pip install aec-bench" />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3 font-mono text-xs text-landing-muted">
          <span>latest <span className="text-accent-amber">v0.4.1</span></span>
          <span>·</span>
          <Link
            href="https://github.com/aurecon/aec-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-landing-text"
          >
            github.com/aurecon/aec-bench
          </Link>
          <span>·</span>
          <span className="text-accent-teal">2.4k ★</span>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs/start/quickstart"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden="true" className="text-accent-teal">&gt;</span>quickstart
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden="true" className="text-accent-teal">&gt;</span>contribute a task
          </Link>
          <Link
            href="https://github.com/aurecon/aec-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden="true" className="text-accent-teal">&gt;</span>submit your model
          </Link>
        </div>
      </div>
    </BlueprintBg>
  );
}
