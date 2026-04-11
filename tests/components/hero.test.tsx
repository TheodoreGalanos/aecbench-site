// ABOUTME: Tests for the Hero landing page section.
// ABOUTME: Verifies headline, subtitle, and CTA buttons render correctly.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Hero } from '@/components/landing/hero';

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero />);
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent(/how capable is ai at real engineering/i);
  });

  it('renders the subtitle', () => {
    render(<Hero />);
    expect(screen.getByText(/500\+ tasks/i)).toBeInTheDocument();
  });

  it('renders the Explore Results CTA linking to leaderboard', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /explore results/i });
    expect(link).toHaveAttribute('href', '/leaderboard');
  });

  it('renders the Read the Docs CTA linking to docs', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /read the docs/i });
    expect(link).toHaveAttribute('href', '/docs');
  });
});
