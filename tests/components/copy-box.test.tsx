// ABOUTME: Tests CopyBox renders the command, supports clicking copy, and toggles state.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CopyBox } from '@/components/landing/copy-box';

describe('CopyBox', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders the command text', () => {
    render(<CopyBox command="git clone https://github.com/aurecon/aec-bench.git" />);
    expect(screen.getByText('git clone https://github.com/aurecon/aec-bench.git')).toBeInTheDocument();
  });

  it('copies to clipboard and shows "copied" feedback on click', async () => {
    render(<CopyBox command="git clone https://github.com/aurecon/aec-bench.git" />);
    const btn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('git clone https://github.com/aurecon/aec-bench.git');
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    });
  });
});
