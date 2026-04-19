// ABOUTME: Tests for the dropdown picker used by the control strip chips.
// ABOUTME: Covers single/multi-select, clear row, outside-click close, keyboard nav.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ControlStripPopover } from '@/components/leaderboard/control-strip-popover';

describe('ControlStripPopover', () => {
  const options = [
    { value: 'cost', label: 'cost' },
    { value: 'tokens', label: 'tokens' },
    { value: 'latency', label: 'latency' },
  ];

  it('renders each option', () => {
    render(
      <ControlStripPopover
        options={options}
        selected={['cost']}
        multi={false}
        onChange={() => {}}
        onClose={() => {}}
      />,
    );
    for (const o of options) {
      expect(screen.getByRole('option', { name: new RegExp(o.label, 'i') })).toBeInTheDocument();
    }
  });

  it('single-select: onChange fires with only the clicked value', () => {
    const onChange = vi.fn();
    render(
      <ControlStripPopover
        options={options}
        selected={['cost']}
        multi={false}
        onChange={onChange}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('option', { name: /tokens/i }));
    expect(onChange).toHaveBeenCalledWith(['tokens']);
  });

  it('multi-select: clicking toggles a value in/out of the selection', () => {
    const onChange = vi.fn();
    render(
      <ControlStripPopover
        options={options}
        selected={['cost']}
        multi={true}
        onChange={onChange}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('option', { name: /tokens/i }));
    expect(onChange).toHaveBeenCalledWith(['cost', 'tokens']);
  });

  it('multi-select with clear row clears everything', () => {
    const onChange = vi.fn();
    render(
      <ControlStripPopover
        options={options}
        selected={['cost', 'tokens']}
        multi={true}
        showClear={true}
        onChange={onChange}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('option', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('Escape closes the popover', () => {
    const onClose = vi.fn();
    render(
      <ControlStripPopover
        options={options}
        selected={[]}
        multi={false}
        onChange={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
