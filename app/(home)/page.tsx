// ABOUTME: Landing page assembling all sections for the aec-bench site.
// ABOUTME: Uses the (home) route group with HomeLayout.
import { Hero } from '@/components/landing/hero';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';
import { Disciplines } from '@/components/landing/disciplines';
import { HowItWorks } from '@/components/landing/how-it-works';
import { CallToAction } from '@/components/landing/cta';

export default function HomePage() {
  return (
    <main className="bg-gradient-to-b from-landing-bg to-landing-bg-end">
      <Hero />
      <LeaderboardPreview />
      <Disciplines />
      <HowItWorks />
      <CallToAction />
    </main>
  );
}
