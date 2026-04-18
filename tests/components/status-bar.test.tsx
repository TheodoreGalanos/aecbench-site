// ABOUTME: Tests the persistent landing status bar renders run-status fields.
// ABOUTME: We assert text content only; motion is reduced-motion-gated.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBar } from '@/components/landing/status-bar';

describe('StatusBar', () => {
  it('renders all run-status fields', () => {
    render(<StatusBar />);
    expect(screen.getByText(/LIVE/)).toBeInTheDocument();
    expect(screen.getByText(/run_id/)).toBeInTheDocument();
    expect(screen.getByText('0412-a7')).toBeInTheDocument();
    expect(screen.getByText('547')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText(/last_run 2h ago/)).toBeInTheDocument();
  });
});
