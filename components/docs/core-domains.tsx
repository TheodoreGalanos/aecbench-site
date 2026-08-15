// ABOUTME: Ownership diagram for the two aec-bench execution families.
// ABOUTME: Shows shared authoring, evaluation, evidence, and presentation boundaries.
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
      aria-label="AEC-Bench ownership flow from task sources through artefact tasks or Interactive Worlds to evaluation, evidence, and presentation"
      data-testid="core-domains"
    >
      <div className="flex flex-col items-center gap-2 lg:hidden">
        <DomainNode label="Task sources & world profiles" accent="amber" />
        <DomainNode label="Authoring & validation" accent="teal" />
        <div className="grid w-full max-w-sm grid-cols-2 gap-2">
          <DomainNode label="Artefact & workspace tasks" accent="teal" />
          <DomainNode label="Interactive Worlds" accent="teal" />
        </div>
        <DomainNode label="Evaluation & task verification" accent="teal" />
        <DomainNode label="Trial & evidence records" accent="muted" />
        <DomainNode label="CLI, TUI, web & reports" accent="muted" />
      </div>

      <div className="relative mx-auto hidden h-[30rem] max-w-2xl lg:block" data-testid="core-domains-desktop">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker id="cd-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#94a3b8" />
            </marker>
          </defs>
          <line x1="50" y1="10" x2="50" y2="19" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          <line x1="44" y1="30" x2="25" y2="39" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          <line x1="56" y1="30" x2="75" y2="39" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          <line x1="25" y1="50" x2="44" y2="61" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          <line x1="75" y1="50" x2="56" y2="61" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          <line x1="50" y1="72" x2="50" y2="74" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
          <line x1="50" y1="85" x2="50" y2="87" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#cd-arrow)" />
        </svg>

        <div className="absolute left-1/2 top-0 w-[38%] -translate-x-1/2">
          <DomainNode label="Task sources & world profiles" accent="amber" />
        </div>
        <div className="absolute left-1/2 top-[20%] w-[34%] -translate-x-1/2">
          <DomainNode label="Authoring & validation" accent="teal" />
        </div>
        <div className="absolute left-[2%] top-[40%] w-[40%]">
          <DomainNode label="Artefact & workspace tasks" accent="teal" />
        </div>
        <div className="absolute right-[2%] top-[40%] w-[40%]">
          <DomainNode label="Interactive Worlds" accent="teal" />
        </div>
        <div className="absolute left-1/2 top-[62%] w-[34%] -translate-x-1/2">
          <DomainNode label="Evaluation & task verification" accent="teal" />
        </div>
        <div className="absolute left-1/2 top-[75%] w-[34%] -translate-x-1/2">
          <DomainNode label="Trial & evidence records" accent="muted" />
        </div>
        <div className="absolute left-1/2 top-[88%] w-[34%] -translate-x-1/2">
          <DomainNode label="CLI, TUI, web & reports" accent="muted" />
        </div>
      </div>
    </div>
  );
}
