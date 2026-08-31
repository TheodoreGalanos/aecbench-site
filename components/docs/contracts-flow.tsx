// ABOUTME: Visual diagram showing the persisted run contracts and their sequence.
// ABOUTME: Connects the requested condition, exact plan, trial evidence, and accounting result.
'use client';

const stages = [
  { label: 'ResolvedRunSpec', detail: 'requested condition', accent: 'teal' },
  { label: 'RunPlan', detail: 'exact trial set', accent: 'teal' },
  { label: 'TrialWorkItem', detail: 'schedulable trial', accent: 'amber' },
  { label: 'TrialRecord values', detail: 'published results', accent: 'amber' },
  { label: 'RunAccounting', detail: 'membership & status', accent: 'amber' },
] as const;

type StageAccent = (typeof stages)[number]['accent'];

const accentClasses: Record<StageAccent, string> = {
  teal: 'border-[#38b2ac]/80',
  amber: 'border-[#e8a838]/80',
};

function ContractNode({
  label,
  detail,
  accent,
}: Readonly<{ label: string; detail: string; accent: StageAccent }>) {
  return (
    <div
      className={`flex min-h-20 flex-col items-center justify-center rounded-xl border bg-[var(--color-fd-card)] px-4 py-3 text-center shadow-sm ${accentClasses[accent]}`}
    >
      <span className="text-sm font-semibold leading-snug text-[var(--color-fd-foreground)]">{label}</span>
      <span className="mt-1 text-xs text-[var(--color-fd-muted-foreground)]">{detail}</span>
    </div>
  );
}

function Connector({ label }: Readonly<{ label: string }>) {
  const markerId = `contracts-flow-${label}`;
  return (
    <div className="flex flex-col items-center gap-1 py-2 text-xs italic text-[var(--color-fd-muted-foreground)]">
      <span>{label}</span>
      <svg viewBox="0 0 16 24" className="h-6 w-4 overflow-visible" aria-hidden="true">
        <defs>
          <marker id={markerId} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#94a3b8" />
          </marker>
        </defs>
        <line x1="8" y1="0" x2="8" y2="22" stroke="#94a3b8" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
      </svg>
    </div>
  );
}

export function ContractsFlow() {
  return (
    <div
      className="not-prose my-8"
      role="img"
      aria-label="Run contract flow from ResolvedRunSpec through RunPlan, TrialWorkItem, TrialRecord values, and RunAccounting"
      data-testid="contracts-flow"
    >
      <div className="md:hidden">
        <ContractNode {...stages[0]} />
        <Connector label="plan" />
        <ContractNode {...stages[1]} />
        <Connector label="create" />
        <ContractNode {...stages[2]} />
        <Connector label="publish" />
        <ContractNode {...stages[3]} />
        <Connector label="reconcile" />
        <ContractNode {...stages[4]} />
      </div>

      <div className="hidden items-center gap-3 md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
        <ContractNode {...stages[0]} />
        <span className="text-xs italic text-[var(--color-fd-muted-foreground)]">plan →</span>
        <ContractNode {...stages[1]} />
        <span className="text-xs italic text-[var(--color-fd-muted-foreground)]">create →</span>
        <ContractNode {...stages[2]} />
        <span className="text-xs italic text-[var(--color-fd-muted-foreground)]">publish →</span>
        <ContractNode {...stages[3]} />
        <span className="text-xs italic text-[var(--color-fd-muted-foreground)]">reconcile →</span>
        <ContractNode {...stages[4]} />
      </div>
    </div>
  );
}
