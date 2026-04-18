// components/landing/status-bar.tsx
// ABOUTME: Persistent mono status bar with honest timestamps and a PREVIEW mode for mock data.
// ABOUTME: Pulsing dot is disabled under prefers-reduced-motion.
'use client';

import { useReducedMotion } from 'framer-motion';
import { runStatus } from './run-status';
import { isMock } from '@/lib/aec-bench/read';

function relativeFromIso(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const secs = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function StatusBar() {
  const reduced = useReducedMotion();
  const mock = isMock();
  const label = mock ? 'PREVIEW' : 'LIVE';
  const dotClass = `inline-block h-1.5 w-1.5 rounded-full bg-accent-amber ${
    reduced ? '' : 'animate-pulse'
  }`;
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
            className={dotClass}
            style={{ boxShadow: '0 0 6px rgba(232,168,56,0.6)' }}
          />
          <span className="text-accent-amber">{label}</span>
        </span>
        <span>dataset <span className="text-landing-text">{runStatus.datasetVersion}</span></span>
        <span>tasks <span className="text-landing-text">{runStatus.tasks}</span></span>
        <span>models <span className="text-landing-text">{runStatus.models}</span></span>
        <span className="hidden sm:inline">
          disciplines <span className="text-landing-text">{runStatus.disciplines}</span>
        </span>
        <span className="ml-auto text-accent-teal">
          last submission {relativeFromIso(runStatus.lastSubmissionIso)} · built{' '}
          {relativeFromIso(runStatus.generatedAtIso)}
        </span>
      </div>
    </div>
  );
}
