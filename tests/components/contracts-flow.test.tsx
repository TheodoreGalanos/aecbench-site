// ABOUTME: Tests the artefact-task contract flow documentation component.
// ABOUTME: Verifies that attempts, selection, evaluation, and the reportable trial remain distinct.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContractsFlow } from '@/components/docs/contracts-flow';

describe('ContractsFlow', () => {
  it('shows attempt selection before the reportable trial', () => {
    render(<ContractsFlow />);

    expect(
      screen.getByRole('img', {
        name: /resolvedtaskinstance through taskattempt candidates and evaluationresult to trialrecord/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('TaskAttempt candidate(s)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('selected output verified').length).toBeGreaterThan(0);
  });
});
