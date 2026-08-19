// ABOUTME: Summary header with counts derived from the discipline catalogue entries.
// ABOUTME: Server component; pure presentation, props-driven.
export interface CatalogueSummaryProps {
  totals: {
    tasks: number;
    built: number;
    proposed: number;
    categories: number;
    standards: number;
  };
}

export function CatalogueSummary({ totals }: CatalogueSummaryProps) {
  return (
    <header className="mb-4">
      <p className="font-mono text-xs text-landing-text">
        <span className="text-accent-amber">{totals.tasks} tasks</span>
        {' · '}
        {totals.built} built · {totals.proposed} proposed ·{' '}
        {totals.categories} categories · {totals.standards} standards
      </p>
    </header>
  );
}
