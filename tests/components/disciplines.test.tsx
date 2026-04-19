// ABOUTME: Tests the restyled disciplines section — props-driven counts and metadata module usage.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Disciplines } from '@/components/landing/disciplines';

const counts = {
  civil:      { templates: 56, seeds: 31 },
  electrical: { templates: 13, seeds: 131 },
  ground:     { templates: 10, seeds: 3 },
  mechanical: { templates: 0,  seeds: 141 },
  structural: { templates: 0,  seeds: 82 },
};

describe('Disciplines', () => {
  it('renders the heading', () => {
    render(<Disciplines counts={counts} totalTasks={467} />);
    expect(
      screen.getByRole('heading', { name: /five engineering disciplines/i }),
    ).toBeInTheDocument();
  });

  it('renders five discipline codes', () => {
    render(<Disciplines counts={counts} totalTasks={467} />);
    for (const c of ['CIV·01', 'ELE·02', 'GND·03', 'MEC·04', 'STR·05']) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
  });

  it('renders all five discipline names', () => {
    render(<Disciplines counts={counts} totalTasks={467} />);
    for (const n of ['Civil', 'Electrical', 'Ground', 'Mechanical', 'Structural']) {
      expect(screen.getByRole('heading', { name: n })).toBeInTheDocument();
    }
  });

  it('renders two-line built / proposed counts per card', () => {
    render(<Disciplines counts={counts} totalTasks={467} />);
    // Civil: 56 built + 31 proposed
    expect(screen.getByText(/56 built/)).toBeInTheDocument();
    expect(screen.getByText(/\+ 31 proposed/)).toBeInTheDocument();
    // Electrical: 13 built + 131 proposed
    expect(screen.getByText(/13 built/)).toBeInTheDocument();
    expect(screen.getByText(/\+ 131 proposed/)).toBeInTheDocument();
    // Mechanical: 0 built (use exact boundary to avoid matching "10 built" from Ground)
    const builtElements = screen.getAllByText(/built/);
    expect(builtElements.some((el) => el.textContent?.trim() === '0 built')).toBe(true);
    expect(screen.getByText(/\+ 141 proposed/)).toBeInTheDocument();
  });

  it('links each card to /leaderboard/[discipline]', () => {
    render(<Disciplines counts={counts} totalTasks={467} />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/leaderboard/civil');
    expect(hrefs).toContain('/leaderboard/structural');
  });

  it('renders the live coverage line using totalTasks prop', () => {
    render(<Disciplines counts={counts} totalTasks={467} />);
    expect(screen.getByText(/467\/467/)).toBeInTheDocument();
  });
});
