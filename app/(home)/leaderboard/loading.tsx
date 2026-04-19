// ABOUTME: Skeleton shown while /leaderboard hydrates or compiles in dev.
// ABOUTME: Mirrors the layout of LeaderboardSurface (heading, chart area, table area).
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="h-8 w-48 animate-pulse rounded bg-[#141414]" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[#141414]" />
      <div className="mt-8 h-80 animate-pulse rounded border border-landing-border bg-[#0a0a0a]" />
      <div className="mt-4 h-64 animate-pulse rounded border border-landing-border bg-[#0a0a0a]" />
    </main>
  );
}
