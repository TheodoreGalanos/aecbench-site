// ABOUTME: Thin banner shown above the nav when the leaderboard is rendering synthetic data.
// ABOUTME: Hidden when real submissions have replaced the mocks.
export function PreviewBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-40 border-b border-landing-border bg-[#1a1205] px-4 py-1.5 text-center font-mono text-[0.68rem] tracking-wide text-accent-amber"
    >
      <span aria-hidden="true" className="mr-1.5">●</span>
      PREVIEW · synthetic preview data — real results land as aec-bench ships
    </div>
  );
}
