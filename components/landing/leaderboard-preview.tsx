// ABOUTME: Compact leaderboard preview for the landing page.
// ABOUTME: Shows top models with overall scores and a link to the full leaderboard.
'use client';

import Link from 'next/link';
import { previewModels } from './data';
import { Trophy } from 'lucide-react';

export function LeaderboardPreview() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center text-3xl font-bold text-landing-text md:text-4xl">
          Current Standings
        </h2>
        <div className="overflow-hidden rounded-xl border border-landing-border bg-landing-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-landing-border text-sm text-landing-muted">
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Provider</th>
                <th className="px-4 py-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {previewModels.map((model) => (
                <tr
                  key={model.rank}
                  className="border-b border-landing-border last:border-0"
                >
                  <td className="px-4 py-3 text-landing-muted">
                    {model.rank === 1 ? (
                      <Trophy className="inline h-4 w-4 text-accent-amber" />
                    ) : (
                      model.rank
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-landing-text">
                    {model.model}
                  </td>
                  <td className="hidden px-4 py-3 text-landing-muted sm:table-cell">
                    {model.provider}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-accent-amber">
                    {Math.round(model.overallScore * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-accent-amber transition-opacity hover:opacity-80"
          >
            View Full Leaderboard →
          </Link>
        </div>
      </div>
    </section>
  );
}
