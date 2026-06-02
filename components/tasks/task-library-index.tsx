// ABOUTME: Public task-library index showing the generated benchmark template sitemap.
// ABOUTME: Groups built and proposed task entries by discipline and category with detail links.
import Link from 'next/link';
import { ArrowRight, Boxes } from 'lucide-react';
import type { Domain } from '@/lib/aec-bench/contracts';
import type { LibraryCatalogue } from '@/lib/aec-bench/library-catalogue';
import { DISCIPLINE_META, DISCIPLINE_ORDER } from '@/lib/disciplines';

interface TaskLibraryIndexProps {
  catalogue: LibraryCatalogue;
}

interface DisciplineNavigationItem {
  discipline: Domain;
  name: string;
  templates: number;
  seeds: number;
}

function prettify(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function TaskLibraryIndex({ catalogue }: TaskLibraryIndexProps) {
  const totalTasks = catalogue.counts.total_templates + catalogue.counts.total_seeds;
  const disciplineNavigation = DISCIPLINE_ORDER.map((discipline) => ({
    discipline,
    name: DISCIPLINE_META[discipline].name,
    ...catalogue.counts.by_discipline[discipline],
  }));

  return (
    <main className="min-h-screen bg-landing-bg text-landing-text">
      <section className="border-b border-landing-border bg-[#080908]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="anno">benchmark sitemap</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
              Task Library
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-landing-muted md:text-lg">
              Browse the benchmark by discipline, task family, and template. Built templates open
              into parameter maps, difficulty contracts, scenario families, and generation previews.
            </p>
          </div>
          <aside className="rounded border border-landing-border bg-[#050505] p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-landing-muted">current map</p>
            <dl className="mt-4 grid gap-3 font-mono text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-landing-muted">built templates</dt>
                <dd className="text-accent-amber">{catalogue.counts.total_templates}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-landing-muted">proposed seeds</dt>
                <dd className="text-accent-teal">{catalogue.counts.total_seeds}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-landing-border pt-3">
                <dt className="text-landing-muted">total tasks</dt>
                <dd>{totalTasks}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-landing-muted">source</dt>
                <dd>{catalogue.library_commit ?? 'unavailable'}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="task-sitemap-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="anno">disciplines</p>
            <h2 id="task-sitemap-heading" className="mt-2 text-xl font-semibold">
              Site Map
            </h2>
          </div>
          <p className="font-mono text-xs text-landing-muted">
            /tasks/[discipline]/[taskId]
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <DisciplineNavigation items={disciplineNavigation} />

          <div className="grid gap-4">
            {DISCIPLINE_ORDER.map((discipline) => (
              <DisciplineBlock
                key={discipline}
                discipline={discipline}
                catalogue={catalogue}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function DisciplineNavigation({ items }: { items: DisciplineNavigationItem[] }) {
  return (
    <nav
      aria-label="Task library disciplines"
      className="rounded border border-landing-border bg-[#050505] p-3 lg:sticky lg:top-28"
    >
      <div className="flex items-center justify-between gap-3 border-b border-landing-border pb-3 font-mono text-[0.65rem] uppercase tracking-wider">
        <span className="text-landing-muted">jump to discipline</span>
        <span className="text-accent-teal">{items.length}</span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-1">
        {items.map((item) => (
          <li key={item.discipline}>
            <a
              href={`#${item.discipline}-tasks-heading`}
              className="group grid gap-2 rounded border border-landing-border bg-[#090909] px-3 py-2 transition-colors hover:border-accent-amber/60 hover:bg-[#111111]"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-landing-text">{item.name}</span>
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 text-accent-amber opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </span>
              <span className="font-mono text-[0.65rem] text-landing-muted">
                <span className="text-accent-amber">{item.templates}</span> built /{' '}
                <span className="text-accent-teal">{item.seeds}</span> proposed
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DisciplineBlock({
  discipline,
  catalogue,
}: {
  discipline: Domain;
  catalogue: LibraryCatalogue;
}) {
  const meta = DISCIPLINE_META[discipline];
  const templates = catalogue.templates.filter((entry) => entry.discipline === discipline);
  const seeds = catalogue.seeds.filter((entry) => entry.discipline === discipline);
  const entries = [...templates, ...seeds];
  const categories = Array.from(new Set(entries.map((entry) => entry.category))).sort((a, b) =>
    prettify(a).localeCompare(prettify(b)),
  );

  return (
    <section className="rounded border border-landing-border bg-[#070707]" aria-labelledby={`${discipline}-tasks-heading`}>
      <header className="grid gap-3 border-b border-landing-border p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h3 id={`${discipline}-tasks-heading`} className="scroll-mt-36 text-2xl font-semibold">
            {meta.name}
          </h3>
          <p className="mt-1 text-sm text-landing-muted">{meta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          <span className="rounded border border-accent-amber/50 bg-accent-amber/15 px-2 py-1 text-accent-amber">
            {templates.length} built
          </span>
          <span className="rounded border border-accent-teal/50 bg-accent-teal/15 px-2 py-1 text-accent-teal">
            {seeds.length} proposed
          </span>
        </div>
      </header>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {categories.map((category) => {
          const built = templates.filter((entry) => entry.category === category);
          const proposed = seeds.filter((entry) => entry.category === category);
          return (
            <article key={category} className="rounded border border-landing-border bg-[#0c0c0c] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="font-mono text-sm font-semibold text-landing-text">{prettify(category)}</h4>
                <span className="font-mono text-xs text-landing-muted">
                  {built.length + proposed.length}
                </span>
              </div>
              <ul className="grid gap-1">
                {built.map((entry) => (
                  <li key={`${entry.discipline}/${entry.task_id}`}>
                    <Link
                      href={`/tasks/${entry.discipline}/${entry.task_id}`}
                      className="group flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm text-landing-muted transition-colors hover:bg-[#151515] hover:text-landing-text"
                    >
                      <span className="truncate">{entry.task_name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-accent-amber opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              {proposed.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-landing-muted">
                  <span className="inline-flex items-center gap-1">
                    <Boxes className="h-3 w-3" aria-hidden="true" />
                    {proposed.length} proposed
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
