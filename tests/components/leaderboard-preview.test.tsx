// ABOUTME: Tests for the leaderboard preview landing page section.
// ABOUTME: Verifies model names, scores, and link to full leaderboard render.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';

describe('LeaderboardPreview', () => {
  it('renders the section heading', () => {
    render(<LeaderboardPreview />);
    expect(
      screen.getByRole('heading', { name: /current standings/i }),
    ).toBeInTheDocument();
  });

  it('renders all preview models', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument();
    expect(screen.getByText('GPT-4.1')).toBeInTheDocument();
    expect(screen.getByText('Gemini 2.5 Pro')).toBeInTheDocument();
    expect(screen.getByText('Llama 4 Maverick')).toBeInTheDocument();
  });

  it('renders overall scores as percentages', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('links to the full leaderboard', () => {
    render(<LeaderboardPreview />);
    const link = screen.getByRole('link', { name: /view full leaderboard/i });
    expect(link).toHaveAttribute('href', '/leaderboard');
  });
});
