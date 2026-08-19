// ABOUTME: Tests CatalogueSummary as a derived view of deterministic catalogue entries.
// ABOUTME: Confirms deployment metadata does not appear as catalogue identity.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogueSummary } from '@/components/discipline/catalogue-summary';

describe('CatalogueSummary', () => {
  const baseProps = {
    totals: { tasks: 87, built: 56, proposed: 31, categories: 12, standards: 42 },
  };

  it('renders the totals line', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.getByText(/87 tasks/)).toBeInTheDocument();
    expect(screen.getByText(/56 built/)).toBeInTheDocument();
    expect(screen.getByText(/31 proposed/)).toBeInTheDocument();
    expect(screen.getByText(/12 categories/)).toBeInTheDocument();
    expect(screen.getByText(/42 standards/)).toBeInTheDocument();
  });

  it('does not present package, commit, or build time as catalogue identity', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.queryByText(/library v/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/generated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/commit/i)).not.toBeInTheDocument();
  });
});
