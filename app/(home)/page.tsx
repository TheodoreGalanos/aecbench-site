// ABOUTME: Landing page assembling all sections for the aec-bench site.
// ABOUTME: Uses the (home) route group with HomeLayout and StatusBar mounted in layout.tsx.
import { Hero } from '@/components/landing/hero';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';
import { RewardCostTeaser } from '@/components/landing/reward-cost-teaser';
import { Disciplines } from '@/components/landing/disciplines';
import { HowItWorks } from '@/components/landing/how-it-works';
import { CallToAction } from '@/components/landing/cta';
import { getCatalogue } from '@/lib/aec-bench/library-catalogue';

export default function HomePage() {
  const catalogue = getCatalogue();
  const counts = catalogue.counts.by_discipline;
  const totalTasks = catalogue.counts.total_templates + catalogue.counts.total_seeds;

  return (
    <main className="bg-gradient-to-b from-landing-bg to-landing-bg-end">
      <Hero />
      <LeaderboardPreview />
      <RewardCostTeaser />
      <Disciplines counts={counts} totalTasks={totalTasks} />
      <HowItWorks />
      <CallToAction />
    </main>
  );
}
