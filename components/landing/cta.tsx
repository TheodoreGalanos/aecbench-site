// ABOUTME: Bottom call-to-action section for the landing page.
// ABOUTME: Encourages users to submit models or contribute tasks.
import Link from 'next/link';
import { GitFork } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-landing-text md:text-4xl">
          Evaluate your model against real engineering challenges.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/docs/start/quickstart" className="rounded-lg bg-accent-amber px-6 py-3 font-semibold text-landing-bg transition-opacity hover:opacity-90">
            Submit Your Model
          </Link>
          <Link href="/docs" className="rounded-lg border border-landing-border px-6 py-3 font-semibold text-landing-text transition-colors hover:border-accent-amber">
            Contribute Tasks
          </Link>
        </div>
        <div className="mt-6">
          <a href="https://github.com/aurecon/aec-bench" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-landing-muted transition-colors hover:text-landing-text">
            <GitFork className="h-4 w-4" />
            github.com/aurecon/aec-bench
          </a>
        </div>
      </div>
    </section>
  );
}
