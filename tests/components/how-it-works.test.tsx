// ABOUTME: Tests the restyled how-it-works section — 6 stages, CLI readout, docs link.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HowItWorks } from '@/components/landing/how-it-works';

describe('HowItWorks', () => {
  it('renders the heading', () => {
    render(<HowItWorks />);
    expect(screen.getByRole('heading', { name: /define.*run.*score/i })).toBeInTheDocument();
  });

  it('renders six numbered stages', () => {
    render(<HowItWorks />);
    for (const n of ['01', '02', '03', '04', '05', '06']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });

  it('renders the documented CLI readout', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/uv run aec-bench run-local/)).toBeInTheDocument();
    expect(screen.getByText(/--harness/)).toBeInTheDocument();
    expect(screen.getByText(/uv run aec-bench evaluate/)).toBeInTheDocument();
  });

  it('links to the CLI docs', () => {
    render(<HowItWorks />);
    const link = screen.getByRole('link', { name: /cli guide/i });
    expect(link).toHaveAttribute('href', '/docs/reference/cli');
  });
});
