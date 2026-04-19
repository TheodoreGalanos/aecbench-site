// ABOUTME: Tests CatalogueSummary — totals + provenance line render.
// ABOUTME: Verifies totals display, commit truncation to 7 chars, and date-only timestamp.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogueSummary } from '@/components/discipline/catalogue-summary';

describe('CatalogueSummary', () => {
  const baseProps = {
    totals: { tasks: 87, built: 56, proposed: 31, categories: 12, standards: 42 },
    libraryVersion: '0.1.0',
    libraryCommit: '1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    generatedAt: '2026-04-19T09:00:00Z',
  };

  it('renders the totals line', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.getByText(/87 tasks/)).toBeInTheDocument();
    expect(screen.getByText(/56 built/)).toBeInTheDocument();
    expect(screen.getByText(/31 proposed/)).toBeInTheDocument();
    expect(screen.getByText(/12 categories/)).toBeInTheDocument();
    expect(screen.getByText(/42 standards/)).toBeInTheDocument();
  });

  it('renders the provenance line with truncated commit', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.getByText(/library v0\.1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/1a2b3c4/)).toBeInTheDocument();
    expect(screen.queryByText(/5e6f7890/)).not.toBeInTheDocument();
  });

  it('renders the generated date (date portion only)', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.getByText(/2026-04-19/)).toBeInTheDocument();
  });
});
