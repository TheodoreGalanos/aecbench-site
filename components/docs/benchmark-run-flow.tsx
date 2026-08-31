// ABOUTME: Responsive flow diagram for the persisted benchmark-run lifecycle.
// ABOUTME: Shows how requested state becomes an exact plan, trial evidence, and accounting.
const stages = [
  { label: 'Define Task', accent: 'teal' },
  { label: 'Resolve Run', accent: 'teal' },
  { label: 'Persist Plan', accent: 'teal' },
  { label: 'Run Attempt(s)', accent: 'amber' },
  { label: 'Verify Records', accent: 'amber' },
  { label: 'Reconcile Run', accent: 'amber' },
] as const;

type StageAccent = (typeof stages)[number]['accent'];

const accentClasses: Record<StageAccent, string> = {
  teal: 'border-[#38b2ac]/80',
  amber: 'border-[#e8a838]/80',
};

function FlowCard({ label, accent }: Readonly<{ label: string; accent: StageAccent }>) {
  return (
    <div
      className={[
        'flex min-h-20 items-center justify-center rounded-xl border bg-[var(--color-fd-card)] px-4 py-3 text-center shadow-sm',
        'text-sm font-medium leading-snug text-[var(--color-fd-foreground)] sm:text-base',
        accentClasses[accent],
      ].join(' ')}
    >
      {label}
    </div>
  );
}

function MobileConnector() {
  return (
    <div className="flex justify-center py-1 text-lg text-slate-400" aria-hidden="true">
      ↓
    </div>
  );
}

export function BenchmarkRunFlow() {
  return (
    <div
      className="not-prose my-6"
      role="img"
      aria-label="Benchmark run flow from define task through reconcile run"
      data-testid="benchmark-run-flow"
    >
      <div className="space-y-0 md:hidden">
        {stages.map((stage, index) => (
          <div key={stage.label}>
            <FlowCard label={stage.label} accent={stage.accent} />
            {index < stages.length - 1 ? <MobileConnector /> : null}
          </div>
        ))}
      </div>

      <div className="relative hidden h-[18rem] w-full md:block">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="benchmark-run-flow-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#94a3b8" />
            </marker>
          </defs>
          <line x1="28.6" y1="4" x2="35.1" y2="4" stroke="#94a3b8" strokeWidth="0.3" markerEnd="url(#benchmark-run-flow-arrow)" />
          <line x1="64.6" y1="4" x2="71.1" y2="4" stroke="#94a3b8" strokeWidth="0.3" markerEnd="url(#benchmark-run-flow-arrow)" />
          <path d="M 86 8.8 V 13.4 H 14 V 17.4" fill="none" stroke="#94a3b8" strokeWidth="0.3" markerEnd="url(#benchmark-run-flow-arrow)" />
          <line x1="28.6" y1="22" x2="35.1" y2="22" stroke="#94a3b8" strokeWidth="0.3" markerEnd="url(#benchmark-run-flow-arrow)" />
          <line x1="64.6" y1="22" x2="71.1" y2="22" stroke="#94a3b8" strokeWidth="0.3" markerEnd="url(#benchmark-run-flow-arrow)" />
        </svg>

        <div className="absolute left-0 top-0 w-[28%]"><FlowCard {...stages[0]} /></div>
        <div className="absolute left-[36%] top-0 w-[28%]"><FlowCard {...stages[1]} /></div>
        <div className="absolute right-0 top-0 w-[28%]"><FlowCard {...stages[2]} /></div>
        <div className="absolute left-0 top-[64%] w-[28%]"><FlowCard {...stages[3]} /></div>
        <div className="absolute left-[36%] top-[64%] w-[28%]"><FlowCard {...stages[4]} /></div>
        <div className="absolute right-0 top-[64%] w-[28%]"><FlowCard {...stages[5]} /></div>
      </div>
    </div>
  );
}
