// ABOUTME: Tests for the How It Works landing page section.
// ABOUTME: Verifies the three methodology steps render correctly.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HowItWorks } from '@/components/landing/how-it-works';

describe('HowItWorks', () => {
  it('renders the section heading', () => {
    render(<HowItWorks />);
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
  });

  it('renders three methodology steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/500\+ seed tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/tool-calling/i)).toBeInTheDocument();
    expect(screen.getByText(/reward signals/i)).toBeInTheDocument();
  });
});
