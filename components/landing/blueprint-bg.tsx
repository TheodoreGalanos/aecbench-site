// ABOUTME: Section wrapper that paints the teal blueprint grid behind its children.
// ABOUTME: Uses CSS background-image + radial mask so the grid fades towards section edges.
import type { ReactNode } from 'react';

interface BlueprintBgProps {
  children: ReactNode;
  className?: string;
}

export function BlueprintBg({ children, className = '' }: BlueprintBgProps) {
  return (
    <section className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-bg-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-bg-grid) 1px, transparent 1px),
            linear-gradient(var(--color-bg-grid-major) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-bg-grid-major) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 24px 24px, 120px 120px, 120px 120px',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%)',
          maskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%)',
        }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}
