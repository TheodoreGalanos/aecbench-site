// ABOUTME: Compact leaderboard preview styled as a bench run terminal output.
// ABOUTME: Shows rank, model, per-discipline bars, reward, delta, tokens, cost per task.
import Link from 'next/link';
import { previewModels, type PreviewModel } from './data';
import { runStatus } from './run-status';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';

function Bars({ model, topTier }: { model: PreviewModel; topTier: boolean }) {
  const d = model.disciplines;
  const values = [d.civil, d.electrical, d.ground, d.mechanical, d.structural];
  const colour = topTier ? 'bg-accent-amber' : 'bg-accent-teal';
  return (
    <div
      className="flex h-5 items-end gap-[3px]"
      aria-label={`discipline breakdown: civil ${Math.round(d.civil * 100)}%, electrical ${Math.round(d.electrical * 100)}%, ground ${Math.round(d.ground * 100)}%, mechanical ${Math.round(d.mechanical * 100)}%, structural ${Math.round(d.structural * 100)}%`}
    >
      {values.map((v, i) => (
        <div key={i} className="relative min-w-[5px] flex-1 rounded-sm bg-[#1a1a1a]">
          <div
            className={`absolute inset-x-0 bottom-0 rounded-sm ${colour}`}
            style={{ height: `${Math.round(v * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  const sign = up ? '+' : '−';
  const abs = Math.abs(value).toFixed(2);
  return (
    <span className={up ? 'text-[#6fd08a]' : 'text-[#e07b7b]'}>
      {sign}
      {abs}
    </span>
  );
}

export function LeaderboardPreview() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={2} figName="STANDINGS" />
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <SectionAnno number={2} name="Current Standings" />
        <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
          Current standings
        </h2>
        <p className="mb-6 mt-1 font-mono text-xs text-landing-muted">
          dataset <span className="text-accent-amber">{runStatus.datasetVersion}</span> · run{' '}
          <span className="text-accent-amber">{runStatus.runId}</span> · {runStatus.tasks} tasks ·{' '}
          {runStatus.disciplines} disciplines · last eval {runStatus.lastRunRelative}
        </p>

        <div className="overflow-hidden rounded-lg border border-landing-border bg-[#050505]">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-landing-border bg-landing-bg px-3 py-2 font-mono text-[0.7rem] text-[#666]">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-landing-border" />
              <span className="h-2 w-2 rounded-full bg-landing-border" />
              <span className="h-2 w-2 rounded-full bg-landing-border" />
            </div>
            <span className="ml-1">~/aec-bench / leaderboard.tsv</span>
            <span className="ml-auto text-[0.65rem]">{runStatus.models} rows · streaming</span>
          </div>

          {/* Cmdline */}
          <div className="border-b border-landing-border px-3 py-2 font-mono text-xs text-[#c7c7c7]">
            <span className="text-accent-teal">aec-bench ~ $</span>{' '}
            bench leaderboard <span className="text-accent-amber">--top</span> 4{' '}
            <span className="text-accent-amber">--by</span> reward{' '}
            <span className="text-[#666]">› stream ok</span>
          </div>

          {/* Data grid */}
          <div className="font-mono text-xs">
            <div className="hidden md:grid grid-cols-[44px_1.6fr_1fr_70px_1fr_90px_70px] border-b border-landing-border text-[0.62rem] uppercase tracking-wider text-[#666]">
              <div className="px-3 py-2">#</div>
              <div className="px-3 py-2">Model</div>
              <div className="px-3 py-2">Per-discipline</div>
              <div className="px-3 py-2 text-right">Reward</div>
              <div className="px-3 py-2">Δ last run</div>
              <div className="px-3 py-2 text-right">Tokens</div>
              <div className="px-3 py-2 text-right">Cost</div>
            </div>

            {previewModels.map((m) => {
              const topTier = m.rank <= 3;
              return (
                <div
                  key={m.rank}
                  className="grid grid-cols-[36px_1fr_60px_70px] md:grid-cols-[44px_1.6fr_1fr_70px_1fr_90px_70px] items-center border-b border-[#141414] last:border-b-0"
                >
                  <div className="px-3 py-3 font-bold text-accent-amber">
                    <span className="text-[#555]">#</span>
                    {String(m.rank).padStart(2, '0')}
                  </div>
                  <div className="px-3 py-3">
                    <div className="font-sans font-semibold text-landing-text">{m.model}</div>
                    <div className="text-[0.7rem] text-[#888]">{m.provider}</div>
                  </div>
                  <div className="hidden px-3 py-3 md:block">
                    <Bars model={m} topTier={topTier} />
                  </div>
                  <div className="px-3 py-3 text-right font-bold text-accent-amber">
                    {m.overallScore.toFixed(2)}
                  </div>
                  <div className="hidden px-3 py-3 md:block">
                    <Delta value={m.deltaLastRun} />
                  </div>
                  <div className="hidden px-3 py-3 text-right text-[0.72rem] text-[#888] md:block">
                    {m.tokensMillions.toFixed(2)}M
                  </div>
                  <div className="px-3 py-3 text-right text-[0.72rem] text-[#888]">
                    ${m.costUsd.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-end gap-4 border-t border-landing-border px-3 py-2 font-mono text-[0.62rem] uppercase tracking-wider text-[#666]">
            <span><span className="text-[#c7c7c7]">C</span> civil</span>
            <span><span className="text-[#c7c7c7]">E</span> electrical</span>
            <span><span className="text-[#c7c7c7]">G</span> ground</span>
            <span><span className="text-[#c7c7c7]">M</span> mechanical</span>
            <span><span className="text-[#c7c7c7]">S</span> structural</span>
          </div>
        </div>

        <div className="mt-4 font-mono text-sm">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-accent-amber transition-opacity hover:opacity-80"
          >
            <span className="text-accent-teal">→</span>
            bench leaderboard --full ↗
          </Link>
          <span className="ml-3 text-[#444]">·</span>
          <span className="ml-3 text-[#888]">{runStatus.models - 4} more models</span>
        </div>
      </div>
    </BlueprintBg>
  );
}
