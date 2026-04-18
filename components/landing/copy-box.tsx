// ABOUTME: Reusable terminal-style command box with copy-to-clipboard button.
// ABOUTME: Shows "copied" for 1.5s after a successful copy, then reverts.
'use client';

import { useState } from 'react';

interface CopyBoxProps {
  command: string;
  prompt?: string;
}

export function CopyBox({ command, prompt = '$' }: CopyBoxProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore — if clipboard API unavailable, just fail silently */
    }
  }

  return (
    <div className="mx-auto flex max-w-xl items-stretch overflow-hidden rounded border border-landing-border bg-[#050505]">
      <div className="flex flex-1 items-center gap-2 px-4 py-3 text-left font-mono text-sm text-landing-text">
        <span aria-hidden="true" className="text-accent-teal">{prompt}</span>
        <span>{command}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : `Copy command ${command}`}
        className="border-l border-landing-border bg-landing-card px-4 font-mono text-xs uppercase tracking-wider text-landing-muted transition-colors hover:text-accent-amber"
      >
        {copied ? 'copied' : 'copy'}
      </button>
      {/* Politely announces state change to screen readers. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </div>
  );
}
