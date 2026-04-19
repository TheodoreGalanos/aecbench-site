// ABOUTME: Two-line summary header: totals + provenance for the discipline catalogue.
// ABOUTME: Server component; pure presentation, props-driven.
export interface CatalogueSummaryProps {
  totals: {
    tasks: number;
    built: number;
    proposed: number;
    categories: number;
    standards: number;
  };
  libraryVersion: string;
  libraryCommit: string;
  generatedAt: string;
}

export function CatalogueSummary({
  totals,
  libraryVersion,
  libraryCommit,
  generatedAt,
}: CatalogueSummaryProps) {
  const date = generatedAt.slice(0, 10);
  const commit = libraryCommit.slice(0, 7);

  return (
    <header className="mb-4">
      <p className="font-mono text-xs text-landing-text">
        <span className="text-accent-amber">{totals.tasks} tasks</span>
        {' · '}
        {totals.built} built · {totals.proposed} proposed ·{' '}
        {totals.categories} categories · {totals.standards} standards
      </p>
      <p className="mt-1 font-mono text-[0.65rem] text-landing-muted">
        catalogue library v{libraryVersion} · @ {commit} · generated {date}
      </p>
    </header>
  );
}
