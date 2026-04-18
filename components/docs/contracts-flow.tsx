// ABOUTME: Visual diagram showing how the four core contracts connect.
// ABOUTME: Staircase layout: TaskDefinition → AgentOutput → EvaluationResult → TrialRecord with action labels.
'use client';

interface ContractNodeProps {
  label: string;
  color: string;
}

function ContractNode({ label, color }: Readonly<ContractNodeProps>) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border bg-[var(--color-fd-card)] px-4 py-3 text-center text-sm font-semibold leading-snug text-[var(--color-fd-foreground)] shadow-sm ${color}`}
    >
      {label}
    </div>
  );
}

function ActionLabel({ label }: Readonly<{ label: string }>) {
  return (
    <span className="text-xs text-[var(--color-fd-muted-foreground)] italic">{label}</span>
  );
}

export function ContractsFlow() {
  return (
    <div
      className="not-prose my-8"
      role="img"
      aria-label="Contract data flow from TaskDefinition through AgentOutput and EvaluationResult to TrialRecord"
      data-testid="contracts-flow"
    >
      {/* Mobile: vertical */}
      <div className="flex flex-col items-center gap-1 md:hidden">
        <ContractNode label="TaskDefinition" color="border-[#38b2ac]/80" />
        <svg viewBox="0 0 16 20" className="h-5 w-4" aria-hidden="true">
          <defs><marker id="cf-m-arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 z" fill="#94a3b8" /></marker></defs>
          <line x1="8" y1="0" x2="8" y2="18" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cf-m-arr)" />
        </svg>
        <ActionLabel label="sent to agent" />
        <svg viewBox="0 0 16 20" className="h-5 w-4" aria-hidden="true">
          <line x1="8" y1="0" x2="8" y2="18" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cf-m-arr)" />
        </svg>
        <ContractNode label="AgentOutput" color="border-[#38b2ac]/80" />
        <svg viewBox="0 0 16 20" className="h-5 w-4" aria-hidden="true">
          <line x1="8" y1="0" x2="8" y2="18" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cf-m-arr)" />
        </svg>
        <ActionLabel label="scored by verifier" />
        <svg viewBox="0 0 16 20" className="h-5 w-4" aria-hidden="true">
          <line x1="8" y1="0" x2="8" y2="18" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cf-m-arr)" />
        </svg>
        <ContractNode label="EvaluationResult" color="border-[#e8a838]/80" />
        <svg viewBox="0 0 16 20" className="h-5 w-4" aria-hidden="true">
          <line x1="8" y1="0" x2="8" y2="18" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cf-m-arr)" />
        </svg>
        <ActionLabel label="recorded in ledger" />
        <svg viewBox="0 0 16 20" className="h-5 w-4" aria-hidden="true">
          <line x1="8" y1="0" x2="8" y2="18" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cf-m-arr)" />
        </svg>
        <ContractNode label="TrialRecord" color="border-[#e8a838]/80" />
      </div>

      {/* Desktop: 2x2 grid with elbow connectors and inline labels */}
      <div className="relative hidden h-56 md:block">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 44"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <marker id="cf-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#94a3b8" />
            </marker>
          </defs>
          {/* TaskDefinition → AgentOutput (horizontal, centered between boxes) */}
          <line x1="40" y1="5" x2="60" y2="5" stroke="#94a3b8" strokeWidth="0.4" markerEnd="url(#cf-arrow)" />
          <text x="49.5" y="3" textAnchor="middle" fill="#94a3b8" fontSize="2.5" fontStyle="italic">sent to agent</text>

          {/* AgentOutput → EvaluationResult (elbow: right edge down, across, down to left box) */}
          <path d="M 90 13 V 22 H 10 V 30" fill="none" stroke="#94a3b8" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#cf-arrow)" />
          <text x="50" y="20.5" textAnchor="middle" fill="#94a3b8" fontSize="2.5" fontStyle="italic">scored by verifier</text>

          {/* EvaluationResult → TrialRecord (horizontal, centered between boxes) */}
          <line x1="40" y1="40" x2="60" y2="40" stroke="#94a3b8" strokeWidth="0.4" markerEnd="url(#cf-arrow)" />
          <text x="49.5" y="38" textAnchor="middle" fill="#94a3b8" fontSize="2.5" fontStyle="italic">recorded</text>
          <text x="49.5" y="43" textAnchor="middle" fill="#94a3b8" fontSize="2.5" fontStyle="italic">in ledger</text>
        </svg>

        {/* Contract nodes */}
        <div className="absolute left-0 top-0 w-[42%]">
          <ContractNode label="TaskDefinition" color="border-[#38b2ac]/80" />
        </div>
        <div className="absolute right-0 top-0 w-[42%]">
          <ContractNode label="AgentOutput" color="border-[#38b2ac]/80" />
        </div>
        <div className="absolute bottom-0 left-0 w-[42%]">
          <ContractNode label="EvaluationResult" color="border-[#e8a838]/80" />
        </div>
        <div className="absolute bottom-0 right-0 w-[42%]">
          <ContractNode label="TrialRecord" color="border-[#e8a838]/80" />
        </div>
      </div>
    </div>
  );
}
