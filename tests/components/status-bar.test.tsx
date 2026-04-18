// tests/components/status-bar.test.tsx
// ABOUTME: Status bar renders honest labels — no fake run_id, relative times from real timestamps.
// ABOUTME: Covers LIVE vs PREVIEW states via the is_mock flag.
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusBar } from '@/components/landing/status-bar';

vi.mock('@/lib/aec-bench/read', () => ({
  getRunStatus: () => ({
    tasks: 30,
    models: 5,
    adapters: 3,
    disciplines: 5,
    last_submission: '2026-04-18T10:00:00Z',
    generated_at: '2026-04-18T12:00:00Z',
  }),
  getDataset: () => ({
    name: 'aec-bench',
    version: '0.4.1',
    content_hash: 'h',
    description: { summary: 's', task_count: 30 },
    tasks: [],
  }),
  isMock: () => true,
}));

describe('StatusBar', () => {
  it('shows PREVIEW mode when is_mock is true', () => {
    render(<StatusBar />);
    expect(screen.getByText(/PREVIEW/)).toBeInTheDocument();
    expect(screen.queryByText(/LIVE/)).not.toBeInTheDocument();
  });

  it('renders tasks, models, disciplines counts', () => {
    render(<StatusBar />);
    expect(screen.getByText('30')).toBeInTheDocument();
    // models and disciplines both equal 5 in mock data — two matching spans is correct
    expect(screen.getAllByText('5', { selector: 'span' })).toHaveLength(2);
  });

  it('shows last_submission and built-at relative times', () => {
    render(<StatusBar />);
    expect(screen.getByText(/last submission/i)).toBeInTheDocument();
    expect(screen.getByText(/built/i)).toBeInTheDocument();
  });
});
