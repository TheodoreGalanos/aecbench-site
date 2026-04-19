// ABOUTME: Tests that the legend renders each provider and each known harness.
// ABOUTME: Assertion focus: text labels and accessible role, not pixel-perfect styling.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Legend } from '@/components/leaderboard/legend';

describe('Legend', () => {
  it('renders each provider label', () => {
    render(<Legend />);
    for (const p of ['anthropic', 'openai', 'google', 'meta', 'other']) {
      expect(screen.getByText(new RegExp(p, 'i'))).toBeInTheDocument();
    }
  });

  it('renders each known harness label', () => {
    render(<Legend />);
    for (const h of ['tool_loop', 'rlm', 'direct', 'lambda-rlm']) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }
  });

  it('uses a list role for assistive tech', () => {
    render(<Legend />);
    expect(screen.getByRole('list', { name: /chart legend/i })).toBeInTheDocument();
  });
});
