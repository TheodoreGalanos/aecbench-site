// ABOUTME: Tests for the table shell — window chrome, sort headers, row rendering.
// ABOUTME: Does not cover animation (that's on ExpandableRow).
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { FIXTURE_ENTRIES } from './fixtures/entries';

describe('LeaderboardTable', () => {
  const base = {
    entries: FIXTURE_ENTRIES,
    frontierKeys: new Set<string>(),
    hoveredRowKey: null,
    expandedRowKey: null,
    sort: { column: 'rank', dir: 'asc' } as const,
    onSortChange: vi.fn(),
    onRowToggle: vi.fn(),
  };

  it('renders the terminal window chrome with row count', () => {
    render(<LeaderboardTable {...base} />);
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${FIXTURE_ENTRIES.length} rows`))).toBeInTheDocument();
  });

  it('renders one ExpandableRow per entry', () => {
    render(<LeaderboardTable {...base} />);
    for (const e of FIXTURE_ENTRIES) {
      expect(
        screen.getByRole('button', { name: new RegExp(e.model_display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }),
      ).toBeInTheDocument();
    }
  });

  it('fires onSortChange when a sortable header is clicked', () => {
    const onSortChange = vi.fn();
    render(<LeaderboardTable {...base} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /reward/i }));
    expect(onSortChange).toHaveBeenCalled();
  });

  it('flips sort direction when the same header is clicked twice', () => {
    const onSortChange = vi.fn();
    const { rerender } = render(<LeaderboardTable {...base} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /reward/i }));
    const firstCall = onSortChange.mock.calls[0][0];
    rerender(<LeaderboardTable {...base} sort={firstCall} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /reward/i }));
    const secondCall = onSortChange.mock.calls[1][0];
    expect(secondCall.dir).not.toBe(firstCall.dir);
  });

  it('shows the frontier badge count in the window chrome', () => {
    render(
      <LeaderboardTable
        {...base}
        frontierKeys={new Set([`${FIXTURE_ENTRIES[0].model_key}::${FIXTURE_ENTRIES[0].adapter}`])}
      />,
    );
    expect(screen.getByText(/1 on frontier/i)).toBeInTheDocument();
  });
});
