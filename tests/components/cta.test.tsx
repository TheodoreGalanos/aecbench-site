// ABOUTME: Tests the restyled CTA section — install command, meta line, secondary buttons.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CallToAction } from '@/components/landing/cta';

describe('CallToAction', () => {
  it('renders the pitch', () => {
    render(<CallToAction />);
    expect(
      screen.getByRole('heading', { name: /benchmark your model against real engineering/i }),
    ).toBeInTheDocument();
  });

  it('renders the pip install CopyBox', () => {
    render(<CallToAction />);
    expect(screen.getByText('pip install aec-bench')).toBeInTheDocument();
  });

  it('renders the mono meta line with latest version and stars', () => {
    render(<CallToAction />);
    expect(screen.getByText(/v0\.4\.1/)).toBeInTheDocument();
    expect(screen.getByText(/2\.4k/)).toBeInTheDocument();
  });

  it('renders three secondary commands', () => {
    render(<CallToAction />);
    expect(screen.getByRole('link', { name: /quickstart/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contribute a task/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /submit your model/i })).toBeInTheDocument();
  });
});
