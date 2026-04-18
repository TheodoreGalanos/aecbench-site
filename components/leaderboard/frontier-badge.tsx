// ABOUTME: Small [frontier] pill used on the scatter tooltip and expandable rows.
// ABOUTME: Amber outline + small caps JetBrains Mono styling.
import { clsx } from '@/lib/clsx';

export interface FrontierBadgeProps {
  className?: string;
}

export function FrontierBadge({ className }: FrontierBadgeProps) {
  return (
    <span
      aria-label="on the Pareto frontier"
      className={clsx(
        'inline-flex items-center rounded-sm border border-accent-amber px-1.5 py-0.5',
        'font-mono text-[0.62rem] uppercase tracking-wider text-accent-amber',
        className,
      )}
    >
      [frontier]
    </span>
  );
}
