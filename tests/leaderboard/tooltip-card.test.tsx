// ABOUTME: Tests for the scatter chart tooltip card (floating + sticky variants).
// ABOUTME: Renders entry data; shows [frontier] only when onFrontier is true.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TooltipCard } from '@/components/leaderboard/tooltip-card';
import { makeEntry } from './fixtures/entries';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';

describe('TooltipCard', () => {
  const entry = makeEntry({
    model_display: 'Claude Opus 4.7',
    adapter: 'rlm',
    reward: 0.82,
    reward_ci: [0.79, 0.85],
    mean_cost_usd: 1.8,
    mean_tokens: 46000,
    mean_duration_seconds: 12.4,
    trials: 180,
    repetitions: 30,
  });

  it('renders model and adapter', () => {
    render(<TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} />);
    expect(screen.getByText(/Claude Opus 4\.7/)).toBeInTheDocument();
    expect(screen.getByText(/rlm/)).toBeInTheDocument();
  });

  it('renders reward with CI when available', () => {
    render(<TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} />);
    expect(screen.getByText(/0\.82/)).toBeInTheDocument();
    expect(screen.getAllByText(/\[0\.79.*0\.85\]/).length).toBeGreaterThan(0);
  });

  it('shows the frontier badge when onFrontier=true', () => {
    const { rerender } = render(
      <TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} />,
    );
    expect(screen.queryByText(/\[frontier\]/)).toBeNull();
    rerender(<TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={true} />);
    expect(screen.getByText(/\[frontier\]/)).toBeInTheDocument();
  });

  it('renders — for missing CI', () => {
    const noCi = { ...entry, reward_ci: null };
    render(<TooltipCard entry={noCi} axisMetric={AXIS_METRICS.cost} onFrontier={false} />);
    // CI row should show —
    const ciLabels = screen.getAllByText(/—/);
    expect(ciLabels.length).toBeGreaterThan(0);
  });

  it('accepts a variant of "floating" or "sticky"', () => {
    const { rerender } = render(
      <TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} variant="floating" />,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-variant', 'floating');
    rerender(
      <TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} variant="sticky" />,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-variant', 'sticky');
  });
});
