// ABOUTME: Tests that the Pareto overlay renders a polyline over frontier points only.
// ABOUTME: Hidden when total points < 3 (not meaningful).
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ParetoOverlay } from '@/components/leaderboard/pareto-overlay';

describe('ParetoOverlay', () => {
  const points = [
    { key: 'a', x: 10, y: 80 },
    { key: 'b', x: 30, y: 60 },
    { key: 'c', x: 50, y: 30 },
    { key: 'd', x: 70, y: 50 },
  ];

  it('renders a polyline with dashed amber stroke', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points} frontierKeys={new Set(['a', 'b', 'c'])} />
      </svg>,
    );
    const line = container.querySelector('polyline');
    expect(line).toBeTruthy();
    expect(line!.getAttribute('stroke')).toBe('#e8a838');
    expect(line!.getAttribute('stroke-dasharray')).toBeTruthy();
  });

  it('connects only the frontier points, ordered by x ascending', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points} frontierKeys={new Set(['a', 'b', 'c'])} />
      </svg>,
    );
    const attr = container.querySelector('polyline')!.getAttribute('points')!;
    const coords = attr.trim().split(/\s+/);
    expect(coords).toHaveLength(3);
    const xs = coords.map((c) => Number(c.split(',')[0]));
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it('renders nothing when there are fewer than 3 points overall', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points.slice(0, 2)} frontierKeys={new Set(['a', 'b'])} />
      </svg>,
    );
    expect(container.querySelector('polyline')).toBeNull();
  });

  it('renders nothing when the frontier is empty', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points} frontierKeys={new Set()} />
      </svg>,
    );
    expect(container.querySelector('polyline')).toBeNull();
  });
});
