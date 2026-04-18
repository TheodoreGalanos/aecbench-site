// ABOUTME: Tests the reward×cost teaser renders the top-4 compact list and mini-scatter card.
// ABOUTME: SVG content is asserted via test-id and accessible name.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RewardCostTeaser } from '@/components/landing/reward-cost-teaser';

describe('RewardCostTeaser', () => {
  it('renders the section heading', () => {
    render(<RewardCostTeaser />);
    expect(
      screen.getByRole('heading', { name: /reward.*cost/i }),
    ).toBeInTheDocument();
  });

  it('renders at least 4 model rows in the compact list', () => {
    render(<RewardCostTeaser />);
    // Rows must expose at least one ranked-looking identifier (`#01` through `#04` zero-padded).
    const rankMarks = screen.getAllByText(/#\d\d/);
    expect(rankMarks.length).toBeGreaterThanOrEqual(4);
  });

  it('renders a Pareto-frontier chart (svg with accessible name)', () => {
    render(<RewardCostTeaser />);
    expect(
      screen.getByRole('img', { name: /reward vs cost/i }),
    ).toBeInTheDocument();
  });

  it('deep-links to the leaderboard twice', () => {
    render(<RewardCostTeaser />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h === '/leaderboard').length).toBeGreaterThanOrEqual(2);
  });
});
