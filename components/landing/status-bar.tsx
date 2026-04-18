// ABOUTME: Persistent mono status bar mounted below the site nav on landing pages.
// ABOUTME: Pulsing LIVE dot is disabled under prefers-reduced-motion.
'use client';

import { useReducedMotion } from 'framer-motion';
import { runStatus } from './run-status';

export function StatusBar() {
  const reduced = useReducedMotion();
  return (
    <div
      className="sticky top-14 z-30 border-b border-landing-border bg-[#050505] font-mono text-[0.68rem] tracking-wide text-landing-muted"
      role="status"
      aria-label="aec-bench run status"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full bg-accent-amber ${
              reduced ? '' : 'animate-pulse'
            }`}
            style={{
              boxShadow: '0 0 6px rgba(232,168,56,0.6)',
            }}
          />
          <span className="text-accent-amber">LIVE</span>
        </span>
        <span>run_id <span className="text-landing-text">{runStatus.runId}</span></span>
        <span>tasks <span className="text-landing-text">{runStatus.tasks}</span></span>
        <span>models <span className="text-landing-text">{runStatus.models}</span></span>
        <span className="hidden sm:inline">
          disciplines <span className="text-landing-text">{runStatus.disciplines}</span>
        </span>
        <span className="ml-auto text-accent-teal">
          last_run {runStatus.lastRunRelative}
        </span>
      </div>
    </div>
  );
}
