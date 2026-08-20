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
        name: /benchmark run flow from define task through retain and report/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders all six pipeline stages', () => {
    render(<BenchmarkRunFlow />);

    expect(screen.getAllByText('Define Task').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resolve Instance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Plan Trial').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Run Attempt(s)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Select & Verify').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Retain & Report').length).toBeGreaterThan(0);
  });
});
