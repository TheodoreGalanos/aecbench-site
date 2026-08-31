// ABOUTME: Tests the persisted run contract flow documentation component.
// ABOUTME: Verifies requested state, planned membership, records, and accounting remain distinct.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContractsFlow } from '@/components/docs/contracts-flow';

describe('ContractsFlow', () => {
  it('shows the complete run contract sequence', () => {
    render(<ContractsFlow />);

    expect(
      screen.getByRole('img', {
        name: /resolvedrunspec through runplan, trialworkitem, trialrecord values, and runaccounting/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('ResolvedRunSpec').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RunPlan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TrialWorkItem').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RunAccounting').length).toBeGreaterThan(0);
  });
});
