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

  it('renders the CLI readout mock', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/bench run/)).toBeInTheDocument();
    expect(screen.getByText(/cable-sizing/)).toBeInTheDocument();
  });

  it('links to architecture docs', () => {
    render(<HowItWorks />);
    const link = screen.getByRole('link', { name: /full pipeline/i });
    expect(link).toHaveAttribute('href', '/docs/core/architecture');
  });
});
