// ABOUTME: Loading fallback for the discipline route — shared with /leaderboard pattern.
// ABOUTME: Shown while the RSC data (slice JSON + catalogue) resolves.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="h-8 w-64 animate-pulse rounded bg-[#1a1a1a]" />
      <div className="mt-4 h-4 w-96 animate-pulse rounded bg-[#1a1a1a]" />
    </div>
  );
}
