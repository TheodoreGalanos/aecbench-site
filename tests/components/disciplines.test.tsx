// ABOUTME: Tests for the Disciplines showcase landing page section.
// ABOUTME: Verifies all five engineering disciplines render with descriptions.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Disciplines } from '@/components/landing/disciplines';

describe('Disciplines', () => {
  it('renders the section heading', () => {
    render(<Disciplines />);
    expect(
      screen.getByRole('heading', { name: /five engineering disciplines/i }),
    ).toBeInTheDocument();
  });

  it('renders all five disciplines', () => {
    render(<Disciplines />);
    expect(screen.getByText('Civil')).toBeInTheDocument();
    expect(screen.getByText('Electrical')).toBeInTheDocument();
    expect(screen.getByText('Ground')).toBeInTheDocument();
    expect(screen.getByText('Mechanical')).toBeInTheDocument();
    expect(screen.getByText('Structural')).toBeInTheDocument();
  });

  it('renders discipline descriptions', () => {
    render(<Disciplines />);
    expect(screen.getByText(/drainage/i)).toBeInTheDocument();
    expect(screen.getByText(/cable sizing/i)).toBeInTheDocument();
    expect(screen.getByText(/foundations/i)).toBeInTheDocument();
    expect(screen.getByText(/hvac/i)).toBeInTheDocument();
    expect(screen.getByText(/seismic/i)).toBeInTheDocument();
  });
});
