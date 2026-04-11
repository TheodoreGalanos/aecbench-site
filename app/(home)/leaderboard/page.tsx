// ABOUTME: Placeholder leaderboard page — full implementation in Phase 3.
// ABOUTME: Shows a coming soon message with link back to landing page preview.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'AI model performance across AEC engineering disciplines.',
};

export default function LeaderboardPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="mt-4 max-w-md text-fd-muted-foreground">
        The full interactive leaderboard with charts and filtering is coming
        soon. Check the landing page for a preview of current standings.
      </p>
    </div>
  );
}
