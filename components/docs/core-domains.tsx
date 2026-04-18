// ABOUTME: Layered dependency diagram showing the seven aec-bench domains.
// ABOUTME: Contracts at top, evaluation domains at bottom, with connecting arrows.
'use client';

type Accent = 'amber' | 'teal' | 'muted';

const accentClasses: Record<Accent, string> = {
  amber: 'border-[#e8a838]/80',
  teal: 'border-[#38b2ac]/80',
  muted: 'border-[var(--color-fd-border)]',
};

function DomainNode({ label, accent }: Readonly<{ label: string; accent: Accent }>) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border bg-[var(--color-fd-card)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-fd-foreground)] shadow-sm ${accentClasses[accent]}`}
    >
      {label}
    </div>
  );
}

export function CoreDomains() {
  return (
    <div
      className="not-prose my-8"
      role="img"
      aria-label="Core domain dependency layers from Contracts down to Communication and Feedback"
      data-testid="core-domains"
    >
      {/* Mobile: simple stacked list */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <DomainNode label="Contracts" accent="amber" />
        <div className="flex gap-2">
          <DomainNode label="Tasks" accent="teal" />
          <DomainNode label="Adapters" accent="teal" />
        </div>
        <div className="flex gap-2">
          <DomainNode label="Generation" accent="teal" />
          <DomainNode label="Harness" accent="teal" />
        </div>
        <DomainNode label="Evaluation" accent="teal" />
        <div className="flex gap-2">
          <DomainNode label="Communication" accent="muted" />
          <DomainNode label="Feedback" accent="muted" />
        </div>
      </div>

      {/* Desktop: layered diagram with connectors */}
      <div className="relative mx-auto hidden h-72 max-w-xl md:block">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 56"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker id="cd-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#94a3b8" />
            </marker>
          </defs>
          {/* Contracts → Tasks */}
          <line x1="38" y1="7" x2="28" y2="14" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          {/* Contracts → Adapters */}
          <line x1="62" y1="7" x2="72" y2="14" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          {/* Tasks → Generation */}
          <line x1="20" y1="20" x2="20" y2="26" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          {/* Tasks → Harness */}
          <line x1="32" y1="20" x2="55" y2="26" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          {/* Adapters → Harness */}
          <line x1="72" y1="20" x2="65" y2="26" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          {/* Harness → Evaluation */}
          <line x1="57" y1="33" x2="50" y2="38" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          {/* Evaluation → Communication */}
          <line x1="42" y1="44" x2="28" y2="48" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          {/* Evaluation → Feedback */}
          <line x1="58" y1="44" x2="72" y2="48" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
        </svg>

        {/* Layer 1: Contracts */}
        <div className="absolute left-1/2 top-0 w-[30%] -translate-x-1/2">
          <DomainNode label="Contracts" accent="amber" />
        </div>

        {/* Layer 2: Tasks + Adapters */}
        <div className="absolute left-[5%] top-[24%] w-[30%]">
          <DomainNode label="Tasks" accent="teal" />
        </div>
        <div className="absolute right-[5%] top-[24%] w-[30%]">
          <DomainNode label="Adapters" accent="teal" />
        </div>

        {/* Layer 3: Generation + Harness */}
        <div className="absolute left-[5%] top-[48%] w-[30%]">
          <DomainNode label="Generation" accent="teal" />
        </div>
        <div className="absolute right-[18%] top-[48%] w-[30%]">
          <DomainNode label="Harness" accent="teal" />
        </div>

        {/* Layer 4: Evaluation */}
        <div className="absolute left-1/2 top-[68%] w-[30%] -translate-x-1/2">
          <DomainNode label="Evaluation" accent="teal" />
        </div>

        {/* Layer 5: Communication + Feedback */}
        <div className="absolute left-[5%] top-[88%] w-[30%]">
          <DomainNode label="Communication" accent="muted" />
        </div>
        <div className="absolute right-[5%] top-[88%] w-[30%]">
          <DomainNode label="Feedback" accent="muted" />
        </div>
      </div>
    </div>
  );
}
