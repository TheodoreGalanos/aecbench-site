---
title: Leaderboard UI — Design
date: 2026-04-18
status: ready-to-plan
scope: Phase 3 sub-project 2 of 3 — the `/leaderboard` page plus a shared `LeaderboardSurface` component contract. Discipline sub-routes (`/leaderboard/[discipline]`) are a thin follow-up spec that consumes this component. Model detail (`/leaderboard/models/[slug]`) is Phase 4.
---

# Leaderboard UI — Design

## Context

The Phase 3 infrastructure spec (`2026-04-18-leaderboard-infra-design.md`) landed on `main` at commit `97c62b9`. It emits typed JSON artefacts to `public/data/` and exposes a read layer (`lib/aec-bench/read.ts`) with `getAllEntries`, `getByDiscipline`, `getRunStatus`, `isMock`. The landing page already consumes that data via `components/landing/data.ts` and `components/landing/run-status.ts`.

This spec covers the `/leaderboard` page itself — the surface that renders *all* entries with an interactive Pareto scatter, a filterable sortable table, and expandable per-row detail. It also defines the `LeaderboardSurface` component contract so the five discipline subroutes (`/leaderboard/[discipline]`) can be written as thin wrappers in a follow-up spec, without reopening UX decisions.

The design language is set: dark charcoal + amber `#e8a838` + teal `#38b2ac` + blueprint grid + JetBrains Mono UI chrome, matching the landing page. No new visual language is introduced here. `/leaderboard` is dark-only (like `/`), not a Fumadocs-themed page — Fumadocs light/dark toggling applies only to `/docs`.

## Goals

1. Answer the first-time visitor's question — "which model is on the frontier?" — in under three seconds, via a scatter-first layout.
2. Give researchers a sortable, filterable, per-discipline-slice-aware table beneath the chart, with inline expandable detail that delivers real value even while model detail pages (Phase 4) are unbuilt.
3. Produce a reusable `LeaderboardSurface` component whose props make discipline pages (civil, electrical, ground, mechanical, structural) a thin wrapper — no UX re-design required.
4. Keep bundle weight low by hand-rolling the scatter in SVG rather than pulling in a chart library.
5. Ship URL-shareable state so a filtered / sorted / row-expanded view can be linked, bookmarked, and tweeted.
6. Be honest about mock data (existing `PreviewBanner` plus per-row `[mock]` tags and a chart caveat).

## Non-goals

- **Model detail route** `/leaderboard/models/[slug]` — Phase 4.
- **Discipline sub-route implementations** — a separate spec that *uses* this one's component contract.
- **Step-count axis** — library doesn't persist agent-loop step counts yet; tracked as a library gap (`aecbench-lib-gaps`).
- **Server-side URL-filter bootstrapping** — deferred to a later optimisation (`aecbench-leaderboard-ssr-filters`).
- **Real-time updates** — the artefact is static at build; no websocket / polling.
- **Per-discipline cost** — library only tracks overall `mean_cost_usd`; the x-axis is overall cost regardless of discipline filter. Noted in the UI.

## Scope & boundaries

| In scope | Out of scope |
|---|---|
| `/leaderboard` page (`app/leaderboard/page.tsx`) | `/leaderboard/[discipline]` routes |
| `LeaderboardSurface` shared component + its API | `/leaderboard/models/[slug]` route |
| Hand-rolled scatter chart with Pareto overlay | Any chart library dependency |
| URL-synced filter / sort / expanded-row state | Server-side URL-filter bootstrapping |
| Per-entry `is_mock` flag in the ingest pipeline | Real-time data updates |
| Mobile responsive behaviour down to 320px | Native mobile app surface |
| Full accessibility (keyboard, screen reader, reduced motion) | Colour-blind palette overrides (colour plus shape/text already covers this) |

## Architecture

### Module tree

```text
app/leaderboard/
  page.tsx                             # RSC; reads ingest artefact; renders <LeaderboardSurface>
  loading.tsx                          # Skeleton shimmer (optional, low priority)

components/leaderboard/
  leaderboard-surface.tsx              # Top-level client container; wires hook + layout
  use-leaderboard-state.ts             # Custom hook owning filter/sort/axis/expanded state + URL sync
  control-strip.tsx                    # CLI-prompt row: --x · --discipline · --harness chips
  control-strip-popover.tsx            # Tiny dropdown picker for chip values
  scatter-chart.tsx                    # Hand-rolled SVG scatter
  pareto-overlay.tsx                   # Dashed amber polyline; consumes frontier Set
  leaderboard-table.tsx                # Table container; header + sort controls
  expandable-row.tsx                   # One row; collapsed + expanded states
  tooltip-card.tsx                     # Floating tooltip (desktop) / sticky strip (mobile)
  mobile-filter-sheet.tsx              # Bottom sheet for <640px filter UI
  legend.tsx                           # Provider colour key + harness shape key
  frontier-badge.tsx                   # Small "[frontier]" pill used by both chart and rows

lib/aec-bench/
  pareto.ts                            # computeParetoFrontier — pure, O(n²), tested exhaustively
  axis-metric.ts                       # Axis key → accessor, domain, label, formatter
  filter.ts                            # Pure filter + discipline-reshape helpers
  sort.ts                              # Pure sort helpers (nullable Δ, alpha, numeric)
  harness-glyph.ts                     # adapter → SVG shape + fallback diamond

tests/leaderboard/
  pareto.test.ts
  filter.test.ts
  sort.test.ts
  axis-metric.test.ts
  harness-glyph.test.ts
  use-leaderboard-state.test.tsx
  scatter-chart.test.tsx
  leaderboard-table.test.tsx
  expandable-row.test.tsx
  control-strip.test.tsx
  leaderboard-surface.test.tsx
  fixtures/                            # synthetic LeaderboardEntry[] for unit tests

tests/e2e/
  leaderboard.spec.ts                  # Playwright: full page flows
```

### Component contract (`LeaderboardSurface`)

```typescript
interface LeaderboardSurfaceProps {
  entries: LeaderboardEntry[];         // already-ingested artefact slice
  isMock: boolean;                     // artefact-level flag for the chart caveat
  runStatus: RunStatus;                // dataset metadata line under the heading
  heading: string;                     // "Leaderboard" on main page, "Civil Engineering" on civil sub-route
  subheading?: string;                 // optional sub-line
  lockedDiscipline?: Domain;           // when set, the --discipline chip is hidden and pinned
  lockedHarness?: string;              // symmetric (unused by Phase 3 but defined for future)
  trailingSlot?: ReactNode;            // rendered below the table — discipline pages use it for sample-tasks list
}
```

**Main page usage:**

```tsx
<LeaderboardSurface
  entries={getAllEntries()}
  isMock={isMock()}
  runStatus={getRunStatus()}
  heading="Leaderboard"
/>
```

**Future discipline-page usage (informative):**

```tsx
<LeaderboardSurface
  entries={getByDiscipline('civil')}
  isMock={isMock()}
  runStatus={getRunStatus()}
  heading="Civil Engineering"
  subheading="Site-specific structural and earthworks tasks"
  lockedDiscipline="civil"
  trailingSlot={<SampleTasksList discipline="civil" />}
/>
```

### Architecture principles

- **RSC → client boundary at `<LeaderboardSurface>`.** `page.tsx` is a server component that reads static JSON; it passes serialised props into the client container. No runtime data fetching.
- **Single source of truth: the hook.** All interactive state lives inside `useLeaderboardState`. Children receive state + setters as props and are free of `useState`. This makes every child trivially unit-testable with fixture state.
- **Pure logic in `lib/aec-bench/`.** `pareto.ts`, `filter.ts`, `sort.ts`, `axis-metric.ts` are pure functions — zero React, zero DOM, zero imports from `components/`. They hold all logic that could be wrong and are covered by exhaustive vitest tests.
- **Hand-rolled SVG.** No chart library. One responsive SVG with viewBox, manual linear scales, semantic `<g>` groups. Interactivity is React state + event handlers on invisible hit rectangles.
- **Small focused files.** Target <200 lines per file; any longer is a signal to split. Matches the existing landing-component style.

## Data flow & state

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Build time — scripts/ingest                                          │
│   results/experiments/** → aggregate → public/data/leaderboard.json  │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Request time — app/leaderboard/page.tsx (RSC)                        │
│   entries   = getAllEntries()                                        │
│   runStatus = getRunStatus()                                         │
│   isMock    = isMock()                                               │
└──────────────────────────────────────────────────────────────────────┘
                                   │  (serialised props across RSC/client)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Client — <LeaderboardSurface>                                        │
│   useLeaderboardState(entries, { lockedDiscipline, lockedHarness })  │
│     ├── reads URL on mount: x, d, h, sort, dir, open                 │
│     ├── state (URL-synced):                                          │
│     │     { axisX, disciplines[], harnesses[], sort, expandedRowKey }│
│     ├── state (ephemeral): { hoveredRowKey }                         │
│     ├── derived (useMemo):                                           │
│     │     reshaped = filter(entries, filters)                        │
│     │     sorted   = sortBy(reshaped, sort)                          │
│     │     points   = toScatterPoints(reshaped, axisX)                │
│     │     frontier = computeParetoFrontier(points)                   │
│     │       (frontier is shared with ScatterChart AND Table —        │
│     │        both need it for ring + [frontier] badge)               │
│     └── setters → router.replace(?x=...&d=...&h=...&sort=...&open=...│
│                                                                      │
│   Layout:                                                            │
│     <section aria-labelledby="leaderboard-heading">                  │
│       <header>{heading}{subheading}{runStatus line}{preview caveat}} │
│       <ControlStrip />                                               │
│       <ScatterChart>                                                 │
│         <ParetoOverlay />                                            │
│         <TooltipCard />                                              │
│       </ScatterChart>                                                │
│       <Legend />                                                     │
│       <LeaderboardTable>                                             │
│         <ExpandableRow />*                                           │
│       </LeaderboardTable>                                            │
│       {trailingSlot}                                                 │
│     </section>                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### State shape

```typescript
interface LeaderboardState {
  axisX: 'cost' | 'tokens' | 'latency';
  disciplines: Domain[];                  // empty = "all"
  harnesses: string[];                    // empty = "all"
  sort: { column: SortColumn; dir: 'asc' | 'desc' };
  expandedRowKey: string | null;          // "model_key::adapter"
  hoveredRowKey: string | null;           // NOT URL-synced
}

type SortColumn =
  | 'rank' | 'model' | 'reward' | 'delta' | 'tokens' | 'cost'
  | 'civil' | 'electrical' | 'ground' | 'mechanical' | 'structural';
```

### URL param convention

```text
/leaderboard?x=cost&d=civil,electrical&h=rlm&sort=reward&dir=desc&open=claude-opus-4.7::rlm
```

- Missing params fall back to defaults: `x=cost`, no filters, `sort=rank&dir=asc`, no open row.
- `d` and `h` are comma-separated; absent or empty means "all".
- `open` is the rowKey of an expanded row; cleared automatically if the row is filtered out.
- Hover state (`hoveredRowKey`) never enters the URL.
- URL updates use `router.replace()` with `scroll: false` — no history pollution and no scroll jumps.

### Reshape on discipline filter (critical)

| Filter | Y-axis meaning | X-axis meaning | Entry set |
|---|---|---|---|
| disciplines = [] | `entry.reward` (overall) | `mean_cost_usd` / `mean_tokens` / `mean_duration_seconds` | all entries |
| disciplines = ['civil'] | `entry.per_discipline.civil` | same (x-axis always overall) | entries with a civil score |
| disciplines = ['civil','electrical'] | mean of `per_discipline.civil` and `per_discipline.electrical` | same | entries with both scores |
| harnesses = ['rlm'] | unchanged (still overall or reshaped by discipline) | same | entries where `adapter === 'rlm'` |

The chart header explicitly labels the y-axis accordingly: `reward (overall)`, `reward (civil)`, `reward (civil + electrical mean)`.

A small footnote near the x-axis label reads `cost / tokens / latency are overall across all disciplines — library does not yet track per-discipline costs` (shown only when at least one discipline filter is active, suppressed otherwise to avoid noise).

## Component specs

### `ControlStrip` (`components/leaderboard/control-strip.tsx`)

Renders the compact CLI prompt:

```text
$ bench leaderboard --x [cost ▾]  --discipline [all ▾]  --harness [all ▾]
```

- Three interactive chips: `[cost ▾]`, `[all ▾]` (discipline), `[all ▾]` (harness).
- Each chip opens a `ControlStripPopover` on click.
- The x-axis chip is single-select: `cost | tokens | latency`.
- The discipline chip is multi-select: none = "all", any subset of the 5 domains. When `lockedDiscipline` is set, this chip is hidden.
- The harness chip is multi-select: none = "all", any subset of adapters actually present in `entries` (derived at render time, not hardcoded).
- Chip label reads: for single-select, the active value (`cost`); for multi-select with 0 or all selected, `all`; with 1 selected, the value (`civil`); with 2+ selected, `civil +1` (count of additional).
- Hovered chip gets a subtle amber underline; focused chip gets a full amber outline (keyboard nav).
- Clicking outside an open popover closes it. Escape closes.

### `ControlStripPopover`

- Anchored below the triggering chip, positioned with `element.getBoundingClientRect()`.
- Lists options as a compact checklist (multi-select) or radio (x-axis).
- Multi-select popovers include an `× clear` row at the top (sets that chip back to "all").
- `role="listbox"` + roving `aria-activedescendant`; arrow keys navigate; Enter/Space toggles.

### `ScatterChart` (`components/leaderboard/scatter-chart.tsx`)

One responsive SVG (`viewBox="0 0 800 400"`, `preserveAspectRatio="xMidYMid meet"`, CSS `width: 100%; height: auto`).

**Layout regions (inset 40 left / 16 right / 16 top / 40 bottom for axis labels):**

```tsx
<svg viewBox="0 0 800 400">
  <defs>                  # glow filter for hover
  <g class="gridlines">   # every 0.1 reward; quartile marks on x
  <g class="axes">        # x and y axis lines, tick marks, tick labels
  <g class="axis-labels"> # x-axis caption, y-axis caption (rotated), footnote
  <g class="pareto">      # <ParetoOverlay /> child
  <g class="dots">        # one interactive group per entry
  <g class="annotations"> # "on frontier" mini-labels on hovered frontier dot
</svg>
<TooltipCard />           # rendered outside SVG; positioned via state
```

**Scales (hand-written, no d3):**

```typescript
function makeLinearScale(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  const slope = (rangeMax - rangeMin) / (domainMax - domainMin);
  return (v: number) => rangeMin + (v - domainMin) * slope;
}
```

- **X:** `makeLinearScale(0, dataMax * 1.05, plotLeft, plotRight)`. Headroom 5% on the right.
- **Y:** `makeLinearScale(0, 1, plotBottom, plotTop)`. Inverted (0 at bottom, 1 at top).
- X ticks: 5 evenly-spaced. X tick labels formatted by the axis metric: `$1.80`, `46k`, `12.4s`.
- Y ticks: `0, 0.2, 0.4, 0.6, 0.8, 1.0`.

**Dot encoding:**

| Dimension | Encoding |
|---|---|
| x | scaled `axisMetric.accessor(entry)` |
| y | scaled reshaped reward |
| fill colour | provider: `anthropic #b5651d` / `openai #38b2ac` / `google #e8a838` / `meta #9333ea` / `other #888` |
| shape | harness: `tool_loop` = circle, `rlm` = square (rotated 45°), `direct` = triangle, `lambda-rlm` = hollow circle with thick stroke. Any unrecognised adapter falls back to a diamond shape. Shape mapping is defined in `lib/aec-bench/harness-glyph.ts`. |
| size at rest | ~8px equivalent radius (shape-adjusted to keep visual weight equal) |
| frontier indicator | 2px amber outer ring |
| hover | scale 1.4×, amber glow filter, fill unchanged |
| expanded-match | solid amber ring even when not hovered |

**Interactivity:**
- Each dot group is `<g role="button" tabIndex={0} aria-label="claude-opus-4.7 rlm, reward 0.82, cost $1.80">`.
- `onMouseEnter` → `setHoveredRowKey(key)`. `onMouseLeave` → `setHoveredRowKey(null)`.
- Transparent invisible hit rectangles at 20×20 px around each dot for generous hover targets; they don't re-render on hover (CSS `:hover` on dot visual).
- `onClick` / Enter / Space → `setExpandedRowKey(key)` and scroll the matching table row into view.
- Arrow Left/Right on a focused dot: move focus to the nearest-x neighbour (tested in scatter-chart.test.tsx).
- Escape on a focused dot: blur and clear any expansion.

**Cross-highlight with table:**
- When `hoveredRowKey !== null`, the matching table row gets a subtle amber left-border (CSS-only).
- When `expandedRowKey !== null`, the matching dot wears the solid amber ring (React state).

### `ParetoOverlay` (`components/leaderboard/pareto-overlay.tsx`)

- Consumes `frontierKeys: Set<string>` + `points: ScatterPoint[]`.
- Filters `points` to the frontier set, sorts by x ascending.
- Renders a single `<polyline>` with `stroke="#e8a838" stroke-width="1.5" stroke-dasharray="4,3" fill="none"`.
- Returns `null` if `points.length < 3` — the line is not meaningful on a handful of entries.
- Does NOT render the frontier dots themselves — those are rendered by the chart's main dot layer with the amber ring applied.

### `TooltipCard` (`components/leaderboard/tooltip-card.tsx`)

**Desktop (≥640px):**
- Absolutely positioned container, 12px to the right + 12px above the cursor by default.
- Flips sides automatically when within 240px of the viewport's right or top edge.
- Content:

```text
claude-opus-4.7 · rlm
reward   0.82  [0.79 – 0.85]
cost     $1.80 / task
tokens   46k avg
latency  12.4s avg
trials   180 · reps 30
───────────────────────
[on frontier]           # only shown if in frontierKeys
```

- Styled as the terminal window chrome — thin amber border, `#050505` bg, JetBrains Mono, 12px.

**Mobile (<640px):**
- Replaces the floating card with a sticky strip at the bottom of the chart — position: sticky inside the chart container.
- Tap a dot → strip fills. Tap the empty chart background → strip clears.
- Same content as desktop.

### `LeaderboardTable` (`components/leaderboard/leaderboard-table.tsx`)

Renders an accessible `<table role="table">` inside a terminal window chrome (same style as the landing preview).

**Window chrome:**

```
┌───────────────────────────────────────────────────────────────────────┐
│  ~/aec-bench / leaderboard                      21 rows · 7 on frontier│
├───────────────────────────────────────────────────────────────────────┤
│  aec-bench ~ $ sort --by reward --desc                            › ok │
├───────────────────────────────────────────────────────────────────────┤
│  <table />                                                             │
└───────────────────────────────────────────────────────────────────────┘
```

**Header (desktop, `<thead>`):**

| Column | Key | Sort caret | Alignment |
|---|---|---|---|
| `#` | none (rank derived) | no | left, amber |
| `MODEL` | model | alpha | left |
| `PER-DISCIPLINE` | (bar column; sub-sort via bar click) | no (but bar hover shows per-discipline labels) | left |
| `REWARD` | reward | numeric | right, amber |
| `Δ LAST` | delta | numeric (nulls last) | right |
| `TOKENS` | tokens | numeric | right, muted |
| `$` | cost | numeric | right, muted |

- Click header → sort by that column. Click same header twice → flip direction.
- Active column wears an amber caret: `▾` for desc, `▴` for asc.
- Default: `sort.column='rank'`, `sort.dir='asc'` (equivalent to reward desc).
- Sort state is URL-synced.

**Per-discipline bar sub-sort:** clicking one of the 5 micro-bars inside a row's per-discipline cell sorts the table by that discipline. The column header then reads `PER-DISCIPLINE (civ)` to make the active scope clear, and clicking it again flips direction or clears (three-state cycle: asc → desc → off).

**Rows:** one `<ExpandableRow />` per entry from `sorted`. Rows keyed by `rowKey = "${model_key}::${adapter}"`.

### `ExpandableRow` (`components/leaderboard/expandable-row.tsx`)

**Collapsed state (default, ~44px desktop / ~60px mobile tall):**

```text
01  claude-opus-4.7 · rlm       ▌ ▌ ▌ ▌ ▌    0.82   +0.02    46k   $1.80
    anthropic                                 [frontier]
```

- Row is `<tr aria-label={modelName} tabIndex={0}>` with click + Enter/Space handlers. (axe rejected `role="button"` + `aria-expanded` on `<tr>` inside `<table>`; the row keeps its implicit `row` role, stays keyboard-reachable, and is found by tests via `aria-label`.)
- `onClick` / Enter / Space → `toggleExpanded(rowKey)`.
- If hovered, adds subtle amber left-border and slight bg tint — also triggered when `hoveredRowKey === rowKey` from scatter hover.

**Expanded state (click or arrow from scatter dot):**

```
▾ 01  claude-opus-4.7 · rlm       ▌ ▌ ▌ ▌ ▌    0.82   +0.02   46k   $1.80
      anthropic                                  [frontier]
      ┌────────────────────────────────────────────────────────────────┐
      │ per-discipline reward                                          │
      │   civ  ele  grd  mch  str                                      │
      │  0.84 0.79 0.81 0.86 0.80                                      │
      │                                                                │
      │ 95% CI                   [0.79 – 0.85]                         │
      │ trials                   180 (30 reps × 6 tasks)               │
      │ last submission          2h ago                                │
      │ Δ vs previous run        +0.02 (previous: 0.80)                │
      │                                                                │
      │ full model detail coming in Phase 4 →                          │
      └────────────────────────────────────────────────────────────────┘
```

- Expanded content inserts as a `<tr><td colSpan={7}>...</td></tr>` below the row.
- Framer Motion animates height and opacity over 180ms ease-out (disabled under `prefers-reduced-motion`).
- Only one row can be expanded at a time; opening row B closes row A.
- When a row expands, `scrollIntoView({ block: 'nearest' })` runs for the row and also for the matching scatter dot (the dot gets a JS-triggered attention pulse, respecting reduced motion).
- The "Phase 4 →" link is `<Link href="/leaderboard/models/[slug]">` but disabled (greyed out, no hover) until Phase 4 lands.

**Mobile collapsed row (<640px):**
- Hides `PER-DISCIPLINE`, `Δ LAST`, `TOKENS` columns.
- Keeps `#`, `MODEL`, `REWARD`, `$`.
- Hidden columns reappear in the expanded panel with the same content.

### `MobileFilterSheet` (`components/leaderboard/mobile-filter-sheet.tsx`)

- Visible only at `<640px`. Above 640px, `ControlStrip` renders in place instead.
- Below the chart header, a single `[ filters (2) ]` button shows the count of active filters.
- Tap opens a bottom sheet (framer-motion slide-up). The sheet content is the same three chips but stacked vertically, each with its popover expanded inline.
- Sheet has a sticky `[apply]` button at the bottom that closes the sheet and commits state. Unlike desktop, mobile batches selections locally and writes them to the URL only on apply — this avoids thrashing the chart mid-selection. The hook exposes a `batchedFilters` setter used exclusively by `MobileFilterSheet`; all other surfaces call the live setter.

### `Legend` (`components/leaderboard/legend.tsx`)

- Horizontal row below the chart, above the table.
- Left side: provider colour dots — anthropic / openai / google / meta / other.
- Right side: harness shapes — tool_loop circle, rlm square, direct triangle, lambda-rlm ring.
- On mobile, wraps to two lines.
- Muted typography; same as landing preview's legend style.

### `FrontierBadge` (`components/leaderboard/frontier-badge.tsx`)

- Tiny `<span>` — `[frontier]` in amber, 1px amber border, 9px JetBrains Mono, 2px / 6px padding.
- Used by `ExpandableRow` next to the model name when `frontierKeys.has(rowKey)`.
- Also used inside the tooltip when hovered dot is on frontier.

## Pareto computation (`lib/aec-bench/pareto.ts`)

```typescript
export interface ScatterPoint {
  key: string;        // "${model_key}::${adapter}"
  x: number;          // cost / tokens / latency
  y: number;          // reward (reshaped if discipline-filtered)
}

export function computeParetoFrontier(
  points: ReadonlyArray<ScatterPoint>,
): ReadonlySet<string> {
  // A point P is on the frontier iff NO other point Q has:
  //   Q.x <= P.x  AND  Q.y >= P.y  AND  (Q.x < P.x OR Q.y > P.y)
  // i.e., Q dominates P.
  //
  // Ties: if two points have the same (x, y), neither dominates the other — both are on the frontier.
  // O(n²), n ≈ 40 max.
}
```

### Frontier test cases

| Case | Input | Expected |
|---|---|---|
| Empty | `[]` | `Set()` |
| Single | `[a]` | `Set([a.key])` |
| All dominated by one | `[{x:1,y:1}, {x:2,y:0.5}, {x:3,y:0.3}]` | `Set([a])` |
| All equal | `[{x:1,y:1}, {x:1,y:1}, {x:1,y:1}]` | `Set([a, b, c])` |
| Classic trade-off | `[{x:1,y:0.4}, {x:2,y:0.6}, {x:3,y:0.8}, {x:2,y:0.5}]` | `Set([a, b, c])` — d is dominated by b |
| Ties at same point | `[{x:1,y:0.5}, {x:1,y:0.5}, {x:2,y:0.8}]` | `Set([a, b, c])` |
| Floating-point edge | `[{x:1.0000001,y:0.5}, {x:1,y:0.5}]` | `Set([b])` — strictly better x |

## Filter semantics (`lib/aec-bench/filter.ts`)

```typescript
export interface LeaderboardFilters {
  disciplines: Domain[];    // empty = all
  harnesses: string[];      // empty = all
}

export function filterAndReshape(
  entries: LeaderboardEntry[],
  filters: LeaderboardFilters,
): LeaderboardEntry[];
```

Behaviour:

1. If `harnesses.length > 0`, drop entries where `entry.adapter` is not in `harnesses`.
2. If `disciplines.length === 0`, return as-is (no reshape).
3. If `disciplines.length > 0`:
   - Drop entries that have no `per_discipline` score for any of the selected disciplines.
   - Replace `entry.reward` with the mean of `entry.per_discipline[d]` for d in selected disciplines.
   - Replace `entry.reward_ci` with `null` (we can't trivially re-derive CI from stored aggregates — noted below).
   - Leave cost/tokens/latency fields unchanged.
4. Ranks are recomputed after sort, not preserved from the original artefact.

**CI reshape caveat:** when disciplines are filtered, `entry.reward_ci` is nulled because we don't store per-discipline CIs in the aggregate artefact. The row-level CI display shows `—` in that case. This is an acceptable MVP limitation — tracked as follow-up (per-discipline CI emission in ingest).

## Sort semantics (`lib/aec-bench/sort.ts`)

```typescript
export function sortEntries(
  entries: LeaderboardEntry[],
  sort: { column: SortColumn; dir: 'asc' | 'desc' },
): LeaderboardEntry[];
```

- Numeric columns (reward, delta, tokens, cost, per-discipline): standard numeric compare. `null` / `undefined` go to the end regardless of direction.
- Alpha columns (model): `localeCompare` on `model_display`.
- `rank` column sorts by reward desc (so "rank asc" = best first) — equivalent to `sort=reward&dir=desc` with opposite semantic label.
- Stable sort (Array.prototype.sort in V8 is stable since 2019).

## Axis metric (`lib/aec-bench/axis-metric.ts`)

```typescript
export type AxisKey = 'cost' | 'tokens' | 'latency';

export interface AxisMetric {
  key: AxisKey;
  label: string;                        // "cost / task (USD)"
  accessor: (e: LeaderboardEntry) => number | null;
  format: (v: number) => string;        // "$1.80" | "46k" | "12.4s"
}

export const AXIS_METRICS: Record<AxisKey, AxisMetric>;
```

- `cost` → `mean_cost_usd`, formatted `$X.XX`.
- `tokens` → `mean_tokens`, formatted as `46k` / `1.2M` / etc.
- `latency` → `mean_duration_seconds`, formatted as `12.4s` or `2.3min`.
- Entries with null x values are excluded from the scatter (logged to console in dev) but still appear in the table.

## Accessibility

| Concern | Implementation |
|---|---|
| Keyboard navigation | All interactive elements (dots, rows, chips) are tab-focusable. Arrow keys navigate dots (nearest-x) and rows (up/down). Enter/Space activates. Escape closes popovers and clears expansion. |
| Screen reader | Chart dots are `<g role="button" aria-label="model adapter, reward X, cost Y">` inside an `<svg role="group">`. Table rows are `<tr aria-label={modelName}>` (implicit `row` role; click + keyboard handlers wired). Popovers are `role="listbox"` with `aria-activedescendant`. |
| Colour-blind safety | Provider colour is always paired with a harness shape and the text label in rows. Δ uses `+`/`−` glyphs alongside green/red. Frontier uses `[frontier]` text plus amber ring. |
| Focus indicators | All interactive elements receive a 2px amber outline on `:focus-visible`. Outlines are never `outline: none`. |
| Reduced motion | `prefers-reduced-motion: reduce` disables: expansion animation, dot hover scale, frontier pulse, scroll-into-view smooth behaviour. Content and toggling still work. |
| Contrast | All text meets WCAG AA against the charcoal background. Muted text (#888) is checked against #0a0a0a (ratio ~7.5:1). |
| Landmark structure | `<main aria-labelledby="leaderboard-heading">` wraps the surface; chart and table are `<section>` with accessible names. |

## Mobile behaviour (<640px)

| Element | Behaviour |
|---|---|
| Chart | Renders at taller aspect ratio (`viewBox="0 0 400 360"`). Touch targets enlarged to 24×24 px. |
| Tooltip | Sticky strip at the bottom of the chart, not a floating card. |
| Control strip | Replaced by `<MobileFilterSheet />` — a single button that opens a bottom sheet. |
| Table columns | Only `#`, `MODEL`, `REWARD`, `$`. Hidden columns show in the expanded panel. |
| Legend | Wraps to two lines. |
| Expanded row | Same content as desktop; scrolls into view on expand. |

Below 320px: layout still functions but may require horizontal scroll on the chart. Acceptable — 320px is our explicit floor.

## Error / empty / mock states

| State | Treatment |
|---|---|
| Ingest artefact missing | `page.tsx` catches, renders `<LeaderboardUnavailable />` — terminal panel: `aec-bench ~ $ bench leaderboard → artefact not found · see /docs/getting-started`. |
| Zero entries ever | Table shows a single prompt row: `no submissions yet — see /docs/contributing to submit one ›`. Chart renders axes only with the same message centered. |
| Zero entries after filtering | Chart keeps axes; centered prompt: `no entries match · clear ×`. Same message in the table. Clicking `×` resets filters via the URL. |
| Single entry after filtering | Renders normally; frontier line hides. |
| Two entries after filtering | Renders normally; frontier line hides (needs ≥3). |
| Artefact-level `is_mock=true` | Chart header shows one-line caveat: `frontier and values are from mock submissions — real data lands as submissions arrive`. |
| Per-row mock | Small `[mock]` tag appears next to the model name. Requires the ingest pipeline to emit a per-entry `is_mock` flag (see Contracts changes). |

## Contracts changes

The current `LeaderboardEntry` schema has no per-entry `is_mock`. The ingest pipeline tags the whole artefact as mock if any source experiment is mock, but doesn't propagate mock-ness to individual entries. Two small changes required:

### 1. Add `is_mock: boolean` to `LeaderboardEntry`

```typescript
// lib/aec-bench/contracts.ts
export const LeaderboardEntrySchema = z.object({
  // ...existing fields...
  is_mock: z.boolean(),
});
```

### 2. Set the flag during aggregation

`scripts/ingest/aggregate.ts` tags each entry as `is_mock: true` if *any* contributing experiment has `mock: true` in its `submission.yml`. An entry built from a mix of mock and real experiments is still tagged as mock — the honest default.

### 3. No other contract changes

`RunStatus`, `LeaderboardArtefact`, `TrialRecord` stay as-is.

## Testing strategy

### Unit (vitest)

| File | Coverage |
|---|---|
| `pareto.test.ts` | All cases in the table above; property test (generated random points, frontier is minimal set) |
| `filter.test.ts` | No filter, single discipline, multi-discipline (mean), harness only, both; discipline reshape of reward; CI nulling |
| `sort.test.ts` | Each column, null-handling, stability under ties |
| `axis-metric.test.ts` | Format strings across magnitudes (`$0.01`, `$1234.56`, `46k`, `1.2M`, `2.3min`) |
| `harness-glyph.test.ts` | Known adapters map to expected shapes; unknown adapter falls back to diamond |
| `use-leaderboard-state.test.tsx` | URL parse on mount, URL update on change, locked filters respected, `open` cleared when filtered out |
| `scatter-chart.test.tsx` | Correct dot count, frontier polyline rendered, tooltip on hover, keyboard arrow moves focus |
| `leaderboard-table.test.tsx` | Sort on header click, flips on second click, default sort, URL sync, per-discipline sub-sort |
| `expandable-row.test.tsx` | Collapse/expand on click + keyboard, single-expanded invariant, content render |
| `control-strip.test.tsx` | Chip labels under various selection states, popover open/close, multi-select toggling |
| `leaderboard-surface.test.tsx` | Integration: filter → reshape → sort → render flow on a small fixture |

### E2E (Playwright)

`tests/e2e/leaderboard.spec.ts`:

1. Navigate to `/leaderboard`; assert chart dots and table rows count match entry count in fixture.
2. Axis swap — click `[cost ▾]` → pick `tokens` — URL includes `x=tokens`, chart re-draws (verify x-axis label changes).
3. Discipline filter — click `[all ▾]` → pick `civil` — URL includes `d=civil`, y-axis label now says `reward (civil)`, row reward values change.
4. Harness filter — `h=rlm` — chart and table shrink to rlm rows only.
5. Row expand — click first row → expanded panel visible with per-discipline bars + CI + trials.
6. Shared URL — navigate to `/leaderboard?x=tokens&d=civil&sort=reward&dir=desc&open=claude-opus-4.7::rlm` → page restores all state including the expanded row.
7. Mobile sheet (set viewport to 375×812) — control strip hidden, `[filters]` button visible; tap → sheet opens; pick filters; tap `[apply]` → URL updates.
8. Frontier — hover a frontier-marked dot → tooltip shows `[on frontier]`; the same row in the table shows the `[frontier]` badge.
9. Zero-match filter — apply filters that leave no entries → chart shows `no entries match · clear ×`; click `×` → filters cleared.
10. Accessibility — `axe.run()` reports zero violations at desktop and mobile viewports.

### Fixtures

- Reuse the `_mock-*` experiments already committed under `results/experiments/`. The e2e suite runs against the built site and the mock artefact.
- Add a tiny synthetic fixture under `tests/leaderboard/fixtures/` for isolated unit tests where exact numeric assertions matter.

## Performance

- **Bundle budget:** `/leaderboard` route JS ≤ 150 KB gzipped. Enforced by `pnpm test:bundle` reading the Turbopack `page_client-reference-manifest.js` and summing unique chunk gzip sizes. The original 60 KB target was raised during implementation because `ExpandableRow`'s row-expansion animation pulls framer-motion (~43 KB) into the route bundle. Replacing framer-motion with a CSS transition is a tracked follow-up that would let us tighten the budget back toward 100 KB.
- **First paint targets (local dev build, desktop Chrome):** LCP < 1.0s for the table, full chart render (all dots + Pareto) < 1.5s after hydration.
- **Memoisation:** `reshaped`, `sorted`, `points`, `frontier` all under `useMemo` with precise deps.
- **Hit-testing:** SVG `<rect>`s with `fill="transparent"` plus CSS `:hover` handle most hover state without React re-renders. React state updates only on cross-highlight changes (hovered row key).
- **No virtualisation:** ~40 table rows and ~40 dots; virtualisation costs more complexity than it saves.

## Open questions / risks

| # | Item | Mitigation |
|---|---|---|
| 1 | Per-discipline CI is lost on reshape | Accept for MVP; track per-discipline CI emission as a follow-up ingest task. Row CI cell shows `—` when disciplines are active. |
| 2 | `adapter` is a free-form string in `LeaderboardEntry` | Harness chip derives options from entries at render time; no enumerated union. Document this so Phase 4 doesn't accidentally hardcode. |
| 3 | The `lambda-rlm` harness shape isn't observed in current mock data | Commit: the implementation plan includes a task to add one `_mock-lambda-rlm-*` experiment to `results/experiments/` (via the existing `pnpm mock:generate` pipeline, with `--adapter lambda-rlm`) so harness-glyph coverage is honest. `harness-glyph.test.ts` also covers the fallback diamond for truly-unknown adapters. |
| 4 | Mobile sheet state-batching differs from desktop (apply vs live) | Intentional — live updates on mobile caused thrash in comparable patterns. Document in the test plan so behaviour is explicit. |
| 5 | Expansion animation increment to bundle | **Realised at implementation time:** framer-motion did NOT tree-shake into the (home) layout chunk; it landed as ~43 KB inside the `/leaderboard` route bundle. Budget raised from 60 → 150 KB; the `ExpandableRow` ⇒ CSS-transition swap is captured as a tracked follow-up. Bundle still safely under the new ceiling at ~135 KB. |

## Deferred items (tracked in memory)

- **SSR-side URL filter bootstrapping** — `aecbench-leaderboard-ssr-filters`
- **Step-count axis** — `aecbench-lib-gaps`
- **Per-discipline cost / CI in ingest** — folded into `aecbench-lib-gaps`
- **`/leaderboard/[discipline]` sub-routes** — separate spec once this lands
- **`/leaderboard/models/[slug]` model detail** — Phase 4

## Transition plan

After this spec is approved:

1. Invoke the superpowers `writing-plans` skill to decompose into TDD tasks.
2. Build on a new worktree off `main`.
3. Follow the same execution pattern as the infrastructure work: pure-function tasks first, then components bottom-up, then the surface container, then the page, then e2e.
4. Target one PR that's self-contained (all new files, minimal touch to existing surfaces).

## References

- Phase 3 infrastructure spec: `docs/specs/2026-04-18-leaderboard-infra-design.md`
- Landing polish spec: `docs/specs/2026-04-18-landing-polish-design.md`
- Read layer: `lib/aec-bench/read.ts`
- Existing landing pieces to reuse/match: `components/landing/leaderboard-preview.tsx`, `blueprint-bg.tsx`, `sheet-corners.tsx`, `section-anno.tsx`
