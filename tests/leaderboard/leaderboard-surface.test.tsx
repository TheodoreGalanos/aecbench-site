// ABOUTME: Integration test for the leaderboard surface composition.
// ABOUTME: Renders the full surface with a fixture and exercises filter → reshape → sort → render.
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaderboardSurface } from '@/components/leaderboard/leaderboard-surface';
import { FIXTURE_ENTRIES } from './fixtures/entries';

const replace = vi.fn();
let searchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/leaderboard',
  useSearchParams: () => searchParams,
}));

describe('LeaderboardSurface', () => {
  const baseRunStatus = {
    tasks: 6,
    models: 5,
    adapters: 4,
    disciplines: 5,
    last_submission: '2026-04-18T10:00:00Z',
    generated_at: '2026-04-18T10:30:00Z',
  };

  beforeEach(() => {
    searchParams = new URLSearchParams('');
    replace.mockClear();
  });

  it('renders the heading, subheading, and dataset kicker', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={true}
        runStatus={baseRunStatus}
        heading="Leaderboard"
        subheading="All models and adapters"
      />,
    );
    expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument();
    expect(screen.getByText(/All models and adapters/)).toBeInTheDocument();
    expect(screen.getByText(/aec-bench@0\.4\.1/)).toBeInTheDocument();
  });

  it('shows the mock caveat when isMock=true', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={true}
        runStatus={baseRunStatus}
        heading="Leaderboard"
      />,
    );
    expect(screen.getByText(/mock submissions/i)).toBeInTheDocument();
  });

  it('renders the control strip, scatter chart, legend, and table', () => {
    const { container } = render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Leaderboard"
      />,
    );
    expect(screen.getByRole('button', { name: /--x.*cost/i })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('list', { name: /chart legend/i })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('hides the discipline chip when lockedDiscipline is set', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Civil"
        lockedDiscipline="civil"
      />,
    );
    expect(screen.queryByRole('button', { name: /--discipline/i })).toBeNull();
  });

  it('renders the trailingSlot below the table', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Leaderboard"
        trailingSlot={<div data-testid="trailing">extra</div>}
      />,
    );
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
  });

  it('renders the footnote about x-axis when disciplines are filtered', () => {
    searchParams = new URLSearchParams('d=civil');
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Leaderboard"
      />,
    );
    expect(screen.getByText(/overall across all disciplines/i)).toBeInTheDocument();
  });
});
