// ABOUTME: Tests for the stepped benchmark run flow documentation component.
// ABOUTME: Verifies stage labels and the accessible diagram label render correctly.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BenchmarkRunFlow } from '@/components/docs/benchmark-run-flow';

describe('BenchmarkRunFlow', () => {
  it('renders the accessible diagram label', () => {
    render(<BenchmarkRunFlow />);

    expect(
      screen.getByRole('img', {
        name: /benchmark run flow from define task through reconcile run/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders all seven pipeline stages', () => {
    render(<BenchmarkRunFlow />);

    expect(screen.getAllByText('Define Task').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resolve Run').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Persist Plan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Create Work Items').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lease and Run Attempts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Publish Trial Records').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reconcile Run').length).toBeGreaterThan(0);
  });
});
