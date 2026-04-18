// ABOUTME: Tests for the hand-rolled SVG scatter chart.
// ABOUTME: Covers dot count, axis labels, frontier polyline, hover tooltip, keyboard nav.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScatterChart } from '@/components/leaderboard/scatter-chart';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { FIXTURE_ENTRIES } from './fixtures/entries';

describe('ScatterChart', () => {
  const frontier = new Set(['claude-opus-4.7::rlm', 'gpt-4o::tool_loop', 'haiku-4.5::tool_loop']);

  const defaultProps = {
    entries: FIXTURE_ENTRIES,
    axisMetric: AXIS_METRICS.cost,
    yAxisLabel: 'reward',
    frontierKeys: frontier,
    onDotHover: vi.fn(),
    onDotClick: vi.fn(),
    hoveredRowKey: null,
    expandedRowKey: null,
  };

  it('renders exactly one dot per entry with a non-null x value', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const dotGroups = container.querySelectorAll('[data-testid^="dot-"]');
    expect(dotGroups.length).toBe(FIXTURE_ENTRIES.length);
  });

  it('renders the axis labels from the axisMetric', () => {
    render(<ScatterChart {...defaultProps} />);
    expect(screen.getByText(AXIS_METRICS.cost.label)).toBeInTheDocument();
    expect(screen.getByText(/reward/i)).toBeInTheDocument();
  });

  it('renders the frontier polyline when >=3 entries', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    expect(container.querySelector('polyline')).toBeTruthy();
  });

  it('fires onDotHover when a dot is entered and nulls it when left', () => {
    const onDotHover = vi.fn();
    const { container } = render(<ScatterChart {...defaultProps} onDotHover={onDotHover} />);
    const first = container.querySelector('[data-testid^="dot-"]')!;
    fireEvent.mouseEnter(first);
    expect(onDotHover).toHaveBeenLastCalledWith(expect.any(String));
    fireEvent.mouseLeave(first);
    expect(onDotHover).toHaveBeenLastCalledWith(null);
  });

  it('fires onDotClick when a dot is clicked', () => {
    const onDotClick = vi.fn();
    const { container } = render(<ScatterChart {...defaultProps} onDotClick={onDotClick} />);
    const first = container.querySelector('[data-testid^="dot-"]')!;
    fireEvent.click(first);
    expect(onDotClick).toHaveBeenCalledWith(expect.any(String));
  });

  it('shows a tooltip for the hovered row', () => {
    const key = `${FIXTURE_ENTRIES[0].model_key}::${FIXTURE_ENTRIES[0].adapter}`;
    render(<ScatterChart {...defaultProps} hoveredRowKey={key} />);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText(FIXTURE_ENTRIES[0].model_display)).toBeInTheDocument();
  });

  it('applies a frontier ring to frontier dots (via data attribute)', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const frontierDots = container.querySelectorAll('[data-frontier="true"]');
    expect(frontierDots.length).toBe(3);
  });

  it('exposes each dot as a focusable button with an accessible label', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const first = container.querySelector('[data-testid^="dot-"]')!;
    expect(first.getAttribute('role')).toBe('button');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-label')).toMatch(/reward/i);
  });

  it('moves focus to the nearest-x neighbour on ArrowRight', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const dots = Array.from(container.querySelectorAll('[data-testid^="dot-"]'));
    (dots[0] as HTMLElement).focus();
    fireEvent.keyDown(dots[0], { key: 'ArrowRight' });
    expect(document.activeElement).not.toBe(dots[0]);
  });

  it('renders an empty-state message when entries is empty', () => {
    render(<ScatterChart {...defaultProps} entries={[]} />);
    expect(screen.getByText(/no entries match/i)).toBeInTheDocument();
  });
});
