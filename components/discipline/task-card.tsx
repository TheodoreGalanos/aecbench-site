// ABOUTME: Single card presentation for a library catalogue entry (template or seed).
// ABOUTME: Status pill + title + description + standards chips + IO/archetype footer.
import type { LibraryCatalogueEntry } from '@/lib/aec-bench/library-catalogue';

const TIER_ORDER: Record<'easy' | 'medium' | 'hard', number> = { easy: 0, medium: 1, hard: 2 };

function difficultyChip(entry: LibraryCatalogueEntry): string | null {
  if (entry.difficulty_tiers && entry.difficulty_tiers.length > 0) {
    const sorted = [...entry.difficulty_tiers].sort((a, b) => TIER_ORDER[a] - TIER_ORDER[b]);
    if (sorted.length === 1) return sorted[0];
    return `${sorted[0]}–${sorted[sorted.length - 1]}`;
  }
  if (entry.complexity) return entry.complexity;
  return null;
}

export interface TaskCardProps {
  entry: LibraryCatalogueEntry;
}

export function TaskCard({ entry }: TaskCardProps) {
  const chip = difficultyChip(entry);
  const shownStandards = entry.standards.slice(0, 3);
  const overflow = Math.max(0, entry.standards.length - shownStandards.length);
  const pillClass =
    entry.status === 'built'
      ? 'bg-accent-amber text-[#0a0a0a]'
      : 'bg-accent-teal text-[#0a0a0a]';

  return (
    <article className="flex flex-col gap-2 rounded border border-landing-border bg-[#050505] p-3">
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider ${pillClass}`}
          >
            {entry.status === 'built' ? 'BUILT' : 'PROPOSED'}
          </span>
          <p className="truncate text-sm font-semibold text-landing-text">{entry.task_name}</p>
        </div>
        {chip && (
          <span className="shrink-0 font-mono text-[0.65rem] text-landing-muted">{chip}</span>
        )}
      </header>

      <p className="line-clamp-2 text-xs text-landing-muted">{entry.description}</p>

      {shownStandards.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1">
          {shownStandards.map((s) => (
            <li
              key={s}
              className="rounded border border-landing-border px-1.5 py-0.5 font-mono text-[0.6rem] text-landing-text"
            >
              {s}
            </li>
          ))}
          {overflow > 0 && (
            <li className="font-mono text-[0.6rem] text-landing-muted">+{overflow} more</li>
          )}
        </ul>
      )}

      <footer className="font-mono text-[0.6rem] text-landing-muted">
        {entry.inputs.length} inputs → {entry.outputs.length} outputs
        {entry.archetype_count && entry.archetype_count > 0
          ? ` · ${entry.archetype_count} archetypes`
          : ''}
      </footer>
    </article>
  );
}
