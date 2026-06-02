// ABOUTME: Landing "how it works" — six-stage flow diagram plus sample CLI readout.
// ABOUTME: Teal borders for setup phases (01-03), amber for execution phases (04-06).
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { FadeUp } from './motion-primitives';

interface Stage {
  n: string;
  title: string;
  desc: string;
  phase: 1 | 2;
}

const stages: Stage[] = [
  { n: '01', title: 'Define task',      desc: 'Template + params',        phase: 1 },
  { n: '02', title: 'Resolve instance', desc: 'Jinja render',             phase: 1 },
  { n: '03', title: 'Stage env',        desc: 'Sandbox + tools',          phase: 1 },
  { n: '04', title: 'Execute agent',    desc: 'Harness drives the model', phase: 2 },
  { n: '05', title: 'Score output',     desc: 'Automated verifier',       phase: 2 },
  { n: '06', title: 'Aggregate',        desc: 'Ledger + report',          phase: 2 },
];

export function HowItWorks() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={5} figName="METHOD" />
      <FadeUp>
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <SectionAnno number={5} name="How It Works" />
        <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
          Define → run → score
        </h2>
        <p className="mb-8 mt-1 font-mono text-xs text-landing-muted">
          six-stage pipeline · same flow every run
        </p>

        {/* Flow diagram */}
        <div className="rounded-lg border border-landing-border bg-[#050505] p-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {stages.map((s) => {
              const phaseBorder = s.phase === 1 ? 'border-accent-teal/40' : 'border-accent-amber/40';
              const phaseText   = s.phase === 1 ? 'text-accent-teal'      : 'text-accent-amber';
              return (
                <div
                  key={s.n}
                  className={`rounded border ${phaseBorder} bg-landing-bg/80 px-2 py-3`}
                >
                  <div className={`font-mono text-[0.55rem] tracking-widest ${phaseText}`}>
                    {s.n}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-landing-text">{s.title}</div>
                  <div className="mt-1 text-[0.65rem] leading-snug text-landing-muted">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CLI readout */}
        <pre className="mt-4 overflow-x-auto rounded-lg border border-landing-border bg-[#050505] p-3 font-mono text-xs leading-relaxed text-[#c7c7c7]">
<span className="text-accent-teal">aec-bench ~ $</span> uv run aec-bench run-local \{'\n'}
{'  '}tasks/generated/electrical/cable-sizing/voltage-drop/sydney-suburban-residential-lighting-00 \{'\n'}
{'  '}<span className="text-accent-amber">--model</span> claude-sonnet-4-20250514 <span className="text-accent-amber">--harness</span> direct{'\n'}
<span className="text-[#666]">› staging temporary workspace … </span><span className="text-[#6fd08a]">ok</span>{'\n'}
<span className="text-[#666]">› executing harness direct</span>{'\n'}
<span className="text-[#666]">› verifier complete · reward </span><span className="text-accent-amber">0.83</span><span className="text-[#666]"> · imported as experiment </span><span className="text-accent-amber">local</span>{'\n'}
<span className="text-accent-teal">aec-bench ~ $</span> uv run aec-bench evaluate <span className="text-accent-amber">--experiment</span> local <span className="text-accent-amber">--report</span> report.html{'\n'}
<span className="text-[#666]">› </span><span className="text-[#6fd08a]">done.</span><span className="text-[#666]"> report written to </span><span className="text-accent-amber">report.html</span>
        </pre>

        <div className="mt-4 font-mono text-sm">
          <Link
            href="/docs/reference/cli"
            className="inline-flex items-center gap-2 text-accent-amber transition-opacity hover:opacity-80"
          >
            <span className="text-accent-teal">→</span>
            read the CLI guide
          </Link>
        </div>
      </div>
      </FadeUp>
    </BlueprintBg>
  );
}
