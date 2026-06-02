// ABOUTME: Tests the CTA section source checkout command, meta line, and secondary buttons.
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

  it('renders the source checkout CopyBox', () => {
    render(<CallToAction />);
    expect(screen.getByText('git clone https://github.com/TheodorosGalanos/aec-bench.git')).toBeInTheDocument();
  });

  it('renders the mono meta line with source status and stars', () => {
    render(<CallToAction />);
    expect(screen.getByText(/source checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.4k/)).toBeInTheDocument();
  });

  it('renders task library and secondary commands', () => {
    render(<CallToAction />);
    expect(screen.getByRole('link', { name: /quickstart/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse task library/i })).toHaveAttribute(
      'href',
      '/tasks',
    );
    expect(screen.getByRole('link', { name: /contribute a task/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /submit your model/i })).toBeInTheDocument();
  });
});
