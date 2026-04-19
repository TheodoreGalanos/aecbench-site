// ABOUTME: Prev/next discipline chips (bottom-of-page nav) using neighbours() wraparound.
// ABOUTME: Server component; pure links.
import Link from 'next/link';
import type { Domain } from '@/lib/aec-bench/contracts';
import { neighbours } from '@/lib/disciplines';

export interface DisciplineNavProps {
  slug: Domain;
}

export function DisciplineNav({ slug }: DisciplineNavProps) {
  const { prev, next } = neighbours(slug);
  return (
    <nav className="mt-8 flex items-center justify-between font-mono text-sm">
      <Link
        href={`/leaderboard/${prev}`}
        className="text-landing-muted transition-colors hover:text-accent-amber"
      >
        ← prev: {prev}
      </Link>
      <span className="text-[#444]">·</span>
      <Link
        href={`/leaderboard/${next}`}
        className="text-landing-muted transition-colors hover:text-accent-amber"
      >
        next: {next} →
      </Link>
    </nav>
  );
}
