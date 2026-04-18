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

  it('renders compact top-4 list', () => {
    render(<RewardCostTeaser />);
    expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument();
    expect(screen.getByText('Llama 4 Maverick')).toBeInTheDocument();
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
