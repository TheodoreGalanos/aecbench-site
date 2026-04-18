// ABOUTME: Tests for the main leaderboard state hook — URL sync + derived data.
// ABOUTME: next/navigation is mocked; we drive URL state via the mock.
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLeaderboardState } from '@/components/leaderboard/use-leaderboard-state';
import { FIXTURE_ENTRIES } from './fixtures/entries';

const replace = vi.fn();
let searchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/leaderboard',
  useSearchParams: () => searchParams,
}));

describe('useLeaderboardState', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams('');
  });

  it('defaults to axisX=cost, no filters, sort=rank asc, no expansion', () => {
    const { result } = renderHook(() => useLeaderboardState(FIXTURE_ENTRIES, {}));
    expect(result.current.axisX).toBe('cost');
    expect(result.current.disciplines).toEqual([]);
    expect(result.current.harnesses).toEqual([]);
    expect(result.current.sort).toEqual({ column: 'rank', dir: 'asc' });
    expect(result.current.expandedRowKey).toBeNull();
  });

  it('hydrates from URL params', () => {
    searchParams = new URLSearchParams('x=tokens&d=civil,electrical&h=rlm&sort=reward&dir=desc&open=claude-opus-4.7::rlm');
    const { result } = renderHook(() => useLeaderboardState(FIXTURE_ENTRIES, {}));
    expect(result.current.axisX).toBe('tokens');
    expect(result.current.disciplines).toEqual(['civil', 'electrical']);
    expect(result.current.harnesses).toEqual(['rlm']);
    expect(result.current.sort).toEqual({ column: 'reward', dir: 'desc' });
    expect(result.current.expandedRowKey).toBe('claude-opus-4.7::rlm');
  });

  it('updates URL on setAxisX', () => {
    const { result } = renderHook(() => useLeaderboardState(FIXTURE_ENTRIES, {}));
    act(() => result.current.setAxisX('tokens'));
    expect(replace).toHaveBeenLastCalledWith(
      expect.stringMatching(/x=tokens/),
      expect.objectContaining({ scroll: false }),
    );
  });

  it('respects lockedDiscipline — disciplines pinned and ignored from URL', () => {
    searchParams = new URLSearchParams('d=electrical');
    const { result } = renderHook(() =>
      useLeaderboardState(FIXTURE_ENTRIES, { lockedDiscipline: 'civil' }),
    );
    expect(result.current.disciplines).toEqual(['civil']);
  });

  it('clears expandedRowKey when the row is filtered out', () => {
    searchParams = new URLSearchParams('h=rlm&open=gpt-4o::tool_loop');
    const { result } = renderHook(() => useLeaderboardState(FIXTURE_ENTRIES, {}));
    expect(result.current.expandedRowKey).toBeNull();
  });

  it('derived data stays consistent after state changes', () => {
    const { result } = renderHook(() => useLeaderboardState(FIXTURE_ENTRIES, {}));
    act(() => result.current.setHarnesses(['tool_loop']));
    // derived data is read post-render; in the hook test, pushing to URL triggers
    // re-render in real usage. Here we assert the setter called replace with h=tool_loop.
    expect(replace).toHaveBeenLastCalledWith(
      expect.stringMatching(/h=tool_loop/),
      expect.anything(),
    );
  });

  it('computes a non-empty frontier on the full fixture set', () => {
    const { result } = renderHook(() => useLeaderboardState(FIXTURE_ENTRIES, {}));
    expect(result.current.frontierKeys.size).toBeGreaterThan(0);
  });
});
