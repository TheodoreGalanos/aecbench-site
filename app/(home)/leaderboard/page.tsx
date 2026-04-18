// ABOUTME: RSC wrapper for /leaderboard — reads ingested artefact and passes to client surface.
// ABOUTME: Zero runtime data fetching; artefact is static at build time.
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LeaderboardSurface } from '@/components/leaderboard/leaderboard-surface';
import { getAllEntries, getRunStatus, isMock } from '@/lib/aec-bench/read';
import Loading from './loading';

export const metadata: Metadata = {
  title: 'Leaderboard — AEC-Bench',
  description: 'Interactive Pareto view of models × adapters on AEC-Bench tasks.',
};

export default function LeaderboardPage() {
  const entries = getAllEntries();
  const runStatus = getRunStatus();

  return (
    <main>
      <Suspense fallback={<Loading />}>
        <LeaderboardSurface
          entries={entries}
          isMock={isMock()}
          runStatus={runStatus}
          heading="Leaderboard"
          subheading="All models and adapters across the active dataset"
        />
      </Suspense>
    </main>
  );
}
