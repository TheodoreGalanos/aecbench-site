// ABOUTME: RSC wrapper for /leaderboard/[discipline] — five thin wrappers around LeaderboardSurface.
// ABOUTME: Pre-filters to the slug via lockedDiscipline, renders catalogue trailing slot.
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DOMAINS, type Domain } from '@/lib/aec-bench/contracts';
import { DISCIPLINE_META, DISCIPLINE_ORDER } from '@/lib/disciplines';
import { getByDiscipline, getRunStatus, isMock } from '@/lib/aec-bench/read';
import { getCatalogue, getCatalogueForDiscipline } from '@/lib/aec-bench/library-catalogue';
import { LeaderboardSurface } from '@/components/leaderboard/leaderboard-surface';
import { DisciplineTrailingSlot } from '@/components/discipline/discipline-trailing-slot';
import Loading from './loading';

export async function generateStaticParams() {
  return DISCIPLINE_ORDER.map((discipline) => ({ discipline }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discipline: string }>;
}): Promise<Metadata> {
  const { discipline } = await params;
  if (!isValidDiscipline(discipline)) {
    return { title: 'Not Found — AEC-Bench' };
  }
  const meta = DISCIPLINE_META[discipline];
  return {
    title: `${meta.name} — AEC-Bench Leaderboard`,
    description: `${meta.description} Benchmark results for ${meta.name.toLowerCase()} engineering tasks across models and harnesses.`,
  };
}

function isValidDiscipline(slug: string): slug is Domain {
  return (DOMAINS as readonly string[]).includes(slug);
}

export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ discipline: string }>;
}) {
  const { discipline } = await params;
  if (!isValidDiscipline(discipline)) notFound();

  const slice = await getByDiscipline(discipline);
  const runStatus = getRunStatus();
  const catalogue = getCatalogue();
  const catalogueSlice = getCatalogueForDiscipline(discipline, catalogue);
  const meta = DISCIPLINE_META[discipline];

  return (
    <div className="bg-landing-bg">
      <Suspense fallback={<Loading />}>
        <LeaderboardSurface
          entries={slice.entries}
          isMock={isMock()}
          runStatus={runStatus}
          heading={meta.name}
          subheading={meta.description}
          lockedDiscipline={discipline}
          trailingSlot={
            <DisciplineTrailingSlot
              slug={discipline}
              slice={catalogueSlice}
              libraryVersion={catalogue.library_version}
              libraryCommit={catalogue.library_commit}
              generatedAt={catalogue.generated_at}
            />
          }
        />
      </Suspense>
    </div>
  );
}
