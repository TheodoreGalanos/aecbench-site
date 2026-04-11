// ABOUTME: Tests for the bottom CTA landing page section.
// ABOUTME: Verifies call-to-action headline and links render correctly.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CallToAction } from '@/components/landing/cta';

describe('CallToAction', () => {
  it('renders the CTA headline', () => {
    render(<CallToAction />);
    expect(screen.getByText(/evaluate your model/i)).toBeInTheDocument();
  });

  it('renders the Submit Your Model link', () => {
    render(<CallToAction />);
    const link = screen.getByRole('link', { name: /submit your model/i });
    expect(link).toHaveAttribute('href', '/docs/start/quickstart');
  });

  it('renders the Contribute Tasks link', () => {
    render(<CallToAction />);
    const link = screen.getByRole('link', { name: /contribute tasks/i });
    expect(link).toHaveAttribute('href', '/docs');
  });
});
