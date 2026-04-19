// ABOUTME: Provider colour key + harness shape key for the scatter chart.
// ABOUTME: Pure presentational — no state, no props beyond optional className.
import { PROVIDERS, type Provider } from '@/lib/aec-bench/contracts';
import { KNOWN_HARNESSES, harnessGlyph, type GlyphShape } from '@/lib/aec-bench/harness-glyph';
import { clsx } from '@/lib/clsx';

const PROVIDER_COLOURS: Record<Provider, string> = {
  anthropic: '#b5651d',
  openai: '#38b2ac',
  google: '#e8a838',
  meta: '#9333ea',
  other: '#888',
};

function GlyphPreview({ shape }: { shape: GlyphShape }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="inline-block">
      {shape === 'circle' && <circle cx="5" cy="5" r="3.5" fill="#c7c7c7" />}
      {shape === 'square' && (
        <rect x="1.5" y="1.5" width="7" height="7" fill="#c7c7c7" transform="rotate(45 5 5)" />
      )}
      {shape === 'triangle' && <polygon points="5,1.5 8.5,8.5 1.5,8.5" fill="#c7c7c7" />}
      {shape === 'ring' && (
        <circle cx="5" cy="5" r="3" fill="none" stroke="#c7c7c7" strokeWidth="1.5" />
      )}
      {shape === 'diamond' && <polygon points="5,1 9,5 5,9 1,5" fill="#c7c7c7" />}
    </svg>
  );
}

export interface LegendProps {
  className?: string;
}

export function Legend({ className }: LegendProps) {
  return (
    <ul
      role="list"
      aria-label="chart legend"
      className={clsx(
        'flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.62rem] uppercase tracking-wider text-[#888]',
        className,
      )}
    >
      {PROVIDERS.map((p) => (
        <li key={p} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: PROVIDER_COLOURS[p] }}
          />
          {p}
        </li>
      ))}
      <li aria-hidden="true" className="text-[#444]">
        ·
      </li>
      {KNOWN_HARNESSES.map((h) => (
        <li key={h} className="flex items-center gap-1.5">
          <GlyphPreview shape={harnessGlyph(h)} />
          {h}
        </li>
      ))}
    </ul>
  );
}
