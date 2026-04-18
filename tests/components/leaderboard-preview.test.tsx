// ABOUTME: Tests the restyled leaderboard preview renders structure + shape, not specific values.
// ABOUTME: Real values vary with mock data; we assert counts + types + format.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';

describe('LeaderboardPreview', () => {
  it('renders the section heading and dataset kicker', () => {
    render(<LeaderboardPreview />);
    expect(
      screen.getByRole('heading', { name: /current standings/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dataset/)).toBeInTheDocument();
    expect(screen.getByText(/v0\.4\.1/)).toBeInTheDocument();
  });

  it('renders 4 rank badges (zero-padded)', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('renders deltas with + or − prefix in exactly 4 rows', () => {
    render(<LeaderboardPreview />);
    const deltas = screen.getAllByText(/^[+−]\d+\.\d{2}$/);
    expect(deltas.length).toBe(4);
  });

  it('renders reward values in 0.XX format in at least 4 places', () => {
    render(<LeaderboardPreview />);
    // One reward per row; there are 4 rows. Headings and section meta may contain extra
    // 0.XX-formatted numbers, so use >= 4 rather than === 4.
    const rewards = screen.getAllByText(/^\d\.\d{2}$/);
    expect(rewards.length).toBeGreaterThanOrEqual(4);
  });

  it('renders the adapter name next to each row provider', () => {
    render(<LeaderboardPreview />);
    // At least one row displays an adapter string (tool_loop | rlm | direct)
    expect(screen.getAllByText(/tool_loop|rlm|direct/).length).toBeGreaterThanOrEqual(1);
  });

  it('links to the full leaderboard', () => {
    render(<LeaderboardPreview />);
    const link = screen.getByRole('link', { name: /bench leaderboard --full/i });
    expect(link).toHaveAttribute('href', '/leaderboard');
  });
});
