// ABOUTME: Native <details>/<summary> collapsible section for a single category.
// ABOUTME: No JS, no framer-motion — keeps route bundle zero-cost.
import type { DisciplineCatalogueSlice } from '@/lib/aec-bench/library-catalogue';
import { TaskCard } from './task-card';

type Category = DisciplineCatalogueSlice['categories'][number];

export interface CategorySectionProps {
  category: Category;
}

export function CategorySection({ category }: CategorySectionProps) {
  const total = category.built.length + category.proposed.length;

  return (
    <details className="group rounded border border-landing-border bg-[#0a0a0a]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-mono text-sm marker:hidden">
        <span className="font-semibold text-landing-text">{category.label}</span>
        <span className="font-mono text-xs text-landing-muted">
          ({total}) ·{' '}
          <span className="text-accent-amber">● {category.built.length} built</span>{' '}
          · ○ {category.proposed.length} proposed
        </span>
      </summary>
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
        {category.built.map((e) => (
          <TaskCard key={e.task_id} entry={e} />
        ))}
        {category.proposed.map((e) => (
          <TaskCard key={e.task_id} entry={e} />
        ))}
      </div>
    </details>
  );
}
