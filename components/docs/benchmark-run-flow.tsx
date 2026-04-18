// ABOUTME: Responsive stepped-flow diagram for the architecture documentation page.
// ABOUTME: Uses HTML cards and SVG connectors so the two-row elbow layout is stable outside Mermaid.
const stages = [
  { label: 'Define Task', accent: 'teal' },
  { label: 'Resolve Instance', accent: 'teal' },
  { label: 'Stage Environment', accent: 'teal' },
  { label: 'Execute Agent', accent: 'amber' },
  { label: 'Score Output', accent: 'amber' },
  { label: 'Aggregate & Report', accent: 'amber' },
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
    <div className="flex justify-center py-1" aria-hidden="true">
      <svg viewBox="0 0 16 24" className="h-6 w-4 overflow-visible">
        <defs>
          <marker
            id="benchmark-run-flow-mobile-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#94a3b8" />
          </marker>
        </defs>
        <line
          x1="8"
          y1="0"
          x2="8"
          y2="22"
          stroke="#94a3b8"
          strokeWidth="1.5"
          markerEnd="url(#benchmark-run-flow-mobile-arrow)"
        />
      </svg>
    </div>
  );
}

export function BenchmarkRunFlow() {
  return (
    <div
      className="not-prose my-6"
      role="img"
      aria-label="Benchmark run flow from Define Task through Aggregate and Report"
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
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="benchmark-run-flow-arrow"
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#94a3b8" />
            </marker>
          </defs>

          <line
            x1="28.6"
            y1="4"
            x2="35.1"
            y2="4"
            stroke="#94a3b8"
            strokeWidth="0.3"
            strokeLinecap="round"
            markerEnd="url(#benchmark-run-flow-arrow)"
          />
          <line
            x1="64.6"
            y1="4"
            x2="71.1"
            y2="4"
            stroke="#94a3b8"
            strokeWidth="0.3"
            strokeLinecap="round"
            markerEnd="url(#benchmark-run-flow-arrow)"
          />
          <path
            d="M 86 8.8 V 13.4 H 14 V 17.4"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd="url(#benchmark-run-flow-arrow)"
          />
          <line
            x1="28.6"
            y1="22"
            x2="35.1"
            y2="22"
            stroke="#94a3b8"
            strokeWidth="0.3"
            strokeLinecap="round"
            markerEnd="url(#benchmark-run-flow-arrow)"
          />
          <line
            x1="64.6"
            y1="22"
            x2="71.1"
            y2="22"
            stroke="#94a3b8"
            strokeWidth="0.3"
            strokeLinecap="round"
            markerEnd="url(#benchmark-run-flow-arrow)"
          />
        </svg>

        <div className="absolute left-0 top-0 w-[28%]">
          <FlowCard label={stages[0].label} accent={stages[0].accent} />
        </div>
        <div className="absolute left-[36%] top-0 w-[28%]">
          <FlowCard label={stages[1].label} accent={stages[1].accent} />
        </div>
        <div className="absolute right-0 top-0 w-[28%]">
          <FlowCard label={stages[2].label} accent={stages[2].accent} />
        </div>
        <div className="absolute left-0 top-[64%] w-[28%]">
          <FlowCard label={stages[3].label} accent={stages[3].accent} />
        </div>
        <div className="absolute left-[36%] top-[64%] w-[28%]">
          <FlowCard label={stages[4].label} accent={stages[4].accent} />
        </div>
        <div className="absolute right-0 top-[64%] w-[28%]">
          <FlowCard label={stages[5].label} accent={stages[5].accent} />
        </div>
      </div>
    </div>
  );
}