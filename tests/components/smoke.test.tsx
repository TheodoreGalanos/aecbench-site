// ABOUTME: Smoke test to verify the test infrastructure works.
// ABOUTME: Tests that React Testing Library renders components correctly.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('renders a basic React element', () => {
    render(<div>aec-bench</div>);
    expect(screen.getByText('aec-bench')).toBeInTheDocument();
  });
});
