// ABOUTME: Small dropdown picker used by the control strip chips.
// ABOUTME: Single or multi-select; Escape closes; outside-click handled via document mousedown.
'use client';
import { useEffect, useRef } from 'react';
import { clsx } from '@/lib/clsx';

export interface PopoverOption {
  value: string;
  label: string;
}

export interface ControlStripPopoverProps {
  options: ReadonlyArray<PopoverOption>;
  selected: ReadonlyArray<string>;
  multi: boolean;
  showClear?: boolean;
  onChange: (next: string[]) => void;
  onClose: () => void;
  className?: string;
}

export function ControlStripPopover({
  options,
  selected,
  multi,
  showClear,
  onChange,
  onClose,
  className,
}: ControlStripPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [onClose]);

  function toggle(v: string) {
    if (multi) {
      const next = selected.includes(v)
        ? selected.filter((x) => x !== v)
        : [...selected, v];
      onChange(next);
    } else {
      onChange([v]);
    }
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-multiselectable={multi}
      className={clsx(
        'absolute z-20 mt-1 min-w-[140px] rounded-sm border border-landing-border bg-[#050505] p-1',
        'font-mono text-xs text-[#c7c7c7] shadow-xl',
        className,
      )}
    >
      {multi && showClear && (
        <button
          role="option"
          aria-selected={selected.length === 0}
          type="button"
          onClick={() => onChange([])}
          className="block w-full cursor-pointer rounded-sm px-2 py-1 text-left text-[0.7rem] uppercase tracking-wider text-[#888] hover:bg-[#141414] hover:text-[#c7c7c7]"
        >
          × clear
        </button>
      )}
      {options.map((o) => {
        const isSelected = selected.includes(o.value);
        return (
          <button
            key={o.value}
            role="option"
            aria-selected={isSelected}
            type="button"
            onClick={() => toggle(o.value)}
            className={clsx(
              'block w-full cursor-pointer rounded-sm px-2 py-1 text-left hover:bg-[#141414]',
              isSelected && 'text-accent-amber',
            )}
          >
            {multi ? (isSelected ? '☑ ' : '☐ ') : isSelected ? '› ' : '  '}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
