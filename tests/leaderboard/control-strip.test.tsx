// ABOUTME: Tests for the control strip — CLI-prompt row of three chips.
// ABOUTME: Covers chip labels across selection states, popover open/close, locked filters.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ControlStrip } from '@/components/leaderboard/control-strip';

describe('ControlStrip', () => {
  const defaults = {
    axisX: 'cost' as const,
    disciplines: [] as const,
    harnesses: [] as const,
    harnessOptions: ['tool_loop', 'rlm', 'direct', 'lambda-rlm'] as const,
    onAxisChange: vi.fn(),
    onDisciplinesChange: vi.fn(),
    onHarnessesChange: vi.fn(),
  };

  it('renders the three chips with their values', () => {
    render(<ControlStrip {...defaults} />);
    expect(screen.getByRole('button', { name: /--x.*cost/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /--discipline.*all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /--harness.*all/i })).toBeInTheDocument();
  });

  it('shows the single selected discipline when exactly one is picked', () => {
    render(<ControlStrip {...defaults} disciplines={['civil']} />);
    expect(screen.getByRole('button', { name: /--discipline.*civil/i })).toBeInTheDocument();
  });

  it('shows "+N" summary when multiple disciplines are picked', () => {
    render(<ControlStrip {...defaults} disciplines={['civil', 'electrical', 'ground']} />);
    expect(screen.getByRole('button', { name: /--discipline.*civil.*\+2/i })).toBeInTheDocument();
  });

  it('opens the axis popover on chip click and fires onAxisChange', () => {
    const onAxisChange = vi.fn();
    render(<ControlStrip {...defaults} onAxisChange={onAxisChange} />);
    fireEvent.click(screen.getByRole('button', { name: /--x.*cost/i }));
    fireEvent.click(screen.getByRole('option', { name: /tokens/i }));
    expect(onAxisChange).toHaveBeenCalledWith('tokens');
  });

  it('hides the discipline chip when lockedDiscipline is set', () => {
    render(<ControlStrip {...defaults} lockedDiscipline="civil" />);
    expect(screen.queryByRole('button', { name: /--discipline/i })).toBeNull();
  });
});
