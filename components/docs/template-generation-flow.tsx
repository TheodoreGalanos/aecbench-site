// ABOUTME: Visual diagram showing how a template fans out into multiple task instances.
// ABOUTME: Three input files converge into a generator, which produces N task instances.
'use client';

function FileChip({ name, color }: Readonly<{ name: string; color: string }>) {
  return (
    <div
      className={`rounded-md border px-3 py-1.5 text-xs font-mono leading-tight ${color}`}
    >
      {name}
    </div>
  );
}

function InstanceCard({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#e8a838]/60 bg-[var(--color-fd-card)] px-3 py-2 text-xs font-medium text-[var(--color-fd-foreground)]">
      <div className="h-2 w-2 rounded-full bg-[#e8a838]" />
      {label}
    </div>
  );
}

export function TemplateGenerationFlow() {
  return (
    <div
      className="not-prose my-8"
      role="img"
      aria-label="Template generation flow: template files converge into generator, producing multiple task instances"
      data-testid="template-generation-flow"
    >
      {/* Mobile: vertical stack */}
      <div className="space-y-3 md:hidden">
        <div className="rounded-xl border border-[#38b2ac]/60 bg-[var(--color-fd-card)] p-4">
          <div className="mb-3 text-sm font-semibold text-[var(--color-fd-foreground)]">Template</div>
          <div className="flex flex-wrap gap-2">
            <FileChip name="params.toml" color="border-[#38b2ac]/40 text-[#38b2ac]" />
            <FileChip name="instruction.md" color="border-[#38b2ac]/40 text-[#38b2ac]" />
            <FileChip name="engine.py" color="border-[#38b2ac]/40 text-[#38b2ac]" />
          </div>
        </div>

        <div className="flex justify-center" aria-hidden="true">
          <svg viewBox="0 0 16 28" className="h-7 w-4">
            <defs>
              <marker id="tgf-m-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#94a3b8" />
              </marker>
            </defs>
            <line x1="8" y1="0" x2="8" y2="26" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#tgf-m-arrow)" />
          </svg>
        </div>

        <div className="flex items-center justify-center rounded-xl border border-[#e8a838]/80 bg-[var(--color-fd-card)] px-4 py-3">
          <span className="text-sm font-semibold text-[#e8a838]">Generate</span>
        </div>

        <div className="flex justify-center" aria-hidden="true">
          <svg viewBox="0 0 40 28" className="h-7 w-10">
            <line x1="20" y1="0" x2="8" y2="26" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#tgf-m-arrow)" />
            <line x1="20" y1="0" x2="20" y2="26" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#tgf-m-arrow)" />
            <line x1="20" y1="0" x2="32" y2="26" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#tgf-m-arrow)" />
          </svg>
        </div>

        <div className="space-y-2">
          <InstanceCard label="instance-001" />
          <InstanceCard label="instance-002" />
          <InstanceCard label="instance-003" />
        </div>
      </div>

      {/* Desktop: horizontal layout */}
      <div className="relative hidden h-44 md:block">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 36"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker id="tgf-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#94a3b8" />
            </marker>
          </defs>
          {/* Template → Generate (gap before box) */}
          <line x1="35" y1="18" x2="43" y2="18" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#tgf-arrow)" />
          {/* Generate → Instances (fan-out, equal spacing from center) */}
          <line x1="57" y1="18" x2="64" y2="4" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#tgf-arrow)" />
          <line x1="57" y1="18" x2="64" y2="18" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#tgf-arrow)" />
          <line x1="57" y1="18" x2="64" y2="32" stroke="#94a3b8" strokeWidth="0.35" markerEnd="url(#tgf-arrow)" />
        </svg>

        {/* Template card */}
        <div className="absolute left-0 top-1/2 w-[34%] -translate-y-1/2 rounded-xl border border-[#38b2ac]/60 bg-[var(--color-fd-card)] p-4">
          <div className="mb-2.5 text-sm font-semibold text-[var(--color-fd-foreground)]">Template</div>
          <div className="flex flex-wrap gap-1.5">
            <FileChip name="params.toml" color="border-[#38b2ac]/40 text-[#38b2ac]" />
            <FileChip name="instruction.md" color="border-[#38b2ac]/40 text-[#38b2ac]" />
            <FileChip name="engine.py" color="border-[#38b2ac]/40 text-[#38b2ac]" />
          </div>
        </div>

        {/* Generate node */}
        <div className="absolute left-[44%] top-1/2 w-[12%] -translate-y-1/2">
          <div className="flex items-center justify-center rounded-xl border border-[#e8a838]/80 bg-[var(--color-fd-card)] px-3 py-3">
            <span className="text-sm font-semibold text-[#e8a838]">Generate</span>
          </div>
        </div>

        {/* Instance cards */}
        <div className="absolute right-0 top-0 w-[34%] space-y-2">
          <InstanceCard label="instance-001" />
        </div>
        <div className="absolute right-0 top-1/2 w-[34%] -translate-y-1/2 space-y-2">
          <InstanceCard label="instance-002" />
        </div>
        <div className="absolute bottom-0 right-0 w-[34%] space-y-2">
          <InstanceCard label="instance-003" />
        </div>
      </div>
    </div>
  );
}
