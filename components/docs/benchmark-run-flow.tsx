// ABOUTME: Responsive flow diagram for the persisted benchmark-run lifecycle.
// ABOUTME: Shows how requested state becomes an exact plan, trial evidence, and accounting.
const stages = [
  { label: 'Define Task', accent: 'teal' },
  { label: 'Resolve Run', accent: 'teal' },
  { label: 'Persist Plan', accent: 'teal' },
  { label: 'Create Work Items', accent: 'amber' },
  { label: 'Lease and Run Attempts', accent: 'amber' },
  { label: 'Publish Trial Records', accent: 'amber' },
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

      <div className="hidden items-center gap-2 md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <FlowCard {...stages[0]} />
        <span className="text-xs text-slate-400" aria-hidden="true">→</span>
        <FlowCard {...stages[1]} />
        <span className="text-xs text-slate-400" aria-hidden="true">→</span>
        <FlowCard {...stages[2]} />
        <span className="text-xs text-slate-400" aria-hidden="true">→</span>
        <FlowCard {...stages[3]} />
        <span className="col-span-full py-1 text-center text-slate-400" aria-hidden="true">↓</span>
        <FlowCard {...stages[4]} />
        <span className="text-xs text-slate-400" aria-hidden="true">→</span>
        <FlowCard {...stages[5]} />
        <span className="text-xs text-slate-400" aria-hidden="true">→</span>
        <FlowCard {...stages[6]} />
      </div>
    </div>
  );
}
