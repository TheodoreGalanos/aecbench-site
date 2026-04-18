// ABOUTME: Tests for the mobile bottom-sheet filter UI.
// ABOUTME: Covers open/close, batched selection, apply commits, cancel discards.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileFilterSheet } from '@/components/leaderboard/mobile-filter-sheet';

describe('MobileFilterSheet', () => {
  const baseProps = {
    axisX: 'cost' as const,
    disciplines: [] as const,
    harnesses: [] as const,
    harnessOptions: ['tool_loop', 'rlm'] as const,
    activeFilterCount: 0,
    onApply: vi.fn(),
  };

  it('closed by default — shows a trigger button with the filter count', () => {
    render(<MobileFilterSheet {...baseProps} activeFilterCount={2} />);
    expect(screen.getByRole('button', { name: /filters.*2/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the sheet on trigger click', () => {
    render(<MobileFilterSheet {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(screen.getByRole('dialog', { name: /filters/i })).toBeInTheDocument();
  });

  it('calls onApply with batched selections only when [apply] is clicked', () => {
    const onApply = vi.fn();
    render(<MobileFilterSheet {...baseProps} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    fireEvent.click(screen.getByRole('option', { name: /civil/i }));
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      disciplines: ['civil'],
    }));
  });

  it('discards batched selections on [cancel]', () => {
    const onApply = vi.fn();
    render(<MobileFilterSheet {...baseProps} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    fireEvent.click(screen.getByRole('option', { name: /civil/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
