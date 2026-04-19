// ABOUTME: Tests for the expandable leaderboard row.
// ABOUTME: Covers collapsed render, expanded content, keyboard toggle, [mock] tag.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExpandableRow } from '@/components/leaderboard/expandable-row';
import { makeEntry } from './fixtures/entries';

describe('ExpandableRow', () => {
  const entry = makeEntry({
    rank: 1,
    model_display: 'Claude Opus 4.7',
    provider: 'anthropic',
    adapter: 'rlm',
    reward: 0.82,
    reward_ci: [0.79, 0.85],
    delta_vs_previous: 0.02,
    mean_tokens: 46000,
    mean_cost_usd: 1.8,
    is_mock: false,
  });

  const baseProps = {
    entry,
    rankDisplay: 1,
    isExpanded: false,
    isHoveredFromChart: false,
    onFrontier: false,
    onToggle: vi.fn(),
  };

  it('renders the model, adapter, reward, delta, tokens, cost when collapsed', () => {
    render(<table><tbody><ExpandableRow {...baseProps} /></tbody></table>);
    expect(screen.getByText('Claude Opus 4.7')).toBeInTheDocument();
    expect(screen.getByText('rlm')).toBeInTheDocument();
    expect(screen.getByText('0.82')).toBeInTheDocument();
    expect(screen.getByText(/\+0\.02/)).toBeInTheDocument();
    expect(screen.getByText(/46\.0k/)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.80/)).toBeInTheDocument();
  });

  it('shows the [frontier] badge when onFrontier=true', () => {
    render(<table><tbody><ExpandableRow {...baseProps} onFrontier={true} /></tbody></table>);
    expect(screen.getByText(/\[frontier\]/)).toBeInTheDocument();
  });

  it('shows the [mock] tag when entry.is_mock is true', () => {
    const mockEntry = { ...entry, is_mock: true };
    render(<table><tbody><ExpandableRow {...baseProps} entry={mockEntry} /></tbody></table>);
    expect(screen.getByText(/\[mock\]/i)).toBeInTheDocument();
  });

  it('calls onToggle when the row is clicked', () => {
    const onToggle = vi.fn();
    render(<table><tbody><ExpandableRow {...baseProps} onToggle={onToggle} /></tbody></table>);
    fireEvent.click(screen.getByRole('row', { name: /Claude Opus 4\.7/ }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('toggles on Enter and Space keydown', () => {
    const onToggle = vi.fn();
    render(<table><tbody><ExpandableRow {...baseProps} onToggle={onToggle} /></tbody></table>);
    const row = screen.getByRole('row', { name: /Claude Opus 4\.7/ });
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('shows expanded content when isExpanded=true (per-discipline, CI, trials)', () => {
    render(<table><tbody><ExpandableRow {...baseProps} isExpanded={true} /></tbody></table>);
    expect(screen.getByText(/per-discipline reward/i)).toBeInTheDocument();
    expect(screen.getByText(/95% CI/)).toBeInTheDocument();
    expect(screen.getByText(/\[0\.79.*0\.85\]/)).toBeInTheDocument();
    expect(screen.getByText(/trials/i)).toBeInTheDocument();
  });
});
