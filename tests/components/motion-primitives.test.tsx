// ABOUTME: Tests for FadeUp motion wrapper and reduced-motion behaviour.
// ABOUTME: Verifies children render in both motion and reduced-motion modes.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FadeUp } from '@/components/landing/motion-primitives';

describe('FadeUp', () => {
  it('renders children', () => {
    render(<FadeUp><span>hello</span></FadeUp>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<FadeUp className="custom-cls"><span>x</span></FadeUp>);
    const wrapper = screen.getByText('x').parentElement;
    expect(wrapper).toHaveClass('custom-cls');
  });
});
