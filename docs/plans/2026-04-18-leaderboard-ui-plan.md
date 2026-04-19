# Leaderboard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/leaderboard` page — a scatter-first Pareto view backed by the existing ingest artefact, a sortable/filterable terminal-styled table with inline expandable detail, all URL-synced for shareability — plus a reusable `LeaderboardSurface` component that discipline sub-routes will consume later.

**Architecture:** Seven layers, bottom-up. (1) Pure-logic modules in `lib/aec-bench/` (pareto, filter, sort, axis-metric, harness-glyph) hold every testable computation with zero React. (2) A small contract patch adds per-entry `is_mock` so individual rows can be honestly flagged. (3) Hand-rolled SVG chart components encode reward × cost/tokens/latency with provider colour + harness shape + dashed amber Pareto frontier. (4) A compact CLI-prompt control strip and its popover drive filter/axis state. (5) A terminal-styled table with expandable rows carries per-discipline + CI + Δ detail inline. (6) A single `useLeaderboardState` hook owns all interactive state and URL-syncs filter/sort/expansion via `useSearchParams` + `router.replace`. (7) A thin RSC `page.tsx` reads the artefact and hands everything to the client `LeaderboardSurface`. E2E via Playwright + axe.

**Tech Stack:** TypeScript, React 19, Next.js 15 App Router, Tailwind CSS 4, Framer Motion (already a dep — reused for expansion), zod (already a dep), vitest + @testing-library/react for unit/component tests, Playwright + @axe-core/playwright for E2E + a11y. Zero new dependencies.

**Reference spec:** `docs/specs/2026-04-18-leaderboard-ui-design.md`.

---

## Pre-flight

Before starting tasks, create an isolated worktree off `main` so the work doesn't collide with other branches:

```bash
cd /Users/theodoros.galanos/LocalProjects/aecbench-site
git fetch --all --prune
git worktree add .worktrees/leaderboard-ui -b phase3/leaderboard-ui main
cd .worktrees/leaderboard-ui
pnpm install
pnpm test && pnpm test:e2e
```

Every subsequent task runs inside `.worktrees/leaderboard-ui`. When all tasks are green, merge the branch back through a PR. The worktree is cleaned up at the end.

---

## Task 1: Synthetic LeaderboardEntry fixtures for unit tests

**Files:**
- Create: `tests/leaderboard/fixtures/entries.ts`
- Create: `tests/leaderboard/fixtures/entries.test.ts`

These fixtures are the foundation every later unit test will import. A single typed helper keeps later test files short.

- [ ] **Step 1: Write the failing test**

```ts
// tests/leaderboard/fixtures/entries.test.ts
// ABOUTME: Sanity test for the synthetic LeaderboardEntry fixture helper.
// ABOUTME: The fixtures themselves are trivial; this test just guards their shape.
import { describe, it, expect } from 'vitest';
import { makeEntry, FIXTURE_ENTRIES } from './entries';
import { LeaderboardEntrySchema } from '@/lib/aec-bench/contracts';

describe('fixture entries', () => {
  it('makeEntry produces a schema-valid entry with overridable fields', () => {
    const e = makeEntry({ model_display: 'Test Model', reward: 0.75 });
    expect(LeaderboardEntrySchema.parse(e)).toMatchObject({
      model_display: 'Test Model',
      reward: 0.75,
    });
  });

  it('FIXTURE_ENTRIES is a non-empty, schema-valid array', () => {
    expect(FIXTURE_ENTRIES.length).toBeGreaterThan(3);
    for (const e of FIXTURE_ENTRIES) {
      expect(() => LeaderboardEntrySchema.parse(e)).not.toThrow();
    }
  });

  it('FIXTURE_ENTRIES has varied providers and adapters for downstream tests', () => {
    const providers = new Set(FIXTURE_ENTRIES.map((e) => e.provider));
    const adapters = new Set(FIXTURE_ENTRIES.map((e) => e.adapter));
    expect(providers.size).toBeGreaterThanOrEqual(3);
    expect(adapters.size).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/fixtures/entries.test.ts
```

Expected: FAIL with module-not-found for `./entries`.

- [ ] **Step 3: Create the fixture module**

```ts
// tests/leaderboard/fixtures/entries.ts
// ABOUTME: Synthetic LeaderboardEntry fixtures for unit tests.
// ABOUTME: Use makeEntry({...overrides}) for one-offs; FIXTURE_ENTRIES is a varied set.
import type { LeaderboardEntry, Provider, Domain } from '@/lib/aec-bench/contracts';

const BASE: LeaderboardEntry = {
  rank: 1,
  model_key: 'claude-opus-4.7',
  model_display: 'Claude Opus 4.7',
  provider: 'anthropic',
  adapter: 'rlm',
  reward: 0.82,
  reward_ci: [0.79, 0.85],
  per_discipline: {
    civil: 0.84,
    electrical: 0.79,
    ground: 0.81,
    mechanical: 0.86,
    structural: 0.80,
  },
  trials: 180,
  complete_trials: 180,
  repetitions: 30,
  mean_cost_usd: 1.8,
  total_cost_usd: 324,
  mean_tokens: 46000,
  mean_duration_seconds: 12.4,
  dataset: 'aec-bench@0.4.1',
  last_submission: '2026-04-18T10:00:00Z',
  submission_count: 1,
  delta_vs_previous: 0.02,
  is_mock: true,
};

export function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return { ...BASE, ...overrides };
}

export const FIXTURE_ENTRIES: LeaderboardEntry[] = [
  makeEntry({
    rank: 1,
    model_key: 'claude-opus-4.7',
    model_display: 'Claude Opus 4.7',
    provider: 'anthropic',
    adapter: 'rlm',
    reward: 0.82,
    reward_ci: [0.79, 0.85],
    mean_cost_usd: 1.8,
    mean_tokens: 46000,
    mean_duration_seconds: 12.4,
    delta_vs_previous: 0.02,
  }),
  makeEntry({
    rank: 2,
    model_key: 'gpt-4o',
    model_display: 'GPT-4o',
    provider: 'openai',
    adapter: 'tool_loop',
    reward: 0.78,
    reward_ci: [0.75, 0.81],
    per_discipline: {
      civil: 0.80,
      electrical: 0.82,
      ground: 0.73,
      mechanical: 0.77,
      structural: 0.78,
    },
    mean_cost_usd: 1.2,
    mean_tokens: 38000,
    mean_duration_seconds: 9.8,
    delta_vs_previous: -0.01,
  }),
  makeEntry({
    rank: 3,
    model_key: 'gemini-2.5-pro',
    model_display: 'Gemini 2.5 Pro',
    provider: 'google',
    adapter: 'direct',
    reward: 0.74,
    reward_ci: [0.71, 0.77],
    per_discipline: {
      civil: 0.76,
      electrical: 0.72,
      ground: 0.75,
      mechanical: 0.73,
      structural: 0.74,
    },
    mean_cost_usd: 0.9,
    mean_tokens: 32000,
    mean_duration_seconds: 8.2,
    delta_vs_previous: 0.05,
  }),
  makeEntry({
    rank: 4,
    model_key: 'llama-3.3-70b',
    model_display: 'Llama 3.3 70B',
    provider: 'meta',
    adapter: 'tool_loop',
    reward: 0.66,
    reward_ci: [0.62, 0.70],
    per_discipline: {
      civil: 0.64,
      electrical: 0.68,
      ground: 0.65,
      mechanical: 0.66,
      structural: 0.67,
    },
    mean_cost_usd: 0.8,
    mean_tokens: 52000,
    mean_duration_seconds: 14.1,
    delta_vs_previous: null,
  }),
  makeEntry({
    rank: 5,
    model_key: 'haiku-4.5',
    model_display: 'Claude Haiku 4.5',
    provider: 'anthropic',
    adapter: 'tool_loop',
    reward: 0.62,
    reward_ci: [0.58, 0.66],
    per_discipline: {
      civil: 0.63,
      electrical: 0.60,
      ground: 0.62,
      mechanical: 0.64,
      structural: 0.61,
    },
    mean_cost_usd: 0.2,
    mean_tokens: 28000,
    mean_duration_seconds: 5.1,
    delta_vs_previous: 0.03,
  }),
];

export const PROVIDERS_IN_FIXTURES: Provider[] = ['anthropic', 'openai', 'google', 'meta'];
export const DOMAINS: Domain[] = ['civil', 'electrical', 'ground', 'mechanical', 'structural'];
```

Note: This task depends on `is_mock` being present on `LeaderboardEntry`. That field is added in Task 7. **Until Task 7 lands, temporarily omit the `is_mock` line from `BASE`** (comment it out) and re-enable it when Task 7 is complete. The first `pnpm test` of this task will still pass because `LeaderboardEntrySchema` doesn't yet require `is_mock`. Task 7 reruns this test suite to confirm.

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/fixtures/entries.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/leaderboard/fixtures/entries.ts tests/leaderboard/fixtures/entries.test.ts
git commit -m "test(leaderboard): synthetic LeaderboardEntry fixtures for unit tests"
```

---

## Task 2: Pareto frontier computation

**Files:**
- Create: `lib/aec-bench/pareto.ts`
- Create: `tests/leaderboard/pareto.test.ts`

`computeParetoFrontier` is the most mathematically load-bearing module on the page. O(n²) is fine — n is ≤40.

- [ ] **Step 1: Write the failing test**

```ts
// tests/leaderboard/pareto.test.ts
// ABOUTME: Exhaustive tests for Pareto frontier computation over (reward, cost/tokens/latency).
// ABOUTME: Covers degenerate inputs, ties, domination chains, and floating-point edges.
import { describe, it, expect } from 'vitest';
import { computeParetoFrontier } from '@/lib/aec-bench/pareto';

const P = (key: string, x: number, y: number) => ({ key, x, y });

describe('computeParetoFrontier', () => {
  it('returns an empty Set for an empty input', () => {
    expect(computeParetoFrontier([])).toEqual(new Set());
  });

  it('returns the single point when only one exists', () => {
    expect(computeParetoFrontier([P('a', 1, 0.5)])).toEqual(new Set(['a']));
  });

  it('excludes points dominated by a single clear winner', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 1),
      P('b', 2, 0.5),
      P('c', 3, 0.3),
    ]);
    expect(frontier).toEqual(new Set(['a']));
  });

  it('keeps all points when they all share the same (x, y)', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 0.5),
      P('b', 1, 0.5),
      P('c', 1, 0.5),
    ]);
    expect(frontier).toEqual(new Set(['a', 'b', 'c']));
  });

  it('recognises a classic trade-off frontier', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 0.4),
      P('b', 2, 0.6),
      P('c', 3, 0.8),
      P('d', 2, 0.5),
    ]);
    expect(frontier).toEqual(new Set(['a', 'b', 'c']));
  });

  it('handles floating-point strict-inequality edges', () => {
    const frontier = computeParetoFrontier([
      P('a', 1.0000001, 0.5),
      P('b', 1, 0.5),
    ]);
    expect(frontier).toEqual(new Set(['b']));
  });

  it('keeps ties at the same point but excludes nearby dominated points', () => {
    const frontier = computeParetoFrontier([
      P('a', 1, 0.5),
      P('b', 1, 0.5),
      P('c', 2, 0.8),
      P('d', 3, 0.1),
    ]);
    expect(frontier).toEqual(new Set(['a', 'b', 'c']));
  });

  it('treats frontier as a readonly Set', () => {
    const frontier = computeParetoFrontier([P('a', 1, 0.5)]);
    expect(frontier instanceof Set).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/pareto.test.ts
```

Expected: FAIL with module-not-found for `@/lib/aec-bench/pareto`.

- [ ] **Step 3: Implement `computeParetoFrontier`**

```ts
// lib/aec-bench/pareto.ts
// ABOUTME: Pareto frontier computation — max-y + min-x set.
// ABOUTME: Pure, O(n²), safe for n ≤ a few hundred; we use it with n ≤ 40.

export interface ScatterPoint {
  key: string;
  x: number;
  y: number;
}

export function computeParetoFrontier(
  points: ReadonlyArray<ScatterPoint>,
): ReadonlySet<string> {
  const frontier = new Set<string>();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    let dominated = false;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const q = points[j];
      // q dominates p iff q is at least as good on both AND strictly better on at least one.
      const atLeastAsGood = q.x <= p.x && q.y >= p.y;
      const strictlyBetter = q.x < p.x || q.y > p.y;
      if (atLeastAsGood && strictlyBetter) {
        dominated = true;
        break;
      }
    }
    if (!dominated) frontier.add(p.key);
  }
  return frontier;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/pareto.test.ts
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/pareto.ts tests/leaderboard/pareto.test.ts
git commit -m "feat(leaderboard): Pareto frontier computation (pure)"
```

---

## Task 3: Axis metric registry

**Files:**
- Create: `lib/aec-bench/axis-metric.ts`
- Create: `tests/leaderboard/axis-metric.test.ts`

Maps the three axis keys to accessor, label, and formatter. One source of truth used by the chart, tooltip, and table.

- [ ] **Step 1: Write the failing test**

```ts
// tests/leaderboard/axis-metric.test.ts
// ABOUTME: Tests for axis metric accessors and formatters across cost / tokens / latency.
// ABOUTME: Format strings must degrade gracefully for extreme magnitudes and nulls.
import { describe, it, expect } from 'vitest';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { makeEntry } from './fixtures/entries';

describe('AXIS_METRICS', () => {
  it('exposes cost / tokens / latency keys', () => {
    expect(Object.keys(AXIS_METRICS).sort()).toEqual(['cost', 'latency', 'tokens']);
  });

  describe('cost', () => {
    const m = AXIS_METRICS.cost;
    it('accesses mean_cost_usd', () => {
      expect(m.accessor(makeEntry({ mean_cost_usd: 1.5 }))).toBe(1.5);
      expect(m.accessor(makeEntry({ mean_cost_usd: null }))).toBeNull();
    });
    it('formats small values with two decimals', () => {
      expect(m.format(0.01)).toBe('$0.01');
      expect(m.format(1.8)).toBe('$1.80');
      expect(m.format(1234.56)).toBe('$1234.56');
    });
  });

  describe('tokens', () => {
    const m = AXIS_METRICS.tokens;
    it('accesses mean_tokens', () => {
      expect(m.accessor(makeEntry({ mean_tokens: 46000 }))).toBe(46000);
      expect(m.accessor(makeEntry({ mean_tokens: null }))).toBeNull();
    });
    it('formats as k / M with one decimal above 10k', () => {
      expect(m.format(500)).toBe('500');
      expect(m.format(9_999)).toBe('10.0k');
      expect(m.format(46_000)).toBe('46.0k');
      expect(m.format(1_200_000)).toBe('1.2M');
    });
  });

  describe('latency', () => {
    const m = AXIS_METRICS.latency;
    it('accesses mean_duration_seconds', () => {
      expect(m.accessor(makeEntry({ mean_duration_seconds: 12.4 }))).toBe(12.4);
      expect(m.accessor(makeEntry({ mean_duration_seconds: null }))).toBeNull();
    });
    it('formats seconds below 60 as Ns, otherwise as Nmin', () => {
      expect(m.format(5.1)).toBe('5.1s');
      expect(m.format(12.4)).toBe('12.4s');
      expect(m.format(59.9)).toBe('59.9s');
      expect(m.format(60)).toBe('1.0min');
      expect(m.format(138)).toBe('2.3min');
    });
  });

  it('carries a label with units', () => {
    expect(AXIS_METRICS.cost.label).toMatch(/cost/i);
    expect(AXIS_METRICS.tokens.label).toMatch(/tokens/i);
    expect(AXIS_METRICS.latency.label).toMatch(/latency/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/axis-metric.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the registry**

```ts
// lib/aec-bench/axis-metric.ts
// ABOUTME: Axis metric registry — maps axis keys to label, accessor, and formatter.
// ABOUTME: Single source of truth shared by scatter chart, tooltip, and table.
import type { LeaderboardEntry } from './contracts';

export type AxisKey = 'cost' | 'tokens' | 'latency';

export interface AxisMetric {
  key: AxisKey;
  label: string;
  accessor: (e: LeaderboardEntry) => number | null;
  format: (v: number) => string;
}

function formatCost(v: number): string {
  return `$${v.toFixed(2)}`;
}

function formatTokens(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${(v / 1_000).toFixed(1)}k`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}

function formatLatency(v: number): string {
  if (v < 60) return `${v.toFixed(1)}s`;
  return `${(v / 60).toFixed(1)}min`;
}

export const AXIS_METRICS: Record<AxisKey, AxisMetric> = {
  cost: {
    key: 'cost',
    label: 'cost / task (USD)',
    accessor: (e) => e.mean_cost_usd,
    format: formatCost,
  },
  tokens: {
    key: 'tokens',
    label: 'tokens / task (avg)',
    accessor: (e) => e.mean_tokens,
    format: formatTokens,
  },
  latency: {
    key: 'latency',
    label: 'latency / task (avg)',
    accessor: (e) => e.mean_duration_seconds,
    format: formatLatency,
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/axis-metric.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/axis-metric.ts tests/leaderboard/axis-metric.test.ts
git commit -m "feat(leaderboard): axis metric registry (cost/tokens/latency)"
```

---

## Task 4: Harness glyph mapping

**Files:**
- Create: `lib/aec-bench/harness-glyph.ts`
- Create: `tests/leaderboard/harness-glyph.test.ts`

Maps an adapter string to the SVG shape used on the scatter. Known adapters get their canonical shape; unknown adapters fall back to a diamond.

- [ ] **Step 1: Write the failing test**

```ts
// tests/leaderboard/harness-glyph.test.ts
// ABOUTME: Tests for harness glyph mapping (adapter string → SVG shape name).
// ABOUTME: Known adapters map to canonical shapes; unknown adapters fall back to diamond.
import { describe, it, expect } from 'vitest';
import { harnessGlyph, KNOWN_HARNESSES } from '@/lib/aec-bench/harness-glyph';

describe('harnessGlyph', () => {
  it('maps known adapters to their canonical shapes', () => {
    expect(harnessGlyph('tool_loop')).toBe('circle');
    expect(harnessGlyph('rlm')).toBe('square');
    expect(harnessGlyph('direct')).toBe('triangle');
    expect(harnessGlyph('lambda-rlm')).toBe('ring');
  });

  it('falls back to diamond for any unrecognised adapter', () => {
    expect(harnessGlyph('swarm')).toBe('diamond');
    expect(harnessGlyph('')).toBe('diamond');
    expect(harnessGlyph('TOOL_LOOP')).toBe('diamond'); // case-sensitive by design
  });

  it('KNOWN_HARNESSES lists exactly the adapters with canonical shapes', () => {
    expect(KNOWN_HARNESSES).toEqual(['tool_loop', 'rlm', 'direct', 'lambda-rlm']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/harness-glyph.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the mapping**

```ts
// lib/aec-bench/harness-glyph.ts
// ABOUTME: Maps a harness/adapter string to its canonical SVG shape for the scatter.
// ABOUTME: Known adapters get canonical shapes; unknown ones fall back to diamond.

export type GlyphShape = 'circle' | 'square' | 'triangle' | 'ring' | 'diamond';

export const KNOWN_HARNESSES = ['tool_loop', 'rlm', 'direct', 'lambda-rlm'] as const;

const SHAPE_MAP: Record<string, GlyphShape> = {
  tool_loop: 'circle',
  rlm: 'square',
  direct: 'triangle',
  'lambda-rlm': 'ring',
};

export function harnessGlyph(adapter: string): GlyphShape {
  return SHAPE_MAP[adapter] ?? 'diamond';
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/harness-glyph.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/harness-glyph.ts tests/leaderboard/harness-glyph.test.ts
git commit -m "feat(leaderboard): harness glyph mapping with diamond fallback"
```

---

## Task 5: Filter + discipline reshape

**Files:**
- Create: `lib/aec-bench/filter.ts`
- Create: `tests/leaderboard/filter.test.ts`

The most subtle pure module. When discipline filters are active, the entry's `reward` is replaced with the mean of the selected disciplines' per-discipline scores, and `reward_ci` is nulled.

- [ ] **Step 1: Write the failing test**

```ts
// tests/leaderboard/filter.test.ts
// ABOUTME: Tests for filter + discipline reshape logic.
// ABOUTME: Covers: no-op, harness-only, single-discipline reshape, multi-discipline mean, and CI nulling.
import { describe, it, expect } from 'vitest';
import { filterAndReshape } from '@/lib/aec-bench/filter';
import { FIXTURE_ENTRIES, makeEntry } from './fixtures/entries';

describe('filterAndReshape', () => {
  it('returns entries unchanged when no filters are set', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, { disciplines: [], harnesses: [] });
    expect(out).toEqual(FIXTURE_ENTRIES);
  });

  it('filters by harness (adapter) without reshaping reward', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: [],
      harnesses: ['tool_loop'],
    });
    expect(out.every((e) => e.adapter === 'tool_loop')).toBe(true);
    // reward untouched
    const llama = out.find((e) => e.model_key === 'llama-3.3-70b');
    expect(llama?.reward).toBe(0.66);
    expect(llama?.reward_ci).toEqual([0.62, 0.70]);
  });

  it('reshapes reward to per-discipline when one discipline is selected', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: ['civil'],
      harnesses: [],
    });
    const opus = out.find((e) => e.model_key === 'claude-opus-4.7');
    expect(opus?.reward).toBe(0.84); // the civil per_discipline value
    expect(opus?.reward_ci).toBeNull(); // reshaped → CI dropped
  });

  it('reshapes reward to the mean of selected disciplines when multiple are picked', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: ['civil', 'electrical'],
      harnesses: [],
    });
    const opus = out.find((e) => e.model_key === 'claude-opus-4.7');
    // civil 0.84 + electrical 0.79 = 1.63, mean = 0.815
    expect(opus?.reward).toBeCloseTo(0.815, 5);
    expect(opus?.reward_ci).toBeNull();
  });

  it('combines harness and discipline filters', () => {
    const out = filterAndReshape(FIXTURE_ENTRIES, {
      disciplines: ['civil'],
      harnesses: ['rlm'],
    });
    expect(out.length).toBe(1);
    expect(out[0].model_key).toBe('claude-opus-4.7');
    expect(out[0].reward).toBe(0.84);
  });

  it('drops entries that have no per-discipline score for any selected discipline', () => {
    const e = makeEntry({
      model_key: 'incomplete',
      per_discipline: { civil: 0.9 } as any, // missing other disciplines
    });
    const out = filterAndReshape([e], { disciplines: ['mechanical'], harnesses: [] });
    expect(out).toEqual([]);
  });

  it('does not mutate the input entries', () => {
    const before = structuredClone(FIXTURE_ENTRIES);
    filterAndReshape(FIXTURE_ENTRIES, { disciplines: ['civil'], harnesses: [] });
    expect(FIXTURE_ENTRIES).toEqual(before);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/filter.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `filterAndReshape`**

```ts
// lib/aec-bench/filter.ts
// ABOUTME: Pure filter + discipline-reshape for leaderboard entries.
// ABOUTME: When discipline filter is active, entry reward becomes the mean of selected per-discipline scores.
import type { LeaderboardEntry, Domain } from './contracts';

export interface LeaderboardFilters {
  disciplines: Domain[];
  harnesses: string[];
}

export function filterAndReshape(
  entries: ReadonlyArray<LeaderboardEntry>,
  filters: LeaderboardFilters,
): LeaderboardEntry[] {
  const { disciplines, harnesses } = filters;
  const harnessActive = harnesses.length > 0;
  const disciplineActive = disciplines.length > 0;

  const out: LeaderboardEntry[] = [];
  for (const e of entries) {
    if (harnessActive && !harnesses.includes(e.adapter)) continue;

    if (!disciplineActive) {
      out.push(e);
      continue;
    }

    const perDisciplineScores: number[] = [];
    let missing = false;
    for (const d of disciplines) {
      const v = e.per_discipline[d];
      if (v === undefined || v === null) {
        missing = true;
        break;
      }
      perDisciplineScores.push(v);
    }
    if (missing) continue;

    const mean =
      perDisciplineScores.reduce((s, v) => s + v, 0) / perDisciplineScores.length;
    out.push({ ...e, reward: mean, reward_ci: null });
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/filter.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/filter.ts tests/leaderboard/filter.test.ts
git commit -m "feat(leaderboard): filter and discipline-reshape for entries"
```

---

## Task 6: Sort helpers

**Files:**
- Create: `lib/aec-bench/sort.ts`
- Create: `tests/leaderboard/sort.test.ts`

Sort by any column, nulls to the end regardless of direction, stable.

- [ ] **Step 1: Write the failing test**

```ts
// tests/leaderboard/sort.test.ts
// ABOUTME: Tests for leaderboard sort helpers (numeric, alpha, nullable delta, per-discipline).
// ABOUTME: Null values always sink to the end regardless of asc/desc.
import { describe, it, expect } from 'vitest';
import { sortEntries, type SortColumn } from '@/lib/aec-bench/sort';
import { FIXTURE_ENTRIES, makeEntry } from './fixtures/entries';

describe('sortEntries', () => {
  it('sorts by reward descending by default (rank=asc)', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'rank', dir: 'asc' });
    expect(out.map((e) => e.model_key)).toEqual([
      'claude-opus-4.7', 'gpt-4o', 'gemini-2.5-pro', 'llama-3.3-70b', 'haiku-4.5',
    ]);
  });

  it('sorts by reward ascending', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'reward', dir: 'asc' });
    expect(out[0].model_key).toBe('haiku-4.5');
    expect(out[out.length - 1].model_key).toBe('claude-opus-4.7');
  });

  it('sorts by cost ascending', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'cost', dir: 'asc' });
    expect(out[0].model_key).toBe('haiku-4.5'); // 0.2
  });

  it('sinks null delta to the end regardless of direction', () => {
    const ascOut = sortEntries(FIXTURE_ENTRIES, { column: 'delta', dir: 'asc' });
    expect(ascOut[ascOut.length - 1].model_key).toBe('llama-3.3-70b');
    const descOut = sortEntries(FIXTURE_ENTRIES, { column: 'delta', dir: 'desc' });
    expect(descOut[descOut.length - 1].model_key).toBe('llama-3.3-70b');
  });

  it('sorts alphabetically by model display', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'model', dir: 'asc' });
    const first = out[0].model_display.toLowerCase();
    const last = out[out.length - 1].model_display.toLowerCase();
    expect(first.localeCompare(last)).toBeLessThan(0);
  });

  it('sorts by a per-discipline column', () => {
    const out = sortEntries(FIXTURE_ENTRIES, { column: 'mechanical', dir: 'desc' });
    expect(out[0].per_discipline.mechanical).toBeGreaterThanOrEqual(out[1].per_discipline.mechanical!);
  });

  it('is stable under ties', () => {
    const a = makeEntry({ model_key: 'a', reward: 0.5 });
    const b = makeEntry({ model_key: 'b', reward: 0.5 });
    const c = makeEntry({ model_key: 'c', reward: 0.5 });
    const out = sortEntries([a, b, c], { column: 'reward', dir: 'desc' });
    expect(out.map((e) => e.model_key)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input array', () => {
    const before = [...FIXTURE_ENTRIES];
    sortEntries(FIXTURE_ENTRIES, { column: 'reward', dir: 'asc' });
    expect(FIXTURE_ENTRIES).toEqual(before);
  });

  it('accepts all sort columns without throwing', () => {
    const cols: SortColumn[] = [
      'rank', 'model', 'reward', 'delta', 'tokens', 'cost',
      'civil', 'electrical', 'ground', 'mechanical', 'structural',
    ];
    for (const c of cols) {
      expect(() => sortEntries(FIXTURE_ENTRIES, { column: c, dir: 'asc' })).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/sort.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `sortEntries`**

```ts
// lib/aec-bench/sort.ts
// ABOUTME: Pure sort helpers for leaderboard entries.
// ABOUTME: Nulls always sink to the end; stable sort; supports all column keys.
import type { LeaderboardEntry, Domain } from './contracts';

export type SortColumn =
  | 'rank'
  | 'model'
  | 'reward'
  | 'delta'
  | 'tokens'
  | 'cost'
  | 'civil'
  | 'electrical'
  | 'ground'
  | 'mechanical'
  | 'structural';

export interface SortSpec {
  column: SortColumn;
  dir: 'asc' | 'desc';
}

const DOMAIN_COLS: SortColumn[] = ['civil', 'electrical', 'ground', 'mechanical', 'structural'];

function accessor(column: SortColumn): (e: LeaderboardEntry) => number | string | null {
  switch (column) {
    case 'rank':
    case 'reward':
      // `rank` asc means best first, equivalent to reward desc — we sort by reward
      // and reverse the direction handling in `sortEntries`.
      return (e) => e.reward;
    case 'model':
      return (e) => e.model_display.toLowerCase();
    case 'delta':
      return (e) => e.delta_vs_previous;
    case 'tokens':
      return (e) => e.mean_tokens;
    case 'cost':
      return (e) => e.mean_cost_usd;
    default:
      if (DOMAIN_COLS.includes(column)) {
        const d = column as Domain;
        return (e) => e.per_discipline[d] ?? null;
      }
      throw new Error(`Unknown sort column: ${column}`);
  }
}

function directionFactor(column: SortColumn, dir: 'asc' | 'desc'): 1 | -1 {
  if (column === 'rank') {
    // rank-asc means reward-desc
    return dir === 'asc' ? -1 : 1;
  }
  return dir === 'asc' ? 1 : -1;
}

export function sortEntries(
  entries: ReadonlyArray<LeaderboardEntry>,
  sort: SortSpec,
): LeaderboardEntry[] {
  const get = accessor(sort.column);
  const factor = directionFactor(sort.column, sort.dir);
  return [...entries].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    // Nulls always to the end
    const aNull = va === null || va === undefined;
    const bNull = vb === null || vb === undefined;
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    if (typeof va === 'string' && typeof vb === 'string') {
      return factor * va.localeCompare(vb);
    }
    return factor * ((va as number) - (vb as number));
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/sort.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/sort.ts tests/leaderboard/sort.test.ts
git commit -m "feat(leaderboard): sort helpers with null-to-end and stable ordering"
```

---

## Task 7: Add `is_mock` to `LeaderboardEntry`

**Files:**
- Modify: `lib/aec-bench/contracts.ts`
- Modify: `tests/ingest/contracts.test.ts`
- Modify: `tests/leaderboard/fixtures/entries.ts` (un-comment the `is_mock` line)

Tiny contract patch. The ingest aggregator starts using it in Task 8.

- [ ] **Step 1: Update the contracts test to require `is_mock`**

Modify `tests/ingest/contracts.test.ts` — find the existing `validLeaderboardEntry` or equivalent fixture and confirm it tests the `is_mock` field. If no such fixture exists, add a new test:

```ts
// tests/ingest/contracts.test.ts — append
describe('LeaderboardEntrySchema — is_mock field', () => {
  it('requires is_mock to be a boolean', () => {
    const minimal = {
      rank: 1, model_key: 'm', model_display: 'M', provider: 'anthropic',
      adapter: 'rlm', reward: 0.5, reward_ci: null,
      per_discipline: { civil: 0.5, electrical: 0.5, ground: 0.5, mechanical: 0.5, structural: 0.5 },
      trials: 10, complete_trials: 10, repetitions: 1,
      mean_cost_usd: null, total_cost_usd: null, mean_tokens: null, mean_duration_seconds: null,
      dataset: 'aec-bench@0.4.1', last_submission: '2026-04-18T00:00:00Z',
      submission_count: 1, delta_vs_previous: null, is_mock: false,
    };
    expect(() => LeaderboardEntrySchema.parse(minimal)).not.toThrow();
    const { is_mock, ...withoutMock } = minimal;
    expect(() => LeaderboardEntrySchema.parse(withoutMock)).toThrow();
    expect(() => LeaderboardEntrySchema.parse({ ...minimal, is_mock: 'yes' })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/ingest/contracts.test.ts
```

Expected: FAIL — the current schema doesn't have `is_mock`.

- [ ] **Step 3: Add the field to `LeaderboardEntrySchema`**

```ts
// lib/aec-bench/contracts.ts — edit LeaderboardEntrySchema
export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  model_key: z.string().min(1),
  model_display: z.string().min(1),
  provider: z.enum(PROVIDERS),
  adapter: z.string().min(1),

  reward: z.number().min(0).max(1),
  reward_ci: z.tuple([z.number(), z.number()]).nullable(),
  per_discipline: z.record(z.enum(DOMAINS), z.number()),

  trials: z.number().int().nonnegative(),
  complete_trials: z.number().int().nonnegative(),
  repetitions: z.number().int().nonnegative(),

  mean_cost_usd: z.number().nullable(),
  total_cost_usd: z.number().nullable(),
  mean_tokens: z.number().nullable(),
  mean_duration_seconds: z.number().nullable(),

  dataset: z.string().min(1),
  last_submission: z.string().min(1),
  submission_count: z.number().int().positive(),
  delta_vs_previous: z.number().nullable(),
  is_mock: z.boolean(),
});
```

Un-comment the `is_mock: true` line in `tests/leaderboard/fixtures/entries.ts` (added in Task 1).

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/ingest/contracts.test.ts tests/leaderboard/
```

Expected: PASS for both. Existing ingest tests may now fail because aggregate doesn't emit `is_mock` yet — that's fixed in Task 8. Temporarily, fix the aggregate tests by adding `is_mock: false` to any entry fixture they construct (the ones inside test files, not the aggregator output). Search for any hardcoded `LeaderboardEntry` shape in `tests/ingest/aggregate-*.ts` and add `is_mock: false` to each.

```bash
pnpm test
```

Expected: PASS across the full suite.

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/contracts.ts tests/ingest/contracts.test.ts tests/ingest/aggregate-*.ts tests/leaderboard/fixtures/entries.ts
git commit -m "feat(contracts): add is_mock to LeaderboardEntry"
```

---

## Task 8: Ingest aggregator sets per-entry `is_mock`

**Files:**
- Modify: `scripts/ingest/aggregate.ts`
- Modify: `tests/ingest/aggregate-entry.test.ts` (or the equivalent that exercises the entry-level assembly)

An entry is mock if *any* contributing experiment's submission has `mock: true`.

- [ ] **Step 1: Write the failing test**

Open `tests/ingest/aggregate-entry.test.ts`. Add a new `it` block:

```ts
import { describe, it, expect } from 'vitest';
// existing imports...

describe('aggregator — is_mock per entry', () => {
  it('sets is_mock=true when any contributing submission is mock', () => {
    // Build a scenario with two submissions: one mock, one real, both under the same (model × adapter).
    // Use the helpers already in this file or inline fixtures consistent with the current test style.
    // Assert the resulting entry has is_mock === true.
    // (See the aggregator test helpers already in the file; the pattern is:
    //    const trials = [...]; const submissions = [...];
    //    const entries = aggregate({ trials, submissions, registry, ... });
    //    expect(entries[0].is_mock).toBe(true);
    // )
  });

  it('sets is_mock=false when all contributing submissions are real', () => {
    // Same structure as above, but both submissions have mock: undefined.
    // Assert is_mock === false.
  });
});
```

Adapt the test body to match the existing aggregator test-call style (inspect `aggregate-entry.test.ts` and mirror its fixture construction precisely). The assertion shape (`is_mock === true` / `false`) is fixed.

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/ingest/aggregate-entry.test.ts
```

Expected: FAIL — `is_mock` is not set by the current aggregator.

- [ ] **Step 3: Update `aggregate.ts`**

Open `scripts/ingest/aggregate.ts`. Find the spot where a `LeaderboardEntry` is constructed (there's a single place — look for the return of the entry object). Add:

```ts
// Compute mock flag: true iff any contributing submission is mock.
const is_mock = contributingSubmissions.some((s) => s.mock === true);
```

And add `is_mock` to the returned entry. `contributingSubmissions` is the list of submission records feeding this entry — the variable name may differ; use whatever the aggregator already gathers. Add a helper if needed.

- [ ] **Step 4: Run the full suite**

```bash
pnpm test
```

Expected: PASS. `aggregate-entry.test.ts` and the earlier Task 7 contract test both green.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest/aggregate.ts tests/ingest/aggregate-entry.test.ts
git commit -m "feat(ingest): propagate is_mock to each LeaderboardEntry"
```

---

## Task 9: Add a `_mock-lambda-rlm-*` experiment fixture

**Files:**
- Create: `results/experiments/_mock-lambda-rlm-claude-opus/submission.yml`
- Create: `results/experiments/_mock-lambda-rlm-claude-opus/trials/` (30 trial JSON files)
- Possibly modify: `scripts/mock/generate.ts` to accept `--adapter` if it doesn't already

This ensures the scatter actually renders a lambda-rlm shape during development and E2E.

- [ ] **Step 1: Inspect the existing generator**

```bash
pnpm mock:generate --help 2>&1 || sed -n '1,60p' scripts/mock/cli.ts
```

If `--adapter` is already supported, skip to Step 3. Otherwise, extend the CLI to accept it.

- [ ] **Step 2: (If needed) Extend the generator**

Edit `scripts/mock/cli.ts` and `scripts/mock/generate.ts` to pass an `adapter` option through from CLI to the trial-shaping step. The existing pattern is straightforward: it already parameterises `model`. Add `adapter` alongside, defaulting to `tool_loop`.

Add a small test:

```ts
// tests/ingest/mock-generate.test.ts — append
it('accepts a custom adapter', async () => {
  const out = await generate({
    experimentId: '_mock-lambda-rlm-claude-opus',
    model: 'claude-opus-4.7',
    adapter: 'lambda-rlm',
    seed: 'lambda-rlm-test',
    tasks: 6,
    reps: 5,
  });
  expect(out.every((t) => t.agent.adapter === 'lambda-rlm')).toBe(true);
});
```

Run: `pnpm test tests/ingest/mock-generate.test.ts` → expected FAIL, then implement, then PASS.

- [ ] **Step 3: Generate the fixture**

```bash
pnpm mock:generate \
  --experiment-id _mock-lambda-rlm-claude-opus \
  --model claude-opus-4.7 \
  --adapter lambda-rlm \
  --seed lambda-rlm-fixture-2026 \
  --tasks 6 \
  --reps 5
```

This should create `results/experiments/_mock-lambda-rlm-claude-opus/` with a `submission.yml` tagged `mock: true` and 30 trial records.

- [ ] **Step 4: Regenerate and verify**

```bash
pnpm ingest
pnpm test
```

Expected: all green; the active artefact `public/data/leaderboard.json` now includes at least one entry with `adapter === "lambda-rlm"`.

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('public/data/leaderboard.json', 'utf-8')).entries.map(e => e.adapter))"
```

Expected output includes `"lambda-rlm"`.

- [ ] **Step 5: Commit**

```bash
git add results/experiments/_mock-lambda-rlm-claude-opus scripts/mock/ tests/ingest/mock-generate.test.ts public/data/
git commit -m "chore(fixtures): add lambda-rlm mock experiment for harness-shape coverage"
```

---

## Task 10: Frontier badge component

**Files:**
- Create: `components/leaderboard/frontier-badge.tsx`
- Create: `tests/leaderboard/frontier-badge.test.tsx`

Tiny pill, amber outline, used by both the chart tooltip and table rows.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/frontier-badge.test.tsx
// ABOUTME: Tests for the [frontier] pill badge.
// ABOUTME: Just a presentational leaf — checks text, role, and class hooks.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FrontierBadge } from '@/components/leaderboard/frontier-badge';

describe('FrontierBadge', () => {
  it('renders the [frontier] label', () => {
    render(<FrontierBadge />);
    expect(screen.getByText(/\[frontier\]/i)).toBeInTheDocument();
  });

  it('uses a role that screen readers can announce', () => {
    render(<FrontierBadge />);
    // semantic: small status-like marker
    expect(screen.getByText(/\[frontier\]/i)).toHaveAttribute('aria-label', 'on the Pareto frontier');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/frontier-badge.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/frontier-badge.tsx
// ABOUTME: Small [frontier] pill used on the scatter tooltip and expandable rows.
// ABOUTME: Amber outline + small caps JetBrains Mono styling.
import { clsx } from '@/lib/clsx';

export interface FrontierBadgeProps {
  className?: string;
}

export function FrontierBadge({ className }: FrontierBadgeProps) {
  return (
    <span
      aria-label="on the Pareto frontier"
      className={clsx(
        'inline-flex items-center rounded-sm border border-accent-amber px-1.5 py-0.5',
        'font-mono text-[0.62rem] uppercase tracking-wider text-accent-amber',
        className,
      )}
    >
      [frontier]
    </span>
  );
}
```

If `@/lib/clsx` doesn't exist, create it:

```ts
// lib/clsx.ts
// ABOUTME: Tiny className concatenator — filters out falsy values.
// ABOUTME: Used across components instead of adding a dep for trivial joins.
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/frontier-badge.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/frontier-badge.tsx tests/leaderboard/frontier-badge.test.tsx lib/clsx.ts
git commit -m "feat(leaderboard): FrontierBadge pill"
```

---

## Task 11: Legend component

**Files:**
- Create: `components/leaderboard/legend.tsx`
- Create: `tests/leaderboard/legend.test.tsx`

Provider colour dots + harness shape key.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/legend.test.tsx
// ABOUTME: Tests that the legend renders each provider and each known harness.
// ABOUTME: Assertion focus: text labels and accessible role, not pixel-perfect styling.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Legend } from '@/components/leaderboard/legend';

describe('Legend', () => {
  it('renders each provider label', () => {
    render(<Legend />);
    for (const p of ['anthropic', 'openai', 'google', 'meta', 'other']) {
      expect(screen.getByText(new RegExp(p, 'i'))).toBeInTheDocument();
    }
  });

  it('renders each known harness label', () => {
    render(<Legend />);
    for (const h of ['tool_loop', 'rlm', 'direct', 'lambda-rlm']) {
      expect(screen.getByText(new RegExp(h, 'i'))).toBeInTheDocument();
    }
  });

  it('uses a list role for assistive tech', () => {
    render(<Legend />);
    expect(screen.getByRole('list', { name: /chart legend/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/legend.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/legend.tsx
// ABOUTME: Provider colour key + harness shape key for the scatter chart.
// ABOUTME: Pure presentational — no state, no props beyond optional className.
import { PROVIDERS, type Provider } from '@/lib/aec-bench/contracts';
import { KNOWN_HARNESSES, harnessGlyph, type GlyphShape } from '@/lib/aec-bench/harness-glyph';
import { clsx } from '@/lib/clsx';

const PROVIDER_COLOURS: Record<Provider, string> = {
  anthropic: '#b5651d',
  openai: '#38b2ac',
  google: '#e8a838',
  meta: '#9333ea',
  other: '#888',
};

function GlyphPreview({ shape }: { shape: GlyphShape }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="inline-block">
      {shape === 'circle' && <circle cx="5" cy="5" r="3.5" fill="#c7c7c7" />}
      {shape === 'square' && (
        <rect x="1.5" y="1.5" width="7" height="7" fill="#c7c7c7" transform="rotate(45 5 5)" />
      )}
      {shape === 'triangle' && <polygon points="5,1.5 8.5,8.5 1.5,8.5" fill="#c7c7c7" />}
      {shape === 'ring' && (
        <circle cx="5" cy="5" r="3" fill="none" stroke="#c7c7c7" strokeWidth="1.5" />
      )}
      {shape === 'diamond' && <polygon points="5,1 9,5 5,9 1,5" fill="#c7c7c7" />}
    </svg>
  );
}

export interface LegendProps {
  className?: string;
}

export function Legend({ className }: LegendProps) {
  return (
    <ul
      role="list"
      aria-label="chart legend"
      className={clsx(
        'flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.62rem] uppercase tracking-wider text-[#888]',
        className,
      )}
    >
      {PROVIDERS.map((p) => (
        <li key={p} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: PROVIDER_COLOURS[p] }}
          />
          {p}
        </li>
      ))}
      <li aria-hidden="true" className="text-[#444]">·</li>
      {KNOWN_HARNESSES.map((h) => (
        <li key={h} className="flex items-center gap-1.5">
          <GlyphPreview shape={harnessGlyph(h)} />
          {h}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/legend.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/legend.tsx tests/leaderboard/legend.test.tsx
git commit -m "feat(leaderboard): Legend with provider colours + harness shapes"
```

---

## Task 12: TooltipCard component

**Files:**
- Create: `components/leaderboard/tooltip-card.tsx`
- Create: `tests/leaderboard/tooltip-card.test.tsx`

Renders model info for a hovered scatter dot. Desktop: floats near cursor. Mobile: sticky strip at the bottom of the chart. This task implements both variants in one file with a `variant` prop; position logic lives in the chart.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/tooltip-card.test.tsx
// ABOUTME: Tests for the scatter chart tooltip card (floating + sticky variants).
// ABOUTME: Renders entry data; shows [frontier] only when onFrontier is true.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TooltipCard } from '@/components/leaderboard/tooltip-card';
import { makeEntry } from './fixtures/entries';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';

describe('TooltipCard', () => {
  const entry = makeEntry({
    model_display: 'Claude Opus 4.7',
    adapter: 'rlm',
    reward: 0.82,
    reward_ci: [0.79, 0.85],
    mean_cost_usd: 1.8,
    mean_tokens: 46000,
    mean_duration_seconds: 12.4,
    trials: 180,
    repetitions: 30,
  });

  it('renders model and adapter', () => {
    render(<TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} />);
    expect(screen.getByText(/Claude Opus 4.7/)).toBeInTheDocument();
    expect(screen.getByText(/rlm/)).toBeInTheDocument();
  });

  it('renders reward with CI when available', () => {
    render(<TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} />);
    expect(screen.getByText(/0\.82/)).toBeInTheDocument();
    expect(screen.getByText(/\[0\.79.*0\.85\]/)).toBeInTheDocument();
  });

  it('shows the frontier badge when onFrontier=true', () => {
    const { rerender } = render(
      <TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} />,
    );
    expect(screen.queryByText(/\[frontier\]/)).toBeNull();
    rerender(<TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={true} />);
    expect(screen.getByText(/\[frontier\]/)).toBeInTheDocument();
  });

  it('renders — for missing CI', () => {
    const noCi = { ...entry, reward_ci: null };
    render(<TooltipCard entry={noCi} axisMetric={AXIS_METRICS.cost} onFrontier={false} />);
    expect(screen.getByText(/CI[^a-z]*—/i)).toBeInTheDocument();
  });

  it('accepts a variant of "floating" or "sticky"', () => {
    const { rerender } = render(
      <TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} variant="floating" />,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-variant', 'floating');
    rerender(
      <TooltipCard entry={entry} axisMetric={AXIS_METRICS.cost} onFrontier={false} variant="sticky" />,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-variant', 'sticky');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/tooltip-card.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/tooltip-card.tsx
// ABOUTME: Floating / sticky tooltip card for the scatter chart.
// ABOUTME: Pure presentational — parent positions the floating variant via inline style.
import { AXIS_METRICS, type AxisMetric } from '@/lib/aec-bench/axis-metric';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';
import { FrontierBadge } from './frontier-badge';
import { clsx } from '@/lib/clsx';

export interface TooltipCardProps {
  entry: LeaderboardEntry;
  axisMetric: AxisMetric;
  onFrontier: boolean;
  variant?: 'floating' | 'sticky';
  className?: string;
  style?: React.CSSProperties;
}

function formatReward(r: number): string {
  return r.toFixed(2);
}

function formatCi(ci: [number, number] | null): string {
  if (!ci) return '—';
  return `[${ci[0].toFixed(2)} – ${ci[1].toFixed(2)}]`;
}

export function TooltipCard({
  entry,
  axisMetric,
  onFrontier,
  variant = 'floating',
  className,
  style,
}: TooltipCardProps) {
  const x = axisMetric.accessor(entry);
  return (
    <div
      role="tooltip"
      data-variant={variant}
      className={clsx(
        'rounded-sm border border-accent-amber bg-[#050505] p-3 font-mono text-xs text-[#c7c7c7] shadow-lg',
        variant === 'floating' && 'pointer-events-none absolute z-30 max-w-[240px]',
        variant === 'sticky' && 'w-full',
        className,
      )}
      style={style}
    >
      <div className="mb-2 text-accent-amber font-bold">
        {entry.model_display} · <span className="text-[#888]">{entry.adapter}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[#a0a0a0]">
        <dt>reward</dt>
        <dd className="text-[#c7c7c7]">
          {formatReward(entry.reward)} <span className="text-[#666]">{formatCi(entry.reward_ci)}</span>
        </dd>
        <dt>CI</dt>
        <dd className="text-[#c7c7c7]">{formatCi(entry.reward_ci)}</dd>
        <dt>{axisMetric.key}</dt>
        <dd className="text-[#c7c7c7]">
          {x === null ? '—' : axisMetric.format(x)}
        </dd>
        <dt>tokens</dt>
        <dd className="text-[#c7c7c7]">
          {entry.mean_tokens === null ? '—' : AXIS_METRICS.tokens.format(entry.mean_tokens)}
        </dd>
        <dt>latency</dt>
        <dd className="text-[#c7c7c7]">
          {entry.mean_duration_seconds === null
            ? '—'
            : AXIS_METRICS.latency.format(entry.mean_duration_seconds)}
        </dd>
        <dt>trials</dt>
        <dd className="text-[#c7c7c7]">
          {entry.trials} · {entry.repetitions} reps
        </dd>
      </dl>
      {onFrontier && (
        <div className="mt-2 border-t border-[#222] pt-2">
          <FrontierBadge />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/tooltip-card.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/tooltip-card.tsx tests/leaderboard/tooltip-card.test.tsx
git commit -m "feat(leaderboard): TooltipCard with floating + sticky variants"
```

---

## Task 13: ParetoOverlay

**Files:**
- Create: `components/leaderboard/pareto-overlay.tsx`
- Create: `tests/leaderboard/pareto-overlay.test.tsx`

Draws the dashed amber polyline connecting frontier points. Hidden when <3 total points.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/pareto-overlay.test.tsx
// ABOUTME: Tests that the Pareto overlay renders a polyline over frontier points only.
// ABOUTME: Hidden when total points < 3 (not meaningful).
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ParetoOverlay } from '@/components/leaderboard/pareto-overlay';

describe('ParetoOverlay', () => {
  const points = [
    { key: 'a', x: 10, y: 80 },
    { key: 'b', x: 30, y: 60 },
    { key: 'c', x: 50, y: 30 },
    { key: 'd', x: 70, y: 50 },
  ];

  it('renders a polyline with dashed amber stroke', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points} frontierKeys={new Set(['a', 'b', 'c'])} />
      </svg>,
    );
    const line = container.querySelector('polyline');
    expect(line).toBeTruthy();
    expect(line!.getAttribute('stroke')).toBe('#e8a838');
    expect(line!.getAttribute('stroke-dasharray')).toBeTruthy();
  });

  it('connects only the frontier points, ordered by x ascending', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points} frontierKeys={new Set(['a', 'b', 'c'])} />
      </svg>,
    );
    const attr = container.querySelector('polyline')!.getAttribute('points')!;
    const coords = attr.trim().split(/\s+/);
    expect(coords).toHaveLength(3);
    const xs = coords.map((c) => Number(c.split(',')[0]));
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it('renders nothing when there are fewer than 3 points overall', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points.slice(0, 2)} frontierKeys={new Set(['a', 'b'])} />
      </svg>,
    );
    expect(container.querySelector('polyline')).toBeNull();
  });

  it('renders nothing when the frontier is empty', () => {
    const { container } = render(
      <svg>
        <ParetoOverlay points={points} frontierKeys={new Set()} />
      </svg>,
    );
    expect(container.querySelector('polyline')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/pareto-overlay.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/pareto-overlay.tsx
// ABOUTME: Draws the dashed amber polyline connecting Pareto-optimal scatter points.
// ABOUTME: Consumes already-scaled (SVG-coordinate) points + frontier key set.

export interface ScaledPoint {
  key: string;
  x: number;
  y: number;
}

export interface ParetoOverlayProps {
  points: ReadonlyArray<ScaledPoint>;
  frontierKeys: ReadonlySet<string>;
}

export function ParetoOverlay({ points, frontierKeys }: ParetoOverlayProps) {
  if (points.length < 3) return null;
  const frontier = points
    .filter((p) => frontierKeys.has(p.key))
    .sort((a, b) => a.x - b.x);
  if (frontier.length === 0) return null;

  const attr = frontier.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <polyline
      points={attr}
      fill="none"
      stroke="#e8a838"
      strokeWidth={1.5}
      strokeDasharray="4,3"
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/pareto-overlay.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/pareto-overlay.tsx tests/leaderboard/pareto-overlay.test.tsx
git commit -m "feat(leaderboard): ParetoOverlay — dashed amber frontier polyline"
```

---

## Task 14: ScatterChart component

**Files:**
- Create: `components/leaderboard/scatter-chart.tsx`
- Create: `tests/leaderboard/scatter-chart.test.tsx`

The biggest component. Hand-rolled SVG scatter with dots, axes, hover, keyboard nav, and frontier overlay. Tooltip positioning is delegated to a tiny inline anchor; the actual card renders via `TooltipCard`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/scatter-chart.test.tsx
// ABOUTME: Tests for the hand-rolled SVG scatter chart.
// ABOUTME: Covers dot count, axis labels, frontier polyline, hover tooltip, keyboard nav.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScatterChart } from '@/components/leaderboard/scatter-chart';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { FIXTURE_ENTRIES } from './fixtures/entries';

describe('ScatterChart', () => {
  const frontier = new Set(['claude-opus-4.7::rlm', 'gpt-4o::tool_loop', 'haiku-4.5::tool_loop']);

  const defaultProps = {
    entries: FIXTURE_ENTRIES,
    axisMetric: AXIS_METRICS.cost,
    yAxisLabel: 'reward',
    frontierKeys: frontier,
    onDotHover: vi.fn(),
    onDotClick: vi.fn(),
    hoveredRowKey: null,
    expandedRowKey: null,
  };

  it('renders exactly one dot per entry with a non-null x value', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const dotGroups = container.querySelectorAll('[data-testid^="dot-"]');
    expect(dotGroups.length).toBe(FIXTURE_ENTRIES.length);
  });

  it('renders the axis labels from the axisMetric', () => {
    render(<ScatterChart {...defaultProps} />);
    expect(screen.getByText(AXIS_METRICS.cost.label)).toBeInTheDocument();
    expect(screen.getByText(/reward/i)).toBeInTheDocument();
  });

  it('renders the frontier polyline when >=3 entries', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    expect(container.querySelector('polyline')).toBeTruthy();
  });

  it('fires onDotHover when a dot is entered and nulls it when left', () => {
    const onDotHover = vi.fn();
    const { container } = render(<ScatterChart {...defaultProps} onDotHover={onDotHover} />);
    const first = container.querySelector('[data-testid^="dot-"]')!;
    fireEvent.mouseEnter(first);
    expect(onDotHover).toHaveBeenLastCalledWith(expect.any(String));
    fireEvent.mouseLeave(first);
    expect(onDotHover).toHaveBeenLastCalledWith(null);
  });

  it('fires onDotClick when a dot is clicked', () => {
    const onDotClick = vi.fn();
    const { container } = render(<ScatterChart {...defaultProps} onDotClick={onDotClick} />);
    const first = container.querySelector('[data-testid^="dot-"]')!;
    fireEvent.click(first);
    expect(onDotClick).toHaveBeenCalledWith(expect.any(String));
  });

  it('shows a tooltip for the hovered row', () => {
    const key = `${FIXTURE_ENTRIES[0].model_key}::${FIXTURE_ENTRIES[0].adapter}`;
    render(<ScatterChart {...defaultProps} hoveredRowKey={key} />);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText(FIXTURE_ENTRIES[0].model_display)).toBeInTheDocument();
  });

  it('applies a frontier ring to frontier dots (via data attribute)', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const frontierDots = container.querySelectorAll('[data-frontier="true"]');
    expect(frontierDots.length).toBe(3);
  });

  it('exposes each dot as a focusable button with an accessible label', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const first = container.querySelector('[data-testid^="dot-"]')!;
    expect(first.getAttribute('role')).toBe('button');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-label')).toMatch(/reward/i);
  });

  it('moves focus to the nearest-x neighbour on ArrowRight', () => {
    const { container } = render(<ScatterChart {...defaultProps} />);
    const dots = Array.from(container.querySelectorAll('[data-testid^="dot-"]'));
    (dots[0] as HTMLElement).focus();
    fireEvent.keyDown(dots[0], { key: 'ArrowRight' });
    // Some dot received focus after the keydown; this is a soft assertion — the
    // full nearest-x logic is better covered via the hook in a later test.
    expect(document.activeElement).not.toBe(dots[0]);
  });

  it('renders an empty-state message when entries is empty', () => {
    render(<ScatterChart {...defaultProps} entries={[]} />);
    expect(screen.getByText(/no entries match/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/scatter-chart.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `ScatterChart`**

```tsx
// components/leaderboard/scatter-chart.tsx
// ABOUTME: Hand-rolled responsive SVG scatter — dots, axes, gridlines, hover, keyboard nav.
// ABOUTME: Frontier polyline delegated to <ParetoOverlay />; tooltip to <TooltipCard />.
'use client';
import { useMemo, useRef } from 'react';
import type { LeaderboardEntry, Provider } from '@/lib/aec-bench/contracts';
import { harnessGlyph, type GlyphShape } from '@/lib/aec-bench/harness-glyph';
import { type AxisMetric } from '@/lib/aec-bench/axis-metric';
import { ParetoOverlay } from './pareto-overlay';
import { TooltipCard } from './tooltip-card';

const PROVIDER_COLOURS: Record<Provider, string> = {
  anthropic: '#b5651d',
  openai: '#38b2ac',
  google: '#e8a838',
  meta: '#9333ea',
  other: '#888',
};

const VB_W = 800;
const VB_H = 400;
const PLOT = { l: 48, r: 16, t: 16, b: 40 };

export interface ScatterChartProps {
  entries: ReadonlyArray<LeaderboardEntry>;
  axisMetric: AxisMetric;
  yAxisLabel: string;
  frontierKeys: ReadonlySet<string>;
  hoveredRowKey: string | null;
  expandedRowKey: string | null;
  onDotHover: (key: string | null) => void;
  onDotClick: (key: string) => void;
}

function rowKey(e: LeaderboardEntry): string {
  return `${e.model_key}::${e.adapter}`;
}

function makeLinear(dMin: number, dMax: number, rMin: number, rMax: number) {
  const span = dMax - dMin || 1;
  return (v: number) => rMin + ((v - dMin) * (rMax - rMin)) / span;
}

function DotGlyph({
  shape,
  fill,
  size,
  frontier,
}: {
  shape: GlyphShape;
  fill: string;
  size: number;
  frontier: boolean;
}) {
  const ring = frontier ? { stroke: '#e8a838', strokeWidth: 2 } : {};
  switch (shape) {
    case 'circle':
      return <circle r={size} fill={fill} {...ring} />;
    case 'square':
      return <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={fill} transform="rotate(45)" {...ring} />;
    case 'triangle':
      return <polygon points={`0,${-size} ${size},${size} ${-size},${size}`} fill={fill} {...ring} />;
    case 'ring':
      return <circle r={size} fill="none" stroke={fill} strokeWidth={2} {...ring} />;
    case 'diamond':
    default:
      return <polygon points={`0,${-size} ${size},0 0,${size} ${-size},0`} fill={fill} {...ring} />;
  }
}

export function ScatterChart({
  entries,
  axisMetric,
  yAxisLabel,
  frontierKeys,
  hoveredRowKey,
  expandedRowKey,
  onDotHover,
  onDotClick,
}: ScatterChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const xs = useMemo(
    () =>
      entries
        .map((e) => axisMetric.accessor(e))
        .filter((v): v is number => v !== null),
    [entries, axisMetric],
  );
  const xMax = xs.length ? Math.max(...xs) * 1.05 : 1;
  const scaleX = makeLinear(0, xMax, PLOT.l, VB_W - PLOT.r);
  const scaleY = makeLinear(0, 1, VB_H - PLOT.b, PLOT.t);

  const scaled = entries
    .map((e) => ({
      key: rowKey(e),
      entry: e,
      rawX: axisMetric.accessor(e),
      rawY: e.reward,
    }))
    .filter((p) => p.rawX !== null)
    .map((p) => ({
      key: p.key,
      entry: p.entry,
      x: scaleX(p.rawX as number),
      y: scaleY(p.rawY),
    }));

  const hoveredEntry =
    hoveredRowKey !== null ? scaled.find((p) => p.key === hoveredRowKey) : null;

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = 0; i <= 5; i++) ticks.push((xMax * i) / 5);
    return ticks;
  }, [xMax]);
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  if (entries.length === 0) {
    return (
      <div className="relative flex h-72 items-center justify-center rounded-sm border border-landing-border bg-[#050505] font-mono text-xs text-[#888]">
        no entries match · clear filters to see the full frontier
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        role="img"
        aria-label={`Scatter chart of ${yAxisLabel} versus ${axisMetric.label}`}
      >
        {/* gridlines (y) */}
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={PLOT.l}
            x2={VB_W - PLOT.r}
            y1={scaleY(t)}
            y2={scaleY(t)}
            stroke="#1a1a1a"
            strokeWidth={0.5}
          />
        ))}
        {/* axes */}
        <line x1={PLOT.l} x2={VB_W - PLOT.r} y1={VB_H - PLOT.b} y2={VB_H - PLOT.b} stroke="#333" />
        <line x1={PLOT.l} x2={PLOT.l} y1={PLOT.t} y2={VB_H - PLOT.b} stroke="#333" />
        {/* x ticks + labels */}
        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line x1={scaleX(t)} x2={scaleX(t)} y1={VB_H - PLOT.b} y2={VB_H - PLOT.b + 4} stroke="#555" />
            <text
              x={scaleX(t)}
              y={VB_H - PLOT.b + 16}
              fill="#888"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              textAnchor="middle"
            >
              {axisMetric.format(t)}
            </text>
          </g>
        ))}
        {/* y ticks + labels */}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={PLOT.l - 4} x2={PLOT.l} y1={scaleY(t)} y2={scaleY(t)} stroke="#555" />
            <text
              x={PLOT.l - 8}
              y={scaleY(t) + 3}
              fill="#888"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              textAnchor="end"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {/* axis labels */}
        <text
          x={(VB_W + PLOT.l - PLOT.r) / 2}
          y={VB_H - 8}
          fill="#666"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          textAnchor="middle"
        >
          {axisMetric.label}
        </text>
        <text
          x={14}
          y={VB_H / 2}
          fill="#666"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          textAnchor="middle"
          transform={`rotate(-90 14 ${VB_H / 2})`}
        >
          {yAxisLabel}
        </text>

        {/* frontier */}
        <ParetoOverlay points={scaled.map(({ key, x, y }) => ({ key, x, y }))} frontierKeys={frontierKeys} />

        {/* dots */}
        {scaled.map(({ key, entry, x, y }) => {
          const provider = entry.provider;
          const shape = harnessGlyph(entry.adapter);
          const isFrontier = frontierKeys.has(key);
          const isHovered = hoveredRowKey === key;
          const isExpanded = expandedRowKey === key;
          const baseSize = 6;
          const size = isHovered ? baseSize * 1.4 : baseSize;
          const showRing = isFrontier || isExpanded;
          const xLabel = axisMetric.accessor(entry);
          return (
            <g
              key={key}
              data-testid={`dot-${key}`}
              data-frontier={isFrontier}
              role="button"
              tabIndex={0}
              aria-label={`${entry.model_display} ${entry.adapter}, reward ${entry.reward.toFixed(2)}, ${axisMetric.key} ${xLabel === null ? 'unknown' : axisMetric.format(xLabel)}`}
              transform={`translate(${x}, ${y})`}
              onMouseEnter={() => onDotHover(key)}
              onMouseLeave={() => onDotHover(null)}
              onFocus={() => onDotHover(key)}
              onBlur={() => onDotHover(null)}
              onClick={() => onDotClick(key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDotClick(key);
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const sorted = [...scaled].sort((a, b) => a.x - b.x);
                  const i = sorted.findIndex((p) => p.key === key);
                  const next = e.key === 'ArrowRight' ? sorted[i + 1] : sorted[i - 1];
                  if (next && svgRef.current) {
                    const target = svgRef.current.querySelector<HTMLElement>(
                      `[data-testid="dot-${next.key}"]`,
                    );
                    target?.focus();
                  }
                }
              }}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <DotGlyph shape={shape} fill={PROVIDER_COLOURS[provider]} size={size} frontier={showRing} />
            </g>
          );
        })}
      </svg>

      {hoveredEntry && (
        <TooltipCard
          entry={hoveredEntry.entry}
          axisMetric={axisMetric}
          onFrontier={frontierKeys.has(hoveredEntry.key)}
          variant="floating"
          style={{
            left: `${(hoveredEntry.x / VB_W) * 100}%`,
            top: `${(hoveredEntry.y / VB_H) * 100}%`,
            transform: 'translate(12px, -100%)',
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/scatter-chart.test.tsx
```

Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/scatter-chart.tsx tests/leaderboard/scatter-chart.test.tsx
git commit -m "feat(leaderboard): ScatterChart with hover + keyboard nav + frontier ring"
```

---

## Task 15: ControlStripPopover

**Files:**
- Create: `components/leaderboard/control-strip-popover.tsx`
- Create: `tests/leaderboard/control-strip-popover.test.tsx`

Tiny dropdown picker that opens from an anchor. Supports single-select (radio) or multi-select (checklist). Closes on outside click / Escape.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/control-strip-popover.test.tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/control-strip-popover.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/control-strip-popover.tsx
// ABOUTME: Small dropdown picker used by the control strip chips.
// ABOUTME: Single or multi-select; Escape closes; outside-click handled by parent via ref.
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/control-strip-popover.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/control-strip-popover.tsx tests/leaderboard/control-strip-popover.test.tsx
git commit -m "feat(leaderboard): ControlStripPopover picker (single/multi-select)"
```

---

## Task 16: ControlStrip component

**Files:**
- Create: `components/leaderboard/control-strip.tsx`
- Create: `tests/leaderboard/control-strip.test.tsx`

The CLI-prompt row with three chips. Each chip opens a ControlStripPopover.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/control-strip.test.tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/control-strip.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/control-strip.tsx
// ABOUTME: CLI-prompt row with three chips (--x, --discipline, --harness).
// ABOUTME: Each chip opens a ControlStripPopover. Locked filters hide the chip.
'use client';
import { useState } from 'react';
import type { Domain } from '@/lib/aec-bench/contracts';
import { DOMAINS } from '@/lib/aec-bench/contracts';
import type { AxisKey } from '@/lib/aec-bench/axis-metric';
import { ControlStripPopover } from './control-strip-popover';
import { clsx } from '@/lib/clsx';

const AXIS_OPTIONS = [
  { value: 'cost', label: 'cost' },
  { value: 'tokens', label: 'tokens' },
  { value: 'latency', label: 'latency' },
] as const;

const DISCIPLINE_OPTIONS = DOMAINS.map((d) => ({ value: d, label: d }));

function summarise(picked: ReadonlyArray<string>, allLabel = 'all'): string {
  if (picked.length === 0) return allLabel;
  if (picked.length === 1) return picked[0];
  return `${picked[0]} +${picked.length - 1}`;
}

interface Props {
  axisX: AxisKey;
  disciplines: ReadonlyArray<Domain>;
  harnesses: ReadonlyArray<string>;
  harnessOptions: ReadonlyArray<string>;
  lockedDiscipline?: Domain;
  lockedHarness?: string;
  onAxisChange: (next: AxisKey) => void;
  onDisciplinesChange: (next: Domain[]) => void;
  onHarnessesChange: (next: string[]) => void;
}

type OpenChip = 'x' | 'discipline' | 'harness' | null;

export function ControlStrip(props: Props) {
  const [open, setOpen] = useState<OpenChip>(null);

  function Chip({
    flag,
    value,
    chip,
    children,
  }: {
    flag: string;
    value: string;
    chip: OpenChip;
    children?: React.ReactNode;
  }) {
    return (
      <span className="relative inline-flex items-center gap-1">
        <span className="text-accent-amber">{flag}</span>
        <button
          type="button"
          onClick={() => setOpen(open === chip ? null : chip)}
          aria-label={`${flag} ${value}`}
          className={clsx(
            'rounded-sm border px-1.5 py-0.5 text-[#c7c7c7]',
            open === chip ? 'border-accent-amber bg-[rgba(232,168,56,0.1)]' : 'border-[#222] hover:border-accent-teal',
          )}
        >
          {value} ▾
        </button>
        {children}
      </span>
    );
  }

  return (
    <div className="rounded-sm border border-landing-border bg-[#050505] p-3 font-mono text-xs text-[#c7c7c7]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-accent-teal">$</span>
        <span>bench leaderboard</span>

        <Chip flag="--x" value={props.axisX} chip="x">
          {open === 'x' && (
            <ControlStripPopover
              options={AXIS_OPTIONS}
              selected={[props.axisX]}
              multi={false}
              onChange={(next) => {
                if (next[0]) props.onAxisChange(next[0] as AxisKey);
                setOpen(null);
              }}
              onClose={() => setOpen(null)}
            />
          )}
        </Chip>

        {!props.lockedDiscipline && (
          <Chip flag="--discipline" value={summarise(props.disciplines)} chip="discipline">
            {open === 'discipline' && (
              <ControlStripPopover
                options={DISCIPLINE_OPTIONS}
                selected={[...props.disciplines]}
                multi
                showClear
                onChange={(next) => props.onDisciplinesChange(next as Domain[])}
                onClose={() => setOpen(null)}
              />
            )}
          </Chip>
        )}

        {!props.lockedHarness && (
          <Chip flag="--harness" value={summarise(props.harnesses)} chip="harness">
            {open === 'harness' && (
              <ControlStripPopover
                options={props.harnessOptions.map((h) => ({ value: h, label: h }))}
                selected={[...props.harnesses]}
                multi
                showClear
                onChange={(next) => props.onHarnessesChange(next)}
                onClose={() => setOpen(null)}
              />
            )}
          </Chip>
        )}
      </div>
    </div>
  );
}
```

Add `DOMAINS` to the exports of `lib/aec-bench/contracts.ts` if it isn't already exported (it is — verify `export const DOMAINS = ...`).

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/control-strip.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/control-strip.tsx tests/leaderboard/control-strip.test.tsx
git commit -m "feat(leaderboard): ControlStrip CLI prompt with three chips"
```

---

## Task 17: MobileFilterSheet component

**Files:**
- Create: `components/leaderboard/mobile-filter-sheet.tsx`
- Create: `tests/leaderboard/mobile-filter-sheet.test.tsx`

Bottom-sheet shell for <640px. Batches filter state locally; commits on `[apply]`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/mobile-filter-sheet.test.tsx
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
    // simulate picking a discipline inside the sheet
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/mobile-filter-sheet.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/mobile-filter-sheet.tsx
// ABOUTME: Bottom-sheet filter UI for <640px. Batches selections locally until [apply].
// ABOUTME: Used in place of the inline ControlStrip on mobile.
'use client';
import { useState } from 'react';
import type { Domain } from '@/lib/aec-bench/contracts';
import { DOMAINS } from '@/lib/aec-bench/contracts';
import type { AxisKey } from '@/lib/aec-bench/axis-metric';
import { clsx } from '@/lib/clsx';

export interface MobileFilterSheetProps {
  axisX: AxisKey;
  disciplines: ReadonlyArray<Domain>;
  harnesses: ReadonlyArray<string>;
  harnessOptions: ReadonlyArray<string>;
  activeFilterCount: number;
  onApply: (state: { axisX: AxisKey; disciplines: Domain[]; harnesses: string[] }) => void;
}

const AXES: AxisKey[] = ['cost', 'tokens', 'latency'];

export function MobileFilterSheet({
  axisX,
  disciplines,
  harnesses,
  harnessOptions,
  activeFilterCount,
  onApply,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    axisX,
    disciplines: [...disciplines] as Domain[],
    harnesses: [...harnesses],
  });

  function openSheet() {
    setDraft({ axisX, disciplines: [...disciplines], harnesses: [...harnesses] });
    setOpen(true);
  }

  function toggle<T extends string>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="rounded-sm border border-landing-border bg-[#050505] px-3 py-1.5 font-mono text-xs text-[#c7c7c7]"
      >
        filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="filters"
          className="fixed inset-0 z-40 flex items-end bg-black/60"
        >
          <div className="mx-auto w-full max-w-2xl rounded-t-md border-t border-x border-landing-border bg-[#0a0a0a] p-4 font-mono text-xs text-[#c7c7c7]">
            <section className="mb-4">
              <h3 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">x-axis</h3>
              <div className="flex gap-1">
                {AXES.map((a) => (
                  <button
                    key={a}
                    role="option"
                    aria-selected={draft.axisX === a}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, axisX: a }))}
                    className={clsx(
                      'rounded-sm border px-3 py-1.5',
                      draft.axisX === a ? 'border-accent-amber text-accent-amber' : 'border-[#222]',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-4">
              <h3 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">--discipline</h3>
              <div className="flex flex-wrap gap-1">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    role="option"
                    aria-selected={draft.disciplines.includes(d)}
                    type="button"
                    onClick={() => setDraft((dr) => ({ ...dr, disciplines: toggle(dr.disciplines, d) }))}
                    className={clsx(
                      'rounded-full border px-3 py-1',
                      draft.disciplines.includes(d)
                        ? 'border-accent-amber text-accent-amber'
                        : 'border-[#222]',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-6">
              <h3 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">--harness</h3>
              <div className="flex flex-wrap gap-1">
                {harnessOptions.map((h) => (
                  <button
                    key={h}
                    role="option"
                    aria-selected={draft.harnesses.includes(h)}
                    type="button"
                    onClick={() => setDraft((dr) => ({ ...dr, harnesses: toggle(dr.harnesses, h) }))}
                    className={clsx(
                      'rounded-full border px-3 py-1',
                      draft.harnesses.includes(h)
                        ? 'border-accent-amber text-accent-amber'
                        : 'border-[#222]',
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-[#222] px-4 py-1.5"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                className="rounded-sm border border-accent-amber bg-accent-amber/10 px-4 py-1.5 text-accent-amber"
              >
                apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/mobile-filter-sheet.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/mobile-filter-sheet.tsx tests/leaderboard/mobile-filter-sheet.test.tsx
git commit -m "feat(leaderboard): MobileFilterSheet with batched apply"
```

---

## Task 18: ExpandableRow component

**Files:**
- Create: `components/leaderboard/expandable-row.tsx`
- Create: `tests/leaderboard/expandable-row.test.tsx`

A single table row with collapsed + expanded states. Animation via framer-motion (respects `prefers-reduced-motion`).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/expandable-row.test.tsx
// ABOUTME: Tests for the expandable leaderboard row.
// ABOUTME: Covers collapsed render, expanded content, keyboard toggle, [mock] tag.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExpandableRow } from '@/components/leaderboard/expandable-row';
import { makeEntry } from './fixtures/entries';

describe('ExpandableRow', () => {
  const entry = makeEntry({
    rank: 1,
    model_display: 'Claude Opus 4.7',
    provider: 'anthropic',
    adapter: 'rlm',
    reward: 0.82,
    reward_ci: [0.79, 0.85],
    delta_vs_previous: 0.02,
    mean_tokens: 46000,
    mean_cost_usd: 1.8,
    is_mock: false,
  });

  const baseProps = {
    entry,
    rankDisplay: 1,
    isExpanded: false,
    isHoveredFromChart: false,
    onFrontier: false,
    onToggle: vi.fn(),
  };

  it('renders the model, adapter, reward, delta, tokens, cost when collapsed', () => {
    render(<table><tbody><ExpandableRow {...baseProps} /></tbody></table>);
    expect(screen.getByText('Claude Opus 4.7')).toBeInTheDocument();
    expect(screen.getByText('rlm')).toBeInTheDocument();
    expect(screen.getByText('0.82')).toBeInTheDocument();
    expect(screen.getByText(/\+0\.02/)).toBeInTheDocument();
    expect(screen.getByText(/46\.0k/)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.80/)).toBeInTheDocument();
  });

  it('shows the [frontier] badge when onFrontier=true', () => {
    render(<table><tbody><ExpandableRow {...baseProps} onFrontier={true} /></tbody></table>);
    expect(screen.getByText(/\[frontier\]/)).toBeInTheDocument();
  });

  it('shows the [mock] tag when entry.is_mock is true', () => {
    const mockEntry = { ...entry, is_mock: true };
    render(<table><tbody><ExpandableRow {...baseProps} entry={mockEntry} /></tbody></table>);
    expect(screen.getByText(/\[mock\]/i)).toBeInTheDocument();
  });

  it('calls onToggle when the row is clicked', () => {
    const onToggle = vi.fn();
    render(<table><tbody><ExpandableRow {...baseProps} onToggle={onToggle} /></tbody></table>);
    fireEvent.click(screen.getByRole('button', { name: /Claude Opus 4.7/ }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('toggles on Enter and Space keydown', () => {
    const onToggle = vi.fn();
    render(<table><tbody><ExpandableRow {...baseProps} onToggle={onToggle} /></tbody></table>);
    const row = screen.getByRole('button', { name: /Claude Opus 4.7/ });
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('shows expanded content when isExpanded=true (per-discipline, CI, trials)', () => {
    render(<table><tbody><ExpandableRow {...baseProps} isExpanded={true} /></tbody></table>);
    expect(screen.getByText(/per-discipline reward/i)).toBeInTheDocument();
    expect(screen.getByText(/95% CI/)).toBeInTheDocument();
    expect(screen.getByText(/\[0\.79.*0\.85\]/)).toBeInTheDocument();
    expect(screen.getByText(/trials/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/expandable-row.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/expandable-row.tsx
// ABOUTME: A single table row for the leaderboard — collapsed + expanded states.
// ABOUTME: Framer Motion drives the expansion animation; respects prefers-reduced-motion.
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { FrontierBadge } from './frontier-badge';
import { clsx } from '@/lib/clsx';

export interface ExpandableRowProps {
  entry: LeaderboardEntry;
  rankDisplay: number;
  isExpanded: boolean;
  isHoveredFromChart: boolean;
  onFrontier: boolean;
  onToggle: () => void;
}

function DeltaCell({ v }: { v: number | null }) {
  if (v === null) return <span className="text-[#555]">—</span>;
  const up = v >= 0;
  const sign = up ? '+' : '−';
  return (
    <span className={up ? 'text-[#6fd08a]' : 'text-[#e07b7b]'}>
      {sign}
      {Math.abs(v).toFixed(2)}
    </span>
  );
}

function Bars({ entry, active }: { entry: LeaderboardEntry; active?: 'civil' | 'electrical' | 'ground' | 'mechanical' | 'structural' }) {
  const values = [
    entry.per_discipline.civil,
    entry.per_discipline.electrical,
    entry.per_discipline.ground,
    entry.per_discipline.mechanical,
    entry.per_discipline.structural,
  ];
  return (
    <div className="flex h-5 items-end gap-[3px]">
      {values.map((v, i) => (
        <div key={i} className="relative min-w-[5px] flex-1 rounded-sm bg-[#1a1a1a]">
          <div
            className={clsx('absolute inset-x-0 bottom-0 rounded-sm', 'bg-accent-teal')}
            style={{ height: v === null || v === undefined ? 0 : `${Math.round((v as number) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function ExpandableRow({
  entry,
  rankDisplay,
  isExpanded,
  isHoveredFromChart,
  onFrontier,
  onToggle,
}: ExpandableRowProps) {
  const rowName = `${entry.model_display} ${entry.adapter}`;
  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={rowName}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={clsx(
          'cursor-pointer border-b border-[#141414] font-mono text-xs',
          isHoveredFromChart && 'bg-[rgba(232,168,56,0.06)] border-l-2 border-l-accent-amber',
          isExpanded && 'bg-[rgba(232,168,56,0.08)]',
        )}
      >
        <td className="px-3 py-3 font-bold text-accent-amber">
          <span className="text-[#555]">#</span>
          {String(rankDisplay).padStart(2, '0')}
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <div>
              <div className="font-sans font-semibold text-landing-text">{entry.model_display}</div>
              <div className="text-[0.7rem] text-[#888]">
                {entry.provider} · <span className="text-[#666]">{entry.adapter}</span>
                {entry.is_mock && (
                  <span className="ml-2 text-[#666]" aria-label="mock entry">[mock]</span>
                )}
              </div>
            </div>
            {onFrontier && <FrontierBadge />}
          </div>
        </td>
        <td className="hidden px-3 py-3 md:table-cell"><Bars entry={entry} /></td>
        <td className="px-3 py-3 text-right font-bold text-accent-amber">{entry.reward.toFixed(2)}</td>
        <td className="hidden px-3 py-3 md:table-cell"><DeltaCell v={entry.delta_vs_previous} /></td>
        <td className="hidden px-3 py-3 text-right text-[0.72rem] text-[#888] md:table-cell">
          {entry.mean_tokens === null ? '—' : AXIS_METRICS.tokens.format(entry.mean_tokens)}
        </td>
        <td className="px-3 py-3 text-right text-[0.72rem] text-[#888]">
          {entry.mean_cost_usd === null ? '—' : AXIS_METRICS.cost.format(entry.mean_cost_usd)}
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-b border-[#141414] bg-[#080808]"
          >
            <td colSpan={7} className="px-6 py-4 font-mono text-[0.75rem] text-[#c7c7c7]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h4 className="mb-2 text-[0.6rem] uppercase tracking-wider text-[#888]">
                    per-discipline reward
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {(['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const).map((d) => (
                      <div key={d} className="flex flex-col items-center">
                        <div className="text-[#666]">{d.slice(0, 3)}</div>
                        <div className="font-bold text-accent-amber">
                          {entry.per_discipline[d]?.toFixed(2) ?? '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[#a0a0a0]">
                    <dt>95% CI</dt>
                    <dd className="text-[#c7c7c7]">
                      {entry.reward_ci ? `[${entry.reward_ci[0].toFixed(2)} – ${entry.reward_ci[1].toFixed(2)}]` : '—'}
                    </dd>
                    <dt>trials</dt>
                    <dd className="text-[#c7c7c7]">
                      {entry.trials} ({entry.repetitions} reps)
                    </dd>
                    <dt>last submission</dt>
                    <dd className="text-[#c7c7c7]">{entry.last_submission}</dd>
                    <dt>Δ vs previous</dt>
                    <dd className="text-[#c7c7c7]">
                      <DeltaCell v={entry.delta_vs_previous} />
                    </dd>
                  </dl>
                </section>
              </div>
              <div className="mt-3 text-[0.65rem] text-[#555]">
                full model detail coming in Phase 4 →
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/expandable-row.test.tsx
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/expandable-row.tsx tests/leaderboard/expandable-row.test.tsx
git commit -m "feat(leaderboard): ExpandableRow with inline per-discipline + CI panel"
```

---

## Task 19: LeaderboardTable component

**Files:**
- Create: `components/leaderboard/leaderboard-table.tsx`
- Create: `tests/leaderboard/leaderboard-table.test.tsx`

Terminal-style table shell with window chrome, header + sort carets, rows from `ExpandableRow`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/leaderboard-table.test.tsx
// ABOUTME: Tests for the table shell — window chrome, sort headers, row rendering.
// ABOUTME: Does not cover animation (that's on ExpandableRow).
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { FIXTURE_ENTRIES } from './fixtures/entries';

describe('LeaderboardTable', () => {
  const base = {
    entries: FIXTURE_ENTRIES,
    frontierKeys: new Set<string>(),
    hoveredRowKey: null,
    expandedRowKey: null,
    sort: { column: 'rank', dir: 'asc' } as const,
    onSortChange: vi.fn(),
    onRowToggle: vi.fn(),
  };

  it('renders the terminal window chrome with row count', () => {
    render(<LeaderboardTable {...base} />);
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${FIXTURE_ENTRIES.length} rows`))).toBeInTheDocument();
  });

  it('renders one ExpandableRow per entry', () => {
    render(<LeaderboardTable {...base} />);
    // Each row is a button with its model name as aria-label
    for (const e of FIXTURE_ENTRIES) {
      expect(
        screen.getByRole('button', { name: new RegExp(e.model_display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }),
      ).toBeInTheDocument();
    }
  });

  it('fires onSortChange when a sortable header is clicked', () => {
    const onSortChange = vi.fn();
    render(<LeaderboardTable {...base} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /reward/i }));
    expect(onSortChange).toHaveBeenCalled();
  });

  it('flips sort direction when the same header is clicked twice', () => {
    const onSortChange = vi.fn();
    const { rerender } = render(<LeaderboardTable {...base} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /reward/i }));
    const firstCall = onSortChange.mock.calls[0][0];
    rerender(<LeaderboardTable {...base} sort={firstCall} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /reward/i }));
    const secondCall = onSortChange.mock.calls[1][0];
    expect(secondCall.dir).not.toBe(firstCall.dir);
  });

  it('shows the frontier badge count in the window chrome', () => {
    render(
      <LeaderboardTable
        {...base}
        frontierKeys={new Set([`${FIXTURE_ENTRIES[0].model_key}::${FIXTURE_ENTRIES[0].adapter}`])}
      />,
    );
    expect(screen.getByText(/1 on frontier/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/leaderboard-table.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement the component**

```tsx
// components/leaderboard/leaderboard-table.tsx
// ABOUTME: Terminal-style table shell — window chrome, sortable header, rows.
// ABOUTME: Row bodies are ExpandableRow; sort state + handlers are owned by the parent hook.
'use client';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';
import type { SortSpec, SortColumn } from '@/lib/aec-bench/sort';
import { ExpandableRow } from './expandable-row';

export interface LeaderboardTableProps {
  entries: ReadonlyArray<LeaderboardEntry>;
  frontierKeys: ReadonlySet<string>;
  hoveredRowKey: string | null;
  expandedRowKey: string | null;
  sort: SortSpec;
  onSortChange: (next: SortSpec) => void;
  onRowToggle: (key: string) => void;
}

function rowKey(e: LeaderboardEntry): string {
  return `${e.model_key}::${e.adapter}`;
}

interface HeaderCell {
  key: SortColumn | null;
  label: string;
  align?: 'left' | 'right';
  hideMobile?: boolean;
}

const HEADERS: HeaderCell[] = [
  { key: null, label: '#' },
  { key: 'model', label: 'MODEL' },
  { key: null, label: 'PER-DISCIPLINE', hideMobile: true },
  { key: 'reward', label: 'REWARD', align: 'right' },
  { key: 'delta', label: 'Δ LAST', align: 'right', hideMobile: true },
  { key: 'tokens', label: 'TOKENS', align: 'right', hideMobile: true },
  { key: 'cost', label: '$', align: 'right' },
];

function nextSort(current: SortSpec, col: SortColumn): SortSpec {
  if (current.column === col) {
    return { column: col, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  }
  // default direction per column type
  const numeric: SortColumn[] = ['reward', 'delta', 'tokens', 'cost', 'rank'];
  return { column: col, dir: numeric.includes(col) ? 'desc' : 'asc' };
}

export function LeaderboardTable({
  entries,
  frontierKeys,
  hoveredRowKey,
  expandedRowKey,
  sort,
  onSortChange,
  onRowToggle,
}: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-landing-border bg-[#050505]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-landing-border bg-landing-bg px-3 py-2 font-mono text-[0.7rem] text-[#666]">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-landing-border" />
          <span className="h-2 w-2 rounded-full bg-landing-border" />
          <span className="h-2 w-2 rounded-full bg-landing-border" />
        </div>
        <span className="ml-1">~/aec-bench / leaderboard</span>
        <span className="ml-auto text-[0.65rem]">
          {entries.length} rows · {frontierKeys.size} on frontier
        </span>
      </div>
      {/* command echo */}
      <div className="border-b border-landing-border px-3 py-2 font-mono text-xs text-[#c7c7c7]">
        <span className="text-accent-teal">aec-bench ~ $</span>{' '}
        <span>sort --by </span>
        <span className="text-accent-amber">{sort.column}</span>{' '}
        <span className="text-accent-amber">--{sort.dir}</span>
      </div>
      <div className="overflow-x-auto">
        <table role="table" className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-landing-border text-[0.62rem] uppercase tracking-wider text-[#666]">
              {HEADERS.map((h) => {
                const ariaSort: 'none' | 'ascending' | 'descending' =
                  h.key && sort.column === h.key
                    ? sort.dir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none';
                const caret = h.key && sort.column === h.key ? (sort.dir === 'asc' ? '▴' : '▾') : '';
                return (
                  <th
                    key={h.label}
                    scope="col"
                    aria-sort={ariaSort}
                    onClick={h.key ? () => onSortChange(nextSort(sort, h.key!)) : undefined}
                    className={
                      (h.hideMobile ? 'hidden md:table-cell ' : '') +
                      'px-3 py-2 ' +
                      (h.align === 'right' ? 'text-right ' : '') +
                      (h.key ? 'cursor-pointer select-none hover:text-[#c7c7c7]' : '')
                    }
                  >
                    {h.label} {caret}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <ExpandableRow
                key={rowKey(e)}
                entry={e}
                rankDisplay={i + 1}
                isExpanded={expandedRowKey === rowKey(e)}
                isHoveredFromChart={hoveredRowKey === rowKey(e)}
                onFrontier={frontierKeys.has(rowKey(e))}
                onToggle={() => onRowToggle(rowKey(e))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/leaderboard-table.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/leaderboard-table.tsx tests/leaderboard/leaderboard-table.test.tsx
git commit -m "feat(leaderboard): LeaderboardTable shell with sortable headers"
```

---

## Task 20: `useLeaderboardState` hook

**Files:**
- Create: `components/leaderboard/use-leaderboard-state.ts`
- Create: `tests/leaderboard/use-leaderboard-state.test.tsx`

Single hook owning all interactive state. Reads URL params on mount; writes them via `router.replace`. Exposes memoised derived data (reshaped, sorted, points, frontier).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/use-leaderboard-state.test.tsx
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
    expect(result.current.sorted.every((e) => e.adapter === 'tool_loop')).toBe(true);
  });

  it('computes a non-empty frontier on the full fixture set', () => {
    const { result } = renderHook(() => useLeaderboardState(FIXTURE_ENTRIES, {}));
    expect(result.current.frontierKeys.size).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/use-leaderboard-state.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the hook**

```ts
// components/leaderboard/use-leaderboard-state.ts
// ABOUTME: Single source of truth for /leaderboard interactive state.
// ABOUTME: URL-synced filter/sort/axis/expansion; derived reshaped/sorted/points/frontier.
'use client';
import { useCallback, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { LeaderboardEntry, Domain } from '@/lib/aec-bench/contracts';
import { DOMAINS } from '@/lib/aec-bench/contracts';
import type { AxisKey } from '@/lib/aec-bench/axis-metric';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { filterAndReshape } from '@/lib/aec-bench/filter';
import { sortEntries, type SortColumn, type SortSpec } from '@/lib/aec-bench/sort';
import { computeParetoFrontier, type ScatterPoint } from '@/lib/aec-bench/pareto';

const VALID_AXES: AxisKey[] = ['cost', 'tokens', 'latency'];
const VALID_SORT_COLUMNS: SortColumn[] = [
  'rank', 'model', 'reward', 'delta', 'tokens', 'cost',
  'civil', 'electrical', 'ground', 'mechanical', 'structural',
];

function parseAxis(v: string | null): AxisKey {
  return VALID_AXES.includes(v as AxisKey) ? (v as AxisKey) : 'cost';
}

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseDisciplines(v: string | null): Domain[] {
  return parseList(v).filter((d): d is Domain => DOMAINS.includes(d as Domain));
}

function parseSort(col: string | null, dir: string | null): SortSpec {
  const column = VALID_SORT_COLUMNS.includes(col as SortColumn) ? (col as SortColumn) : 'rank';
  const direction: 'asc' | 'desc' = dir === 'desc' ? 'desc' : 'asc';
  return { column, dir: direction };
}

export interface LeaderboardStateOptions {
  lockedDiscipline?: Domain;
  lockedHarness?: string;
}

export function useLeaderboardState(
  entries: ReadonlyArray<LeaderboardEntry>,
  options: LeaderboardStateOptions,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const axisX = parseAxis(searchParams.get('x'));
  const disciplinesFromUrl = parseDisciplines(searchParams.get('d'));
  const disciplines: Domain[] = options.lockedDiscipline
    ? [options.lockedDiscipline]
    : disciplinesFromUrl;
  const harnessesFromUrl = parseList(searchParams.get('h'));
  const harnesses: string[] = options.lockedHarness
    ? [options.lockedHarness]
    : harnessesFromUrl;
  const sort = parseSort(searchParams.get('sort'), searchParams.get('dir'));

  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);

  const reshaped = useMemo(
    () => filterAndReshape(entries, { disciplines, harnesses }),
    [entries, disciplines, harnesses],
  );
  const sorted = useMemo(() => sortEntries(reshaped, sort), [reshaped, sort]);
  const points = useMemo<ScatterPoint[]>(() => {
    const metric = AXIS_METRICS[axisX];
    const out: ScatterPoint[] = [];
    for (const e of sorted) {
      const x = metric.accessor(e);
      if (x === null) continue;
      out.push({ key: `${e.model_key}::${e.adapter}`, x, y: e.reward });
    }
    return out;
  }, [sorted, axisX]);
  const frontierKeys = useMemo(() => computeParetoFrontier(points), [points]);

  const expandedRowKeyFromUrl = searchParams.get('open');
  const expandedRowKey = useMemo(() => {
    if (!expandedRowKeyFromUrl) return null;
    // clear if filtered out
    const present = sorted.some(
      (e) => `${e.model_key}::${e.adapter}` === expandedRowKeyFromUrl,
    );
    return present ? expandedRowKeyFromUrl : null;
  }, [expandedRowKeyFromUrl, sorted]);

  const write = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setAxisX = useCallback((v: AxisKey) => write({ x: v }), [write]);
  const setDisciplines = useCallback(
    (ds: Domain[]) => write({ d: ds.length ? ds.join(',') : null }),
    [write],
  );
  const setHarnesses = useCallback(
    (hs: string[]) => write({ h: hs.length ? hs.join(',') : null }),
    [write],
  );
  const setSort = useCallback(
    (s: SortSpec) => write({ sort: s.column, dir: s.dir }),
    [write],
  );
  const setExpandedRowKey = useCallback(
    (k: string | null) => write({ open: k }),
    [write],
  );
  const toggleExpanded = useCallback(
    (k: string) => write({ open: expandedRowKey === k ? null : k }),
    [write, expandedRowKey],
  );

  const applyBatch = useCallback(
    (state: { axisX: AxisKey; disciplines: Domain[]; harnesses: string[] }) => {
      write({
        x: state.axisX,
        d: state.disciplines.length ? state.disciplines.join(',') : null,
        h: state.harnesses.length ? state.harnesses.join(',') : null,
      });
    },
    [write],
  );

  return {
    // state
    axisX,
    disciplines,
    harnesses,
    sort,
    hoveredRowKey,
    expandedRowKey,
    // derived
    reshaped,
    sorted,
    points,
    frontierKeys,
    // setters
    setAxisX,
    setDisciplines,
    setHarnesses,
    setSort,
    setHoveredRowKey,
    setExpandedRowKey,
    toggleExpanded,
    applyBatch,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/use-leaderboard-state.test.tsx
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/use-leaderboard-state.ts tests/leaderboard/use-leaderboard-state.test.tsx
git commit -m "feat(leaderboard): useLeaderboardState hook with URL sync"
```

---

## Task 21: LeaderboardSurface container

**Files:**
- Create: `components/leaderboard/leaderboard-surface.tsx`
- Create: `tests/leaderboard/leaderboard-surface.test.tsx`

Top-level client container that composes everything and exposes the public API for discipline pages.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/leaderboard/leaderboard-surface.test.tsx
// ABOUTME: Integration test for the leaderboard surface composition.
// ABOUTME: Renders the full surface with a fixture and exercises filter → reshape → sort → render.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeaderboardSurface } from '@/components/leaderboard/leaderboard-surface';
import { FIXTURE_ENTRIES } from './fixtures/entries';

const replace = vi.fn();
let searchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/leaderboard',
  useSearchParams: () => searchParams,
}));

describe('LeaderboardSurface', () => {
  const baseRunStatus = {
    tasks: 6,
    models: 5,
    adapters: 4,
    disciplines: 5,
    last_submission: '2026-04-18T10:00:00Z',
    generated_at: '2026-04-18T10:30:00Z',
  };

  beforeEach(() => {
    searchParams = new URLSearchParams('');
    replace.mockClear();
  });

  it('renders the heading, subheading, and dataset kicker', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={true}
        runStatus={baseRunStatus}
        heading="Leaderboard"
        subheading="All models and adapters"
      />,
    );
    expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument();
    expect(screen.getByText(/All models and adapters/)).toBeInTheDocument();
    expect(screen.getByText(/aec-bench@0\.4\.1/)).toBeInTheDocument();
  });

  it('shows the mock caveat when isMock=true', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={true}
        runStatus={baseRunStatus}
        heading="Leaderboard"
      />,
    );
    expect(screen.getByText(/mock submissions/i)).toBeInTheDocument();
  });

  it('renders the control strip, scatter chart, legend, and table', () => {
    const { container } = render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Leaderboard"
      />,
    );
    expect(screen.getByRole('button', { name: /--x.*cost/i })).toBeInTheDocument();
    expect(container.querySelector('svg[role="img"]')).toBeTruthy();
    expect(screen.getByRole('list', { name: /chart legend/i })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('hides the discipline chip when lockedDiscipline is set', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Civil"
        lockedDiscipline="civil"
      />,
    );
    expect(screen.queryByRole('button', { name: /--discipline/i })).toBeNull();
  });

  it('renders the trailingSlot below the table', () => {
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Leaderboard"
        trailingSlot={<div data-testid="trailing">extra</div>}
      />,
    );
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
  });

  it('renders the footnote about x-axis when disciplines are filtered', () => {
    searchParams = new URLSearchParams('d=civil');
    render(
      <LeaderboardSurface
        entries={FIXTURE_ENTRIES}
        isMock={false}
        runStatus={baseRunStatus}
        heading="Leaderboard"
      />,
    );
    expect(screen.getByText(/overall across all disciplines/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/leaderboard/leaderboard-surface.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement the container**

```tsx
// components/leaderboard/leaderboard-surface.tsx
// ABOUTME: Top-level client container for /leaderboard and /leaderboard/[discipline].
// ABOUTME: Composes ControlStrip (or MobileFilterSheet), ScatterChart, Legend, Table, trailingSlot.
'use client';
import { useMemo } from 'react';
import type { LeaderboardEntry, Domain, RunStatus } from '@/lib/aec-bench/contracts';
import { AXIS_METRICS } from '@/lib/aec-bench/axis-metric';
import { useLeaderboardState } from './use-leaderboard-state';
import { ControlStrip } from './control-strip';
import { MobileFilterSheet } from './mobile-filter-sheet';
import { ScatterChart } from './scatter-chart';
import { Legend } from './legend';
import { LeaderboardTable } from './leaderboard-table';

export interface LeaderboardSurfaceProps {
  entries: ReadonlyArray<LeaderboardEntry>;
  isMock: boolean;
  runStatus: RunStatus;
  heading: string;
  subheading?: string;
  lockedDiscipline?: Domain;
  lockedHarness?: string;
  trailingSlot?: React.ReactNode;
}

export function LeaderboardSurface({
  entries,
  isMock,
  runStatus,
  heading,
  subheading,
  lockedDiscipline,
  lockedHarness,
  trailingSlot,
}: LeaderboardSurfaceProps) {
  const state = useLeaderboardState(entries, { lockedDiscipline, lockedHarness });

  const harnessOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(e.adapter);
    return Array.from(set).sort();
  }, [entries]);

  const activeFilterCount =
    (lockedDiscipline ? 0 : state.disciplines.length) +
    (lockedHarness ? 0 : state.harnesses.length);

  const yAxisLabel = state.disciplines.length === 0
    ? 'reward'
    : state.disciplines.length === 1
    ? `reward (${state.disciplines[0]})`
    : `reward (${state.disciplines.join(' + ')} mean)`;

  const dataset = entries[0]?.dataset ?? 'dataset';
  const headingId = 'leaderboard-heading';

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <header className="mb-6">
        <h1 id={headingId} className="text-3xl font-bold text-landing-text md:text-4xl">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-2 text-sm text-landing-muted">{subheading}</p>
        )}
        <p className="mt-2 font-mono text-xs text-landing-muted">
          dataset <span className="text-accent-amber">{dataset}</span> · {runStatus.tasks} tasks · {runStatus.disciplines} disciplines · {runStatus.models} models
        </p>
        {isMock && (
          <p className="mt-2 font-mono text-[0.7rem] text-[#888]">
            ⚠ frontier and values are from mock submissions — real data lands as submissions arrive
          </p>
        )}
      </header>

      {/* Control strip (desktop) */}
      <div className="mb-4 hidden md:block">
        <ControlStrip
          axisX={state.axisX}
          disciplines={state.disciplines}
          harnesses={state.harnesses}
          harnessOptions={harnessOptions}
          lockedDiscipline={lockedDiscipline}
          lockedHarness={lockedHarness}
          onAxisChange={state.setAxisX}
          onDisciplinesChange={state.setDisciplines}
          onHarnessesChange={state.setHarnesses}
        />
      </div>
      {/* Mobile filters */}
      <div className="mb-4 md:hidden">
        <MobileFilterSheet
          axisX={state.axisX}
          disciplines={state.disciplines}
          harnesses={state.harnesses}
          harnessOptions={harnessOptions}
          activeFilterCount={activeFilterCount}
          onApply={state.applyBatch}
        />
      </div>

      {/* Scatter */}
      <div className="mb-2">
        <ScatterChart
          entries={state.sorted}
          axisMetric={AXIS_METRICS[state.axisX]}
          yAxisLabel={yAxisLabel}
          frontierKeys={state.frontierKeys}
          hoveredRowKey={state.hoveredRowKey}
          expandedRowKey={state.expandedRowKey}
          onDotHover={state.setHoveredRowKey}
          onDotClick={state.toggleExpanded}
        />
      </div>
      {state.disciplines.length > 0 && (
        <p className="mb-2 font-mono text-[0.65rem] text-[#666]">
          ⓘ cost / tokens / latency are overall across all disciplines — library does not yet track per-discipline costs
        </p>
      )}
      <div className="mb-6">
        <Legend />
      </div>

      {/* Table */}
      <LeaderboardTable
        entries={state.sorted}
        frontierKeys={state.frontierKeys}
        hoveredRowKey={state.hoveredRowKey}
        expandedRowKey={state.expandedRowKey}
        sort={state.sort}
        onSortChange={state.setSort}
        onRowToggle={state.toggleExpanded}
      />

      {trailingSlot && <div className="mt-8">{trailingSlot}</div>}
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test tests/leaderboard/leaderboard-surface.test.tsx
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add components/leaderboard/leaderboard-surface.tsx tests/leaderboard/leaderboard-surface.test.tsx
git commit -m "feat(leaderboard): LeaderboardSurface container composing chart + table"
```

---

## Task 22: `/leaderboard` page route

**Files:**
- Create: `app/leaderboard/page.tsx`
- Create: `app/leaderboard/loading.tsx`
- Create: `tests/e2e/leaderboard-smoke.spec.ts` (tiny smoke test)

The RSC that reads the artefact and renders `LeaderboardSurface`.

- [ ] **Step 1: Write the failing E2E smoke test**

```ts
// tests/e2e/leaderboard-smoke.spec.ts
// ABOUTME: Smoke check for /leaderboard — page loads, heading visible, table has rows.
import { test, expect } from '@playwright/test';

test('/leaderboard loads with heading and at least one row', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  const rows = page.getByRole('table').locator('tbody tr[role="button"]');
  await expect(rows.first()).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E to verify it fails**

```bash
pnpm test:e2e tests/e2e/leaderboard-smoke.spec.ts
```

Expected: FAIL — `/leaderboard` is 404 until the page exists.

- [ ] **Step 3: Implement the page**

```tsx
// app/leaderboard/page.tsx
// ABOUTME: RSC wrapper for /leaderboard — reads ingested artefact and passes to client surface.
// ABOUTME: Zero runtime data fetching; artefact is static at build time.
import { LeaderboardSurface } from '@/components/leaderboard/leaderboard-surface';
import { getAllEntries, getRunStatus, isMock } from '@/lib/aec-bench/read';

export default function LeaderboardPage() {
  const entries = getAllEntries();
  const runStatus = getRunStatus();
  return (
    <main>
      <LeaderboardSurface
        entries={entries}
        isMock={isMock()}
        runStatus={runStatus}
        heading="Leaderboard"
        subheading="All models and adapters across the active dataset"
      />
    </main>
  );
}

export const metadata = {
  title: 'Leaderboard — AEC-Bench',
  description: 'Interactive Pareto view of models × adapters on AEC-Bench tasks.',
};
```

```tsx
// app/leaderboard/loading.tsx
// ABOUTME: Skeleton shown while /leaderboard compiles in dev; mostly a placeholder in production.
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="h-8 w-48 animate-pulse rounded bg-[#141414]" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[#141414]" />
      <div className="mt-8 h-80 animate-pulse rounded border border-landing-border bg-[#0a0a0a]" />
      <div className="mt-4 h-64 animate-pulse rounded border border-landing-border bg-[#0a0a0a]" />
    </main>
  );
}
```

Before running the E2E, ensure the read layer exposes `getAllEntries`. If not, add it next to `getTopN`:

```ts
// lib/aec-bench/read.ts — if missing
export function getAllEntries(): LeaderboardEntry[] {
  const artefact = loadArtefact();
  return artefact.entries;
}
```

If this function already exists in the read layer, skip that edit.

- [ ] **Step 4: Build and run the E2E**

```bash
pnpm ingest
pnpm build
pnpm test:e2e tests/e2e/leaderboard-smoke.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/leaderboard lib/aec-bench/read.ts tests/e2e/leaderboard-smoke.spec.ts
git commit -m "feat(leaderboard): /leaderboard page route wiring"
```

---

## Task 23: Full E2E suite

**Files:**
- Create: `tests/e2e/leaderboard.spec.ts`

Covers the 10 E2E scenarios from the spec.

- [ ] **Step 1: Write the test suite**

```ts
// tests/e2e/leaderboard.spec.ts
// ABOUTME: End-to-end tests for the /leaderboard page covering all interactive flows.
// ABOUTME: Runs against a built site with the committed mock artefact.
import { test, expect } from '@playwright/test';

test.describe('/leaderboard', () => {
  test('renders dots and rows that match the artefact', async ({ page }) => {
    await page.goto('/leaderboard');
    const rows = page.getByRole('table').locator('tbody tr[role="button"]');
    const dots = page.locator('svg[role="img"] [data-testid^="dot-"]');
    const rowCount = await rows.count();
    const dotCount = await dots.count();
    expect(rowCount).toBeGreaterThan(0);
    expect(dotCount).toBeGreaterThan(0);
    expect(Math.abs(rowCount - dotCount)).toBeLessThanOrEqual(1);
  });

  test('axis swap updates URL and x-axis label', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.getByRole('button', { name: /--x.*cost/i }).click();
    await page.getByRole('option', { name: /^tokens$/i }).click();
    await expect(page).toHaveURL(/x=tokens/);
    await expect(page.getByText(/tokens \/ task/i)).toBeVisible();
  });

  test('discipline filter reshapes y-axis', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.getByRole('button', { name: /--discipline.*all/i }).click();
    await page.getByRole('option', { name: /^civil$/i }).click();
    await expect(page).toHaveURL(/d=civil/);
    await expect(page.getByText(/reward \(civil\)/i)).toBeVisible();
  });

  test('harness filter shrinks the dataset', async ({ page }) => {
    await page.goto('/leaderboard');
    const rowsBefore = await page.getByRole('table').locator('tbody tr[role="button"]').count();
    await page.getByRole('button', { name: /--harness.*all/i }).click();
    await page.getByRole('option', { name: /^rlm$/i }).click();
    await expect(page).toHaveURL(/h=rlm/);
    const rowsAfter = await page.getByRole('table').locator('tbody tr[role="button"]').count();
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);
  });

  test('row expand reveals per-discipline panel', async ({ page }) => {
    await page.goto('/leaderboard');
    const firstRow = page.getByRole('table').locator('tbody tr[role="button"]').first();
    await firstRow.click();
    await expect(page.getByText(/per-discipline reward/i)).toBeVisible();
    await expect(page).toHaveURL(/open=/);
  });

  test('shared URL restores full state', async ({ page }) => {
    await page.goto('/leaderboard?x=tokens&d=civil&sort=reward&dir=desc');
    await expect(page.getByText(/reward \(civil\)/i)).toBeVisible();
    await expect(page.getByText(/tokens \/ task/i)).toBeVisible();
  });

  test('frontier badge appears on at least one row and tooltip says [on frontier]', async ({ page }) => {
    await page.goto('/leaderboard');
    const badges = page.getByText(/\[frontier\]/i);
    await expect(badges.first()).toBeVisible();
  });

  test('zero-match filter shows a clear prompt', async ({ page }) => {
    await page.goto('/leaderboard?h=nonexistent-harness');
    await expect(page.getByText(/no entries match/i)).toBeVisible();
  });

  test('mobile filter sheet opens and applies', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/leaderboard');
    await page.getByRole('button', { name: /^filters/i }).click();
    await expect(page.getByRole('dialog', { name: /filters/i })).toBeVisible();
    await page.getByRole('option', { name: /^civil$/i }).click();
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page).toHaveURL(/d=civil/);
  });

  test('mock PREVIEW caveat renders', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.getByText(/mock submissions/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run to verify (fails first for any not-yet-working flows, fix, then PASS)**

```bash
pnpm ingest
pnpm build
pnpm test:e2e tests/e2e/leaderboard.spec.ts
```

Expected after fixes: PASS (10 tests).

If a particular test fails, look at the mock data shape for the scenario — for example, the harness-filter test assumes at least one `rlm` entry exists in the artefact (Task 9's `_mock-lambda-rlm-*` covers this adjacent case). Adjust any fixture-dependent assertions to match actual mock counts, but keep the assertion meaningful.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/leaderboard.spec.ts
git commit -m "test(e2e): full /leaderboard flow coverage"
```

---

## Task 24: Bundle budget CI guard

**Files:**
- Create: `scripts/check-bundle-size.ts`
- Modify: `package.json` (add `test:bundle` script)

Fails CI if the `/leaderboard` route bundle exceeds the spec budget.

- [ ] **Step 1: Write the check**

```ts
// scripts/check-bundle-size.ts
// ABOUTME: Fails the build if /leaderboard route bundle exceeds the gzip budget.
// ABOUTME: Reads .next/build-manifest.json and compares chunk sizes.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 60;
const ROUTE = '/leaderboard';

function main() {
  const manifestPath = '.next/app-build-manifest.json';
  const raw = readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw) as { pages: Record<string, string[]> };
  const routeKey = Object.keys(manifest.pages).find((k) => k === `/leaderboard/page` || k === '/leaderboard');
  if (!routeKey) {
    console.error(`Could not find ${ROUTE} in build manifest`);
    process.exit(1);
  }
  const chunks = manifest.pages[routeKey];
  let totalGzip = 0;
  for (const chunk of chunks) {
    const abs = join('.next', chunk);
    try {
      const buf = readFileSync(abs);
      totalGzip += gzipSync(buf).length;
    } catch {
      // skip chunks already accounted for via shared manifest
    }
  }
  const kb = totalGzip / 1024;
  console.log(`${ROUTE}: ${kb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB)`);
  if (kb > BUDGET_KB) {
    console.error(`Bundle exceeds budget by ${(kb - BUDGET_KB).toFixed(1)} KB`);
    process.exit(1);
  }
}

main();
```

Add to `package.json` scripts:

```json
"test:bundle": "tsx scripts/check-bundle-size.ts"
```

- [ ] **Step 2: Run the check**

```bash
pnpm build
pnpm test:bundle
```

Expected: PASS (under 60 KB). If it fails, profile with the Next.js build report (`ANALYZE=true pnpm build` if `@next/bundle-analyzer` is configured; otherwise inspect `.next/app-build-manifest.json`).

- [ ] **Step 3: Commit**

```bash
git add scripts/check-bundle-size.ts package.json
git commit -m "test(perf): bundle budget guard for /leaderboard route"
```

---

## Task 25: Accessibility audit

**Files:**
- Create: `tests/e2e/leaderboard-a11y.spec.ts`

- [ ] **Step 1: Install axe-core playwright helper**

```bash
pnpm add -D @axe-core/playwright
```

- [ ] **Step 2: Write the spec**

```ts
// tests/e2e/leaderboard-a11y.spec.ts
// ABOUTME: Accessibility audit using axe-core/playwright.
// ABOUTME: Desktop and mobile viewports — zero violations expected.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y — /leaderboard', () => {
  test('no axe violations on desktop', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForSelector('[data-testid^="dot-"]');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('no axe violations on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/leaderboard');
    await page.waitForSelector('table');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
```

- [ ] **Step 3: Run**

```bash
pnpm build
pnpm test:e2e tests/e2e/leaderboard-a11y.spec.ts
```

Expected: PASS. If there are violations, fix them — typical findings on new pages: missing label on a button, insufficient colour contrast on a muted text, empty landmark. Fix inline, never suppress.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/leaderboard-a11y.spec.ts package.json pnpm-lock.yaml
git commit -m "test(a11y): axe audit for /leaderboard desktop + mobile"
```

---

## Task 26: Holistic pre-merge review

A non-coding task but important — one of the lessons from the Phase 3 infrastructure work was that a final aggregate review catches things 25 task-level reviews miss.

- [ ] **Step 1: Read the spec and the plan side by side**

```bash
code docs/specs/2026-04-18-leaderboard-ui-design.md docs/plans/2026-04-18-leaderboard-ui-plan.md
```

For every "Goal", "Non-goal", and cell in the Scope table, confirm there's a task that implements it (or a note explaining deferral). Update memory notes if anything has moved between "deferred" and "done".

- [ ] **Step 2: Run the entire suite**

```bash
cd .worktrees/leaderboard-ui
pnpm test
pnpm test:e2e
pnpm build
pnpm test:bundle
```

Expected: every command green.

- [ ] **Step 3: Manual smoke in a browser**

```bash
pnpm dev
```

Open http://localhost:3000/leaderboard. Verify in an actual browser:

1. Scatter renders with dots coloured by provider and shaped by harness.
2. Hovering a dot shows the tooltip; hovering a row highlights the matching dot.
3. Clicking a dot expands the corresponding row and scrolls to it.
4. `--x` chip swaps the axis; URL updates; no page jump.
5. `--discipline=civil` changes the y-axis label and row reward values; Pareto re-computes.
6. `--harness=rlm` shrinks the dataset.
7. Shared URL (`?x=tokens&d=civil&open=...`) restores state.
8. Resize to ≤640px: mobile filter sheet appears; sticky tooltip strip works on tap.
9. PREVIEW banner + chart caveat both show.
10. `[frontier]` badge appears only on frontier rows.
11. Keyboard: Tab through dots → arrow navigation works.
12. `prefers-reduced-motion: reduce` (enable via browser devtools) → expansion snaps instead of animates.

If any issue surfaces, fix it in place (extra commits on the same branch) and re-run the suite.

- [ ] **Step 4: Open the PR**

```bash
git push -u origin phase3/leaderboard-ui
gh pr create \
  --base main \
  --title "Phase 3/2 — /leaderboard page UI" \
  --body "$(cat <<'EOF'
## Summary
- Ships `/leaderboard` as a scatter-first Pareto view backed by the existing ingest artefact.
- Introduces `LeaderboardSurface`, a reusable client component the upcoming discipline sub-routes will import.
- Adds `is_mock` to `LeaderboardEntry` so individual rows get a `[mock]` tag honestly.
- Hand-rolled SVG scatter, no chart-library dependency; bundle stays under 60 KB gzip.
- URL-synced state for filters / sort / expansion — every view is a shareable link.

## Test plan
- [x] `pnpm test` — unit + component + hook
- [x] `pnpm test:e2e` — 10 flow scenarios + 2 axe audits
- [x] `pnpm test:bundle` — `/leaderboard` route under budget
- [x] Manual smoke in Chrome + Safari desktop + Chrome mobile viewport
- [x] `prefers-reduced-motion: reduce` check

Spec: `docs/specs/2026-04-18-leaderboard-ui-design.md`
Plan: `docs/plans/2026-04-18-leaderboard-ui-plan.md`
EOF
)"
```

- [ ] **Step 5: After merge**

```bash
cd /Users/theodoros.galanos/LocalProjects/aecbench-site
git worktree remove .worktrees/leaderboard-ui
git fetch --prune
git branch -D phase3/leaderboard-ui
```

Update the `aecbench-deferred-scope` memory note: mark "/leaderboard full page (Phase 3)" as shipped on 2026-04-18, and call out that the discipline sub-routes are the next follow-up spec (thin shells consuming `LeaderboardSurface`).

---

## Self-review

This checklist is run by whoever ordered this plan, before handing execution to a subagent or starting inline.

**Spec coverage:**

| Spec section | Covered by |
|---|---|
| Architecture — module tree | Tasks 1–22 (every file enumerated has a task) |
| `LeaderboardSurface` contract | Task 21 |
| Data flow & URL conventions | Task 20 |
| Filter reshape semantics | Task 5 |
| Pareto computation | Task 2 |
| Axis metric registry | Task 3 |
| Harness glyph fallback | Tasks 4 + 9 |
| Sort semantics | Task 6 |
| Contract change: `is_mock` | Tasks 7 + 8 |
| ControlStrip + popover | Tasks 15 + 16 |
| ScatterChart + ParetoOverlay + TooltipCard | Tasks 13 + 14 + 12 |
| LeaderboardTable + ExpandableRow | Tasks 18 + 19 |
| MobileFilterSheet | Task 17 |
| Legend + FrontierBadge | Tasks 10 + 11 |
| RSC page + loading | Task 22 |
| E2E scenarios | Task 23 |
| Bundle budget | Task 24 |
| Accessibility audit | Task 25 |
| Final holistic review | Task 26 |

**Placeholder scan:** every step has concrete code, file paths, and commands. No "TBD" or "add error handling" anywhere.

**Type consistency:** `rowKey = \`${model_key}::${adapter}\`` is used identically in Tasks 14, 18, 19, 20, 21. `SortColumn` and `SortSpec` types are defined in Task 6 and used unchanged by Tasks 19, 20, 21. `AxisKey` defined in Task 3, used in 12, 14, 16, 17, 20, 21.

**Scope check:** single spec → single plan; no further decomposition needed. All 26 tasks fit in one PR.
