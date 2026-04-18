// ABOUTME: Landing section 03 — reward × cost teaser with compact list + static mini-scatter.
// ABOUTME: Static SVG chart (no chart library). Deep-links to /leaderboard for the full version.
import Link from 'next/link';
import { previewModels, type Provider } from './data';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { FadeUp } from './motion-primitives';

const providerColour: Record<Provider, string> = {
  anthropic: 'var(--color-provider-anthropic)',
  openai: 'var(--color-provider-openai)',
  google: 'var(--color-provider-google)',
  meta: 'var(--color-provider-meta)',
  other: 'var(--color-provider-other)',
};

function MiniScatter() {
  return (
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-label="reward vs cost scatter — top 4 models with Pareto frontier"
      className="h-[150px] w-full"
    >
      {/* axes */}
      <line x1="28" y1="10" x2="28" y2="120" stroke="#2a2a2a" strokeWidth="1" />
      <line x1="28" y1="120" x2="195" y2="120" stroke="#2a2a2a" strokeWidth="1" />

      {/* grid */}
      {[40, 70, 100].map((y) => (
        <line key={y} x1="28" y1={y} x2="195" y2={y} stroke="rgba(56,178,172,0.08)" strokeWidth="1" />
      ))}
      {[70, 115, 160].map((x) => (
        <line key={x} x1={x} y1="10" x2={x} y2="120" stroke="rgba(56,178,172,0.08)" strokeWidth="1" />
      ))}

      {/* Pareto frontier */}
      <path
        d="M 45 85 L 85 58 L 130 40 L 180 32"
        stroke="var(--color-accent-amber)"
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
        opacity="0.7"
      />

      {/* points */}
      {previewModels.map((m) => {
        const x = 45 + m.costPerTask * 3500;
        const y = 120 - m.overallScore * 140;
        return (
          <g key={m.model}>
            <title>{`${m.model} — reward ${m.overallScore.toFixed(2)}, $${m.costPerTask.toFixed(3)}/task`}</title>
            <circle cx={x} cy={y} r="4.5" fill={providerColour[m.provider]} stroke="#0a0a0a" strokeWidth="1.5" />
          </g>
        );
      })}

      {/* axis labels */}
      <text x="28" y="135" fontSize="6" fontFamily="var(--font-mono)" fill="#666">
        cost / task →
      </text>
      <text
        x="10"
        y="70"
        fontSize="6"
        fontFamily="var(--font-mono)"
        fill="#666"
        transform="rotate(-90 10 70)"
      >
        ↑ reward
      </text>
    </svg>
  );
}

export function RewardCostTeaser() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={3} figName="REWARD × COST" />
      <FadeUp>
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <SectionAnno number={3} name="Reward × Cost" />
        <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
          Reward × Cost
        </h2>
        <p className="mb-6 mt-1 font-mono text-xs text-landing-muted">
          the only benchmark that pairs performance with per-task cost
        </p>

        <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
          {/* Compact list */}
          <div className="relative rounded-lg border border-landing-border bg-[#050505] p-4">
            <div className="mb-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-accent-teal">
              <span>── TOP_4 ──</span>
              <Link href="/leaderboard" className="text-accent-amber text-[0.65rem]">full table ↗</Link>
            </div>
            <ul className="divide-y divide-[#141414] font-mono text-xs">
              {previewModels.map((m) => (
                <li key={m.rank} className="flex gap-2 py-1.5">
                  <span className="w-8 text-accent-amber">#{String(m.rank).padStart(2, '0')}</span>
                  <span className="flex-1 text-landing-text">{m.model}</span>
                  <span className="text-accent-amber">{m.overallScore.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mini scatter */}
          <div className="relative rounded-lg border border-landing-border bg-[#050505] p-4">
            <div className="mb-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-accent-teal">
              <span>── REWARD × COST ──</span>
              <Link href="/leaderboard" className="text-accent-amber text-[0.65rem]">explore ↗</Link>
            </div>
            <MiniScatter />
          </div>
        </div>
      </div>
      </FadeUp>
    </BlueprintBg>
  );
}
