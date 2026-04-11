// ABOUTME: Landing page assembling all sections for the AEC-Bench site.
// ABOUTME: Uses the (home) route group with HomeLayout.
import { Hero } from '@/components/landing/hero';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';

export default function HomePage() {
  return (
    <main className="bg-gradient-to-b from-landing-bg to-landing-bg-end">
      <Hero />
      <LeaderboardPreview />
    </main>
  );
}
