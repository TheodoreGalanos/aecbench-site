// ABOUTME: Tests for the [frontier] pill badge.
// ABOUTME: Just a presentational leaf — checks text, role, and class hooks.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FrontierBadge } from '@/components/leaderboard/frontier-badge';

describe('FrontierBadge', () => {
  it('renders the [frontier] label', () => {
    render(<FrontierBadge />);
    expect(screen.getByText(/\[frontier\]/i)).toBeInTheDocument();
  });

  it('uses an aria-label that screen readers can announce', () => {
    render(<FrontierBadge />);
    expect(screen.getByText(/\[frontier\]/i)).toHaveAttribute(
      'aria-label',
      'on the Pareto frontier',
    );
  });
});
