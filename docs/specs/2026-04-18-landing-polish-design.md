---
title: Landing Polish — Design
date: 2026-04-18
status: ready-to-plan
scope: L — landing only
---

# Landing Polish — Design

## Context

Current landing (`app/(home)/page.tsx` + `components/landing/*`) is a five-section dark theme — hero, leaderboard preview, disciplines, how-it-works, cta. It works but is centred/symmetrical, fairly generic dark-tech, no motion, no texture, and the leaderboard preview is a plain `<table>` even though the spec calls the leaderboard "the central feature".

Design research done this session against two Anthropic references (`anthropic.com/research` and `anthropic.com/features/81k-interviews`) captured the editorial pattern — narrow measure, figure breakouts, restrained motion, serif body for long reads. Theo chose not to import that pattern wholesale; instead, we picked a distinctiveness direction grounded in aec-bench's existing language:

**Direction D + more B — blueprint base with terminal punctuation.** CAD/engineering-drawing visual language (teal grid, dimension-line annotations, corner sheet markings) as the base; CLI/terminal details (status bars, blinking cursors, command-styled buttons, mock readouts) as punctuation. AEC-native rather than generic "AI startup" terminal cosplay.

Scope choice: **option L — landing only**. Deeper leaderboard, per-discipline, and model-detail pages are captured as deferred work (see memory `aecbench-deferred-scope`).

## Goals

1. Push distinctiveness — make the landing feel unmistakably aec-bench, not a template.
2. Make the leaderboard preview feel like *the product*, not a list.
3. Introduce `reward × cost` as aec-bench's signature insight (nobody else pairs them).
4. Stay shippable — no Supabase, no chart library on the landing, no new framework.

## Non-goals

- Building `/leaderboard`, `/leaderboard/[discipline]`, or model-detail pages.
- Wiring Supabase. Data stays stubbed in local TS files with the same shape the DB will return.
- Restyling docs or footer.
- New fonts. Inter + JetBrains Mono cover everything.

## Design system additions

### Colour tokens (extend `app/globals.css`)

```css
@theme {
  /* existing tokens unchanged */
  --color-bg-grid:        rgba(56, 178, 172, 0.06);
  --color-bg-grid-major:  rgba(56, 178, 172, 0.14);
  --color-terminal-bg:    #050505;
  --color-cursor:         #e8a838;
  --color-delta-up:       #6fd08a;
  --color-delta-down:     #e07b7b;

  --color-provider-anthropic: #e8a838;
  --color-provider-openai:    #38b2ac;
  --color-provider-google:    #c792ea;
  --color-provider-meta:      #6fd08a;
}
```

Named provider tokens mean the leaderboard and (future) scatter can read from a single map keyed by provider string.

### Typography roles

Unchanged fonts. Changed roles:

- **Inter (sans):** headlines, body, card titles.
- **JetBrains Mono:** UI chrome — status bars, section annotations, button labels, numerics, discipline codes, delta values, copy-boxes, CLI readouts. Mono becomes the visual signature of "this is engineering data".

New utility class:

```css
.anno {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent-teal);
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}
.anno::before { content:""; width:32px; height:1px; background: var(--color-accent-teal); }
.anno::after  { content:""; width:80px; height:1px; background: var(--color-accent-teal); }
```

Every section heading gets an `<p class="anno">SECTION 0N / NAME</p>` eyebrow above the `<h2>`.

### Global chrome

**Persistent status bar** (new `components/landing/status-bar.tsx`), placed below the Fumadocs nav:

```
● LIVE   run_id 0412-a7   tasks 547   models 14   disciplines 5            last_run 2h ago
```

- Mono, ~0.68rem, `#888` base with `#f0f0f0` key values and `#38b2ac` for `last_run`.
- `● LIVE` = amber pulsing dot (2.1s loop). Pulse disabled under `prefers-reduced-motion: reduce`.
- Sticky under nav once the user scrolls past the hero.
- Reads from new `components/landing/run-status.ts` (see *Data contract*).

**Blueprint grid background** — applied per-section, not on `<body>`, so sections can stagger and fade-mask independently:

```css
.section-bg {
  background-image:
    linear-gradient(var(--color-bg-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-bg-grid) 1px, transparent 1px),
    linear-gradient(var(--color-bg-grid-major) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-bg-grid-major) 1px, transparent 1px);
  background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
  mask-image: radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%);
}
```

**Corner annotations** per section (`<SheetCorners figNumber={4} figName="DISCIPLINES" />`): mono tiny `#555`, top-left `FIG. 0N / NAME`, bottom-right `SHEET 0N OF 06`.

**Scanline overlay** — hero only, 2% opacity. Skip site-wide (too noisy combined with the grid).

### Motion rules

Framer Motion is a new dependency (`framer-motion` via pnpm). Rules:

- Default entry: `initial={{opacity:0, y:16}} whileInView={{opacity:1, y:0}} viewport={{once:true, margin:'-80px'}} transition={{duration:0.4, ease:'easeOut'}}`.
- Hero headline types in over ~2s using a split-character effect. Under reduced motion, render full text instantly.
- Cursor blink: 1.05s steps-2 infinite. Reduced motion: steady amber block.
- Status bar numerics tick up on first mount (250ms each, sequential). Reduced motion: static.
- Leaderboard discipline bars draw up on view, 400ms ease-out, 50ms stagger per bar.
- Mini-scatter dots fade + scale on view, 300ms, 80ms stagger.
- How-it-works flow steps fade in sequentially, 80ms stagger.
- All motion gated on `useReducedMotion()` from Framer.

## Section-by-section

Final landing order:

```
1. hero
2. standings-table (restyled LeaderboardPreview)
3. reward×cost teaser (NEW)
4. disciplines (restyled)
5. how-it-works (restyled, uses 6-stage flow)
6. cta (restyled)
```

### 01 — Hero (`components/landing/hero.tsx`)

- Keep existing copy: "How capable is AI at real engineering?" + subtitle.
- Wrap key terms in amber spans: `aec-bench`, `500+`.
- Add amber cursor after headline; types in on first mount.
- CTAs restyled as commands: `$ explore_results` (primary, amber), `> read_the_docs` (ghost).
- Right-anchored `HeroReadout` widget (new sub-component): mock terminal, window chrome, 5–6 lines of `bench run` output with amber metrics. Hidden on viewports below 720px.
- `<SheetCorners figNumber={1} figName="HERO" />` + scanline overlay.

### 02 — Standings table (`components/landing/leaderboard-preview.tsx`)

Replace the current plain `<table>`:

- Window-chrome frame (`~/aec-bench / leaderboard.tsv`, `14 rows · streaming`).
- `cmdline` row: `aec-bench ~ $ bench leaderboard --top 4 --by reward › stream ok`.
- Grid columns (desktop): `# · Model · Per-discipline bars · Reward · Δ last run · Tokens · Cost`. Tablet/mobile: hide discipline bars, delta, tokens.
- Rank: zero-padded `#01` style, amber, mono.
- Discipline bars: five thin vertical bars per row (C/E/G/M/S), amber for top 3 models, teal for rest. Animate draw-up on view.
- Delta: `+0.04` green, `−0.01` red, with `+`/`−` symbol for non-colour accessibility.
- Footer: legend (`C civil  E electrical  G ground  M mechanical  S structural`), then `→ bench leaderboard --full ↗` link.

### 03 — Reward × Cost teaser (NEW — `components/landing/reward-cost-teaser.tsx`)

Two-card grid (side-by-side desktop, stacked mobile):

- **Left card** — compact top-4 list (`#01 Claude Sonnet 4 … 0.72`), mono. Link: `full table ↗`.
- **Right card** — static mini-scatter, plain SVG (no chart lib). Y = reward, X = cost per task (log). Four dots coloured by provider. Dashed amber Pareto frontier line. Link: `explore ↗`.

Both cards link to `/leaderboard` (404 until Phase 3 — acceptable).

### 04 — Disciplines (`components/landing/disciplines.tsx`)

- 5-column row on desktop (`grid-cols-5` at `lg:`), 2-column tablet, 1-column mobile. Fixes the current orphan row.
- Replace Lucide icons with inline SVG glyphs (placeholder paths ok for this iteration — final designs deferred).
- Each card: code chip top (`CIV·01`, mono `#666`/`#e8a838`), glyph, name, short desc, task count (`108 tasks`, mono amber with `tasks` dimmed).
- Card links to `/leaderboard/[discipline]` (route will 404 until Phase 3).

### 05 — How It Works (`components/landing/how-it-works.tsx`)

Replace the three-icon layout with two stacked elements:

- **6-stage flow:** six bordered cards in a row (2 rows on mobile). Teal borders for stages 01–03 (setup), amber for 04–06 (execution). Connected by `→` glyphs. May import from `components/docs/benchmark-run-flow.tsx` with simplified labels, or write a landing-specific variant if prop surface doesn't fit cleanly.
- **CLI readout** beneath: `bench run --task cable-sizing --harness tool_loop --model claude-sonnet-4`, with 4–5 streaming-style output lines and a `done.` line.
- Link below: `→ read the full pipeline · /docs/core/architecture`.

### 06 — CTA (`components/landing/cta.tsx`)

- Headline: "Benchmark your model against real engineering."
- Sub: "Open-source. Reproducible. Runs locally or against any provider."
- **Primary:** copy-box `$ pip install aec-bench` with a `copy` button (uses `navigator.clipboard.writeText`). `copy` → transient `copied` state.
- Meta line (mono): `latest v0.4.1 · github.com/aurecon/aec-bench · 2.4k ★`.
- Secondary row: three ghost buttons (`> quickstart`, `> contribute a task`, `> submit your model`).

## Nav changes (`lib/layout.shared.tsx`)

- Change Blog link: `url: '/blog'` → `url: 'https://www.theharness.blog'`, `active: 'none'`, add `external: true` (or add a Lucide `ExternalLink` icon via the nav config if supported by Fumadocs).
- Drop the "Blog" nav link entirely. "The Harness" already points to `https://www.theharness.blog`; keeping both is redundant.
- Delete `app/(home)/blog/page.tsx` and the `(home)/blog/` folder.

## Data contract additions

New file `components/landing/run-status.ts`:

```ts
export interface RunStatus {
  runId: string;
  tasks: number;
  models: number;
  disciplines: number;
  datasetVersion: string;
  lastRunRelative: string;
}

export const runStatus: RunStatus = {
  runId: '0412-a7',
  tasks: 547,
  models: 14,
  disciplines: 5,
  datasetVersion: 'v0.4.1',
  lastRunRelative: '2h ago',
};
```

Extend `components/landing/data.ts` `PreviewModel`:

```ts
export interface PreviewModel {
  rank: number;
  model: string;
  provider: 'anthropic' | 'openai' | 'google' | 'meta';
  overallScore: number;
  disciplines: { civil: number; electrical: number; ground: number; mechanical: number; structural: number };

  // new
  tokensMillions: number;    // e.g. 2.14
  costUsd: number;           // e.g. 18.40
  deltaLastRun: number;      // e.g. +0.04 or -0.01
  costPerTask: number;       // e.g. 0.034 — used for scatter X axis
}
```

Update the existing 4 models with plausible values.

Add discipline counts to `components/landing/disciplines.tsx`:

```ts
{ key: 'civil',       code: 'CIV·01', name: 'Civil',       taskCount: 108, description: '…' },
…
```

## Accessibility

- All motion gated on `prefers-reduced-motion`.
- Cursor blink → static amber block when reduced.
- Status bar numbers render final value instantly when reduced.
- Delta column uses `+`/`−` symbols in addition to colour.
- Leaderboard top-3 vs rest uses bar colour AND rank — not colour-only.
- Mini-scatter dots have `<title>` elements per provider + model name for SR users.
- All decorative SVG glyphs carry `aria-hidden="true"`; meaningful ones have `<title>`.
- Keyboard: all cards and links focusable, visible focus ring (amber, 2px).
- Contrast: amber `#e8a838` on `#0a0a0a` = 9.4:1; teal `#38b2ac` on `#0a0a0a` = 7.3:1 — both pass AAA.

## Testing

- **Unit:** data shape validation (`run-status`, extended `PreviewModel`), copy-button clipboard behaviour.
- **Component:** render each landing section with reduced-motion on/off — assert no animations fire under reduced-motion.
- **Playwright (existing):** extend current E2E to cover the new status bar, copy button, and deep-link hrefs.
- **Visual regression (optional):** Playwright screenshot per section at 1280 / 768 / 375.
- **Axe-core:** run accessibility audit against `/` after changes.

## Out of scope (captured in memory `aecbench-deferred-scope`)

- `/leaderboard` full page.
- `/leaderboard/[discipline]` per-discipline pages (5 routes).
- `/leaderboard/models/[slug]` model detail.
- Supabase wiring.
- Real discipline glyph artwork (ship placeholders, iterate).
- Footer restyling.
- Nivo integration.

## Open items

All earlier opens resolved 2026-04-18:

- Nav: Blog link dropped in favour of the existing "The Harness" link.
- Discipline glyphs: ship with the placeholder SVG paths from the mockup; designer to iterate later.
- Run-status values: stubbed values (`run_id 0412-a7`, 547 tasks, 14 models, 5 disciplines, `v0.4.1`, `last_run 2h ago`) are acceptable placeholders until Supabase wiring lands.
