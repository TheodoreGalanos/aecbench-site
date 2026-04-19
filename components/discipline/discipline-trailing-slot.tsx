// ABOUTME: Composes CatalogueSummary → CategorySection[] → DisciplineNav for the discipline page.
// ABOUTME: Server component; receives pre-grouped slice from the route.
import type { Domain } from '@/lib/aec-bench/contracts';
import type { DisciplineCatalogueSlice } from '@/lib/aec-bench/library-catalogue';
import { CatalogueSummary } from './catalogue-summary';
import { CategorySection } from './category-section';
import { DisciplineNav } from './discipline-nav';

export interface DisciplineTrailingSlotProps {
  slug: Domain;
  slice: DisciplineCatalogueSlice;
  libraryVersion: string;
  libraryCommit: string;
  generatedAt: string;
}

export function DisciplineTrailingSlot({
  slug,
  slice,
  libraryVersion,
  libraryCommit,
  generatedAt,
}: DisciplineTrailingSlotProps) {
  return (
    <section aria-labelledby="catalogue-heading">
      <h2 id="catalogue-heading" className="sr-only">
        Task catalogue for {slug}
      </h2>
      <CatalogueSummary
        totals={slice.totals}
        libraryVersion={libraryVersion}
        libraryCommit={libraryCommit}
        generatedAt={generatedAt}
      />
      {slice.categories.length === 0 ? (
        <p className="font-mono text-xs text-landing-muted">
          no templates or seeds registered for this discipline yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {slice.categories.map((c) => (
            <CategorySection key={c.key} category={c} />
          ))}
        </div>
      )}
      <DisciplineNav slug={slug} />
    </section>
  );
}
