// ABOUTME: Tests the restyled disciplines section — 5 cards, codes, counts, deep-links.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Disciplines } from '@/components/landing/disciplines';

describe('Disciplines', () => {
  it('renders the heading', () => {
    render(<Disciplines />);
    expect(
      screen.getByRole('heading', { name: /five engineering disciplines/i }),
    ).toBeInTheDocument();
  });

  it('renders five discipline codes', () => {
    render(<Disciplines />);
    for (const c of ['CIV·01', 'ELE·02', 'GND·03', 'MEC·04', 'STR·05']) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
  });

  it('renders all five discipline names', () => {
    render(<Disciplines />);
    for (const n of ['Civil', 'Electrical', 'Ground', 'Mechanical', 'Structural']) {
      expect(screen.getByRole('heading', { name: n })).toBeInTheDocument();
    }
  });

  it('renders task counts', () => {
    render(<Disciplines />);
    // Civil and Structural both have 108 tasks — assert at least one of each.
    const counts108 = screen.getAllByText(/108/);
    expect(counts108.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/121/)).toBeInTheDocument();
    expect(screen.getByText(/94/)).toBeInTheDocument();
    expect(screen.getByText(/116/)).toBeInTheDocument();
  });

  it('links each card to /leaderboard/[discipline]', () => {
    render(<Disciplines />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/leaderboard/civil');
    expect(hrefs).toContain('/leaderboard/structural');
  });
});
