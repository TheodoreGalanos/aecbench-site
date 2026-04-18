// ABOUTME: Tests the restyled leaderboard preview — window chrome, grid rows, delta, tokens, cost.
// ABOUTME: Verifies each row renders the extended PreviewModel fields.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';

describe('LeaderboardPreview', () => {
  it('renders the section heading and kicker', () => {
    render(<LeaderboardPreview />);
    expect(
      screen.getByRole('heading', { name: /current standings/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dataset/)).toBeInTheDocument();
    expect(screen.getByText(/v0\.4\.1/)).toBeInTheDocument();
  });

  it('renders all four models with zero-padded ranks', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument();
    expect(screen.getByText('GPT-4.1')).toBeInTheDocument();
    expect(screen.getByText('Gemini 2.5 Pro')).toBeInTheDocument();
    expect(screen.getByText('Llama 4 Maverick')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('renders rewards as two-decimal numbers', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('0.72')).toBeInTheDocument();
    expect(screen.getByText('0.68')).toBeInTheDocument();
  });

  it('renders deltas with + / − symbol', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('+0.04')).toBeInTheDocument();
    expect(screen.getByText('−0.01')).toBeInTheDocument();
  });

  it('renders tokens and cost columns', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('2.14M')).toBeInTheDocument();
    expect(screen.getByText('$18.40')).toBeInTheDocument();
  });

  it('links to the full leaderboard', () => {
    render(<LeaderboardPreview />);
    const link = screen.getByRole('link', { name: /bench leaderboard --full/i });
    expect(link).toHaveAttribute('href', '/leaderboard');
  });
});
