// ABOUTME: Tests the restyled hero section — headline, command buttons, readout presence.
// ABOUTME: Copy assertions use partial match because key terms are wrapped in styled spans.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Hero } from '@/components/landing/hero';

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero />);
    expect(
      screen.getByRole('heading', { name: /how capable is ai at real engineering/i }),
    ).toBeInTheDocument();
  });

  it('renders both CTA links with command-style labels', () => {
    render(<Hero />);
    const explore = screen.getByRole('link', { name: /explore_results/i });
    const docs = screen.getByRole('link', { name: /read_the_docs/i });
    expect(explore).toHaveAttribute('href', '/leaderboard');
    expect(docs).toHaveAttribute('href', '/docs');
  });

  it('mentions 500+ tasks in the subtitle', () => {
    render(<Hero />);
    expect(screen.getByText(/500\+/)).toBeInTheDocument();
  });

  it('renders the hero readout widget (screen-reader visible)', () => {
    render(<Hero />);
    expect(screen.getByRole('complementary', { name: /bench run/i })).toBeInTheDocument();
  });
});
