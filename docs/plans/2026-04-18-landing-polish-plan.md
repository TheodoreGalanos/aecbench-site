# Landing Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the aec-bench landing page in the "blueprint + terminal" direction (dark CAD grid base with CLI punctuation), add a new Reward×Cost teaser section, extend data for delta/tokens/cost, retire the `/blog` placeholder, and make all motion reduced-motion-safe.

**Architecture:** Composition of small React components in `components/landing/*`. Shared primitives (section annotation, sheet corners, blueprint background wrapper, motion helpers) first; then the data layer (`run-status.ts` + extended `PreviewModel`); then the global chrome (persistent status bar in `(home)/layout.tsx`); then each landing section rewritten top-to-bottom. Framer Motion is a new client-side dependency gated behind `useReducedMotion()`.

**Tech Stack:** Next.js 15 + React 19 App Router · Tailwind CSS 4 · Fumadocs UI · Lucide icons · Vitest + @testing-library/react for unit/component tests · Playwright for E2E · pnpm.

**Reference docs:**
- Design spec: `docs/specs/2026-04-18-landing-polish-design.md`
- Visual mocks: `.superpowers/brainstorm/9452-1776472873/content/` (gitignored, inspect locally)
- Deferred follow-up work: memory `aecbench-deferred-scope`

**Conventions (from `~/.claude/CLAUDE.md`):**
- Every new file opens with two `// ABOUTME:` comment lines.
- Australian English in user-visible copy (colour, behaviour, organisation).
- Never commit with `--no-verify`. If hooks fail, fix the root cause.
- Commits end with the Anthropic `Co-Authored-By` footer that Theo's harness adds automatically.
- Match the style of surrounding code.

---

## File Structure

### New files
- `components/landing/motion-primitives.tsx` — `FadeUp`, `RespectReducedMotion` wrappers around Framer Motion.
- `components/landing/section-anno.tsx` — `<SectionAnno>` dimension-line section label.
- `components/landing/sheet-corners.tsx` — `<SheetCorners>` drafting corner labels.
- `components/landing/blueprint-bg.tsx` — `<BlueprintBg>` section-level grid+mask wrapper.
- `components/landing/run-status.ts` — status-bar data contract + stub values.
- `components/landing/status-bar.tsx` — persistent status bar.
- `components/landing/hero-readout.tsx` — right-anchored terminal widget on hero.
- `components/landing/reward-cost-teaser.tsx` — new landing section 03.
- `components/landing/discipline-glyphs.tsx` — five inline SVG placeholder glyphs.
- `components/landing/copy-box.tsx` — copy-to-clipboard command box (used by CTA).
- Matching tests in `tests/components/` for each of the above (where behaviour is testable).

### Modified files
- `app/globals.css` — add colour tokens, `.anno` utility, `.scanlines` utility.
- `app/(home)/layout.tsx` — mount `<StatusBar>` below the HomeLayout nav.
- `app/(home)/page.tsx` — reorder sections, insert `<RewardCostTeaser>`.
- `components/landing/hero.tsx` — restyled: cursor, readout, commanded buttons, scanlines.
- `components/landing/leaderboard-preview.tsx` — full rewrite: window chrome, bars, delta, tokens, cost.
- `components/landing/disciplines.tsx` — 5-column grid, glyphs, code chip, task count.
- `components/landing/how-it-works.tsx` — 6-stage flow + CLI readout.
- `components/landing/cta.tsx` — copy-box primary, meta line, ghost secondaries.
- `components/landing/data.ts` — extend `PreviewModel` + update four models.
- `lib/layout.shared.tsx` — drop Blog link, add external-link icon to The Harness.
- `tests/components/*.test.tsx` — update existing tests to reflect new behaviour.
- `tests/e2e/landing.spec.ts` — extend to cover status bar, copy button, new section.

### Deleted files
- `app/(home)/blog/page.tsx` — and the surrounding `(home)/blog/` directory.

---

## Task List

### Task 1: Install framer-motion and add design tokens

**Files:**
- Modify: `package.json` (via `pnpm add`)
- Modify: `app/globals.css`

- [ ] **Step 1.1: Add framer-motion**

Run:
```bash
cd /Users/theodoros.galanos/LocalProjects/aecbench-site
pnpm add framer-motion
```

Expected: `framer-motion` appears under `dependencies` in `package.json` (current version 12.x).

- [ ] **Step 1.2: Write failing test that asserts new CSS tokens compile**

Create `tests/components/globals-tokens.test.tsx`:

```tsx
// ABOUTME: Smoke test that new landing design tokens are declared in globals.css.
// ABOUTME: We read the file as text; we don't attempt to evaluate CSS variables.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const css = readFileSync(resolve(__dirname, '../../app/globals.css'), 'utf8');

describe('globals.css landing tokens', () => {
  it('declares the blueprint grid tokens', () => {
    expect(css).toMatch(/--color-bg-grid:\s*rgba\(56,\s*178,\s*172,\s*0\.06\)/);
    expect(css).toMatch(/--color-bg-grid-major:\s*rgba\(56,\s*178,\s*172,\s*0\.14\)/);
  });

  it('declares terminal/cursor/delta/provider tokens', () => {
    expect(css).toMatch(/--color-terminal-bg:\s*#050505/);
    expect(css).toMatch(/--color-cursor:\s*#e8a838/);
    expect(css).toMatch(/--color-delta-up:\s*#6fd08a/);
    expect(css).toMatch(/--color-delta-down:\s*#e07b7b/);
    expect(css).toMatch(/--color-provider-anthropic:\s*#e8a838/);
    expect(css).toMatch(/--color-provider-openai:\s*#38b2ac/);
    expect(css).toMatch(/--color-provider-google:\s*#c792ea/);
    expect(css).toMatch(/--color-provider-meta:\s*#6fd08a/);
  });

  it('defines .anno utility', () => {
    expect(css).toMatch(/\.anno\s*\{/);
  });
});
```

- [ ] **Step 1.3: Run and verify failure**

Run: `pnpm test tests/components/globals-tokens.test.tsx`
Expected: all three assertions fail (tokens not yet declared).

- [ ] **Step 1.4: Extend `app/globals.css`**

Open `app/globals.css` and replace contents with:

```css
/* ABOUTME: Global stylesheet with Tailwind CSS v4 and Fumadocs theme. */
/* ABOUTME: Custom dark theme variables defined in @theme block. */
@import 'tailwindcss';
@import 'fumadocs-ui/css/neutral.css';
@import 'fumadocs-ui/css/preset.css';

@theme {
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);

  /* Landing page palette */
  --color-landing-bg: #0a0a0a;
  --color-landing-bg-end: #1a1a1a;
  --color-landing-card: #1e1e1e;
  --color-landing-border: #2a2a2a;
  --color-landing-text: #f0f0f0;
  --color-landing-muted: #888888;
  --color-accent-amber: #e8a838;
  --color-accent-teal: #38b2ac;

  /* Landing polish — blueprint + terminal */
  --color-bg-grid: rgba(56, 178, 172, 0.06);
  --color-bg-grid-major: rgba(56, 178, 172, 0.14);
  --color-terminal-bg: #050505;
  --color-cursor: #e8a838;
  --color-delta-up: #6fd08a;
  --color-delta-down: #e07b7b;
  --color-provider-anthropic: #e8a838;
  --color-provider-openai: #38b2ac;
  --color-provider-google: #c792ea;
  --color-provider-meta: #6fd08a;
}

/* Fumadocs dark mode overrides */
.dark {
  --color-fd-accent: #e8a838;
  --color-fd-accent-foreground: #0a0a0a;
}

/* Dimension-line section annotation */
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
.anno::before { content: ""; width: 32px; height: 1px; background: var(--color-accent-teal); }
.anno::after  { content: ""; width: 80px; height: 1px; background: var(--color-accent-teal); }

/* Subtle scanline overlay — applied only where chosen via className */
.scanlines {
  position: relative;
}
.scanlines::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    180deg,
    transparent 0 3px,
    rgba(255, 255, 255, 0.018) 3px 4px
  );
}
```

- [ ] **Step 1.5: Run and verify pass**

Run: `pnpm test tests/components/globals-tokens.test.tsx`
Expected: 3 passing tests.

- [ ] **Step 1.6: Commit**

```bash
git add package.json pnpm-lock.yaml app/globals.css tests/components/globals-tokens.test.tsx
git commit -m "feat(landing): add framer-motion + blueprint/terminal design tokens"
```

---

### Task 2: Motion primitives

**Files:**
- Create: `components/landing/motion-primitives.tsx`
- Create: `tests/components/motion-primitives.test.tsx`

- [ ] **Step 2.1: Write failing test**

Create `tests/components/motion-primitives.test.tsx`:

```tsx
// ABOUTME: Tests for FadeUp motion wrapper and reduced-motion behaviour.
// ABOUTME: Verifies children render in both motion and reduced-motion modes.
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
```

- [ ] **Step 2.2: Run and verify failure**

Run: `pnpm test tests/components/motion-primitives.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 2.3: Implement `motion-primitives.tsx`**

Create `components/landing/motion-primitives.tsx`:

```tsx
// ABOUTME: Shared Framer Motion primitives for the landing page.
// ABOUTME: All motion is gated on prefers-reduced-motion for accessibility.
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeUp({ children, className, delay = 0 }: FadeUpProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2.4: Run and verify pass**

Run: `pnpm test tests/components/motion-primitives.test.tsx`
Expected: 2 passing.

- [ ] **Step 2.5: Commit**

```bash
git add components/landing/motion-primitives.tsx tests/components/motion-primitives.test.tsx
git commit -m "feat(landing): add FadeUp motion primitive with reduced-motion gate"
```

---

### Task 3: SectionAnno + SheetCorners + BlueprintBg primitives

**Files:**
- Create: `components/landing/section-anno.tsx`
- Create: `components/landing/sheet-corners.tsx`
- Create: `components/landing/blueprint-bg.tsx`
- Create: `tests/components/landing-primitives.test.tsx`

- [ ] **Step 3.1: Write failing test**

Create `tests/components/landing-primitives.test.tsx`:

```tsx
// ABOUTME: Tests for shared landing primitives SectionAnno, SheetCorners, BlueprintBg.
// ABOUTME: Verifies text content and structural props render correctly.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionAnno } from '@/components/landing/section-anno';
import { SheetCorners } from '@/components/landing/sheet-corners';
import { BlueprintBg } from '@/components/landing/blueprint-bg';

describe('SectionAnno', () => {
  it('renders formatted section label', () => {
    render(<SectionAnno number={2} name="Current Standings" />);
    expect(screen.getByText(/SECTION 02 \/ CURRENT STANDINGS/)).toBeInTheDocument();
  });
});

describe('SheetCorners', () => {
  it('renders fig and sheet labels', () => {
    render(<SheetCorners figNumber={4} figName="DISCIPLINES" totalSheets={6} />);
    expect(screen.getByText('FIG. 04 / DISCIPLINES')).toBeInTheDocument();
    expect(screen.getByText('SHEET 04 OF 06')).toBeInTheDocument();
  });
});

describe('BlueprintBg', () => {
  it('renders children inside a section wrapper', () => {
    render(<BlueprintBg><p>content</p></BlueprintBg>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3.2: Run and verify failure**

Run: `pnpm test tests/components/landing-primitives.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3.3: Implement `section-anno.tsx`**

Create `components/landing/section-anno.tsx`:

```tsx
// ABOUTME: Dimension-line section annotation used above every landing section heading.
// ABOUTME: Renders as mono uppercase with flanking 1px teal lines via the .anno utility.
interface SectionAnnoProps {
  number: number;
  name: string;
}

export function SectionAnno({ number, name }: SectionAnnoProps) {
  const padded = String(number).padStart(2, '0');
  return (
    <p className="anno">
      SECTION {padded} / {name.toUpperCase()}
    </p>
  );
}
```

- [ ] **Step 3.4: Implement `sheet-corners.tsx`**

Create `components/landing/sheet-corners.tsx`:

```tsx
// ABOUTME: Drafting-sheet corner annotations positioned top-left and bottom-right of a section.
// ABOUTME: Parent section must be position:relative for these to anchor correctly.
interface SheetCornersProps {
  figNumber: number;
  figName: string;
  totalSheets?: number;
}

export function SheetCorners({ figNumber, figName, totalSheets = 6 }: SheetCornersProps) {
  const paddedN = String(figNumber).padStart(2, '0');
  const paddedT = String(totalSheets).padStart(2, '0');
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 top-3 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[#555]"
      >
        FIG. {paddedN} / {figName}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-4 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[#555]"
      >
        SHEET {paddedN} OF {paddedT}
      </div>
    </>
  );
}
```

- [ ] **Step 3.5: Implement `blueprint-bg.tsx`**

Create `components/landing/blueprint-bg.tsx`:

```tsx
// ABOUTME: Section wrapper that paints the teal blueprint grid behind its children.
// ABOUTME: Uses CSS background-image + radial mask so the grid fades towards section edges.
import type { ReactNode } from 'react';

interface BlueprintBgProps {
  children: ReactNode;
  className?: string;
}

export function BlueprintBg({ children, className = '' }: BlueprintBgProps) {
  return (
    <section className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-bg-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-bg-grid) 1px, transparent 1px),
            linear-gradient(var(--color-bg-grid-major) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-bg-grid-major) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 24px 24px, 120px 120px, 120px 120px',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%)',
          maskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%)',
        }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}
```

- [ ] **Step 3.6: Run and verify pass**

Run: `pnpm test tests/components/landing-primitives.test.tsx`
Expected: 3 passing.

- [ ] **Step 3.7: Commit**

```bash
git add components/landing/section-anno.tsx components/landing/sheet-corners.tsx components/landing/blueprint-bg.tsx tests/components/landing-primitives.test.tsx
git commit -m "feat(landing): add SectionAnno, SheetCorners, BlueprintBg primitives"
```

---

### Task 4: Extend PreviewModel + create run-status.ts

**Files:**
- Modify: `components/landing/data.ts`
- Create: `components/landing/run-status.ts`
- Create: `tests/components/landing-data.test.tsx`

- [ ] **Step 4.1: Write failing test**

Create `tests/components/landing-data.test.tsx`:

```tsx
// ABOUTME: Validates the shape and values of landing-page stub data.
// ABOUTME: Ensures PreviewModel extensions and runStatus are populated for all consumers.
import { describe, it, expect } from 'vitest';
import { previewModels } from '@/components/landing/data';
import { runStatus } from '@/components/landing/run-status';

describe('previewModels', () => {
  it('has exactly 4 models with extended fields', () => {
    expect(previewModels).toHaveLength(4);
    for (const m of previewModels) {
      expect(m.provider).toMatch(/^(anthropic|openai|google|meta)$/);
      expect(typeof m.tokensMillions).toBe('number');
      expect(typeof m.costUsd).toBe('number');
      expect(typeof m.deltaLastRun).toBe('number');
      expect(typeof m.costPerTask).toBe('number');
    }
  });

  it('puts Claude Sonnet 4 at rank 1', () => {
    expect(previewModels[0].model).toBe('Claude Sonnet 4');
    expect(previewModels[0].provider).toBe('anthropic');
    expect(previewModels[0].rank).toBe(1);
  });
});

describe('runStatus', () => {
  it('exposes the expected fields', () => {
    expect(runStatus.runId).toBe('0412-a7');
    expect(runStatus.tasks).toBe(547);
    expect(runStatus.models).toBe(14);
    expect(runStatus.disciplines).toBe(5);
    expect(runStatus.datasetVersion).toBe('v0.4.1');
    expect(runStatus.lastRunRelative).toBe('2h ago');
  });
});
```

- [ ] **Step 4.2: Run and verify failure**

Run: `pnpm test tests/components/landing-data.test.tsx`
Expected: FAIL — `tokensMillions` etc. not on type; `run-status` module missing.

- [ ] **Step 4.3: Rewrite `components/landing/data.ts`**

Replace contents of `components/landing/data.ts` with:

```ts
// ABOUTME: Static placeholder data for the landing page leaderboard preview.
// ABOUTME: Replaced by live Supabase queries in Phase 3.

export type Provider = 'anthropic' | 'openai' | 'google' | 'meta';

export interface PreviewModel {
  rank: number;
  model: string;
  provider: Provider;
  overallScore: number;
  disciplines: {
    civil: number;
    electrical: number;
    ground: number;
    mechanical: number;
    structural: number;
  };
  tokensMillions: number;
  costUsd: number;
  deltaLastRun: number;
  costPerTask: number;
}

export const previewModels: PreviewModel[] = [
  {
    rank: 1,
    model: 'Claude Sonnet 4',
    provider: 'anthropic',
    overallScore: 0.72,
    disciplines: { civil: 0.75, electrical: 0.68, ground: 0.71, mechanical: 0.74, structural: 0.72 },
    tokensMillions: 2.14,
    costUsd: 18.4,
    deltaLastRun: 0.04,
    costPerTask: 0.034,
  },
  {
    rank: 2,
    model: 'GPT-4.1',
    provider: 'openai',
    overallScore: 0.68,
    disciplines: { civil: 0.70, electrical: 0.65, ground: 0.66, mechanical: 0.71, structural: 0.68 },
    tokensMillions: 1.98,
    costUsd: 21.6,
    deltaLastRun: 0.02,
    costPerTask: 0.040,
  },
  {
    rank: 3,
    model: 'Gemini 2.5 Pro',
    provider: 'google',
    overallScore: 0.65,
    disciplines: { civil: 0.67, electrical: 0.62, ground: 0.64, mechanical: 0.68, structural: 0.64 },
    tokensMillions: 2.41,
    costUsd: 14.8,
    deltaLastRun: -0.01,
    costPerTask: 0.027,
  },
  {
    rank: 4,
    model: 'Llama 4 Maverick',
    provider: 'meta',
    overallScore: 0.58,
    disciplines: { civil: 0.60, electrical: 0.55, ground: 0.57, mechanical: 0.61, structural: 0.57 },
    tokensMillions: 2.07,
    costUsd: 9.2,
    deltaLastRun: 0.06,
    costPerTask: 0.017,
  },
];
```

- [ ] **Step 4.4: Create `components/landing/run-status.ts`**

```ts
// ABOUTME: Run-status data consumed by the persistent landing status bar.
// ABOUTME: Stubbed here; replaced by Supabase queries in Phase 3.

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

- [ ] **Step 4.5: Run and verify pass**

Run: `pnpm test tests/components/landing-data.test.tsx`
Expected: all passing.

- [ ] **Step 4.6: Commit**

```bash
git add components/landing/data.ts components/landing/run-status.ts tests/components/landing-data.test.tsx
git commit -m "feat(landing): extend PreviewModel with delta/tokens/cost; add run-status stub"
```

---

### Task 5: StatusBar component

**Files:**
- Create: `components/landing/status-bar.tsx`
- Create: `tests/components/status-bar.test.tsx`

- [ ] **Step 5.1: Write failing test**

Create `tests/components/status-bar.test.tsx`:

```tsx
// ABOUTME: Tests the persistent landing status bar renders run-status fields.
// ABOUTME: We assert text content only; motion is reduced-motion-gated.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBar } from '@/components/landing/status-bar';

describe('StatusBar', () => {
  it('renders all run-status fields', () => {
    render(<StatusBar />);
    expect(screen.getByText(/LIVE/)).toBeInTheDocument();
    expect(screen.getByText(/run_id/)).toBeInTheDocument();
    expect(screen.getByText('0412-a7')).toBeInTheDocument();
    expect(screen.getByText('547')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText(/last_run 2h ago/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5.2: Run and verify failure**

Run: `pnpm test tests/components/status-bar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 5.3: Implement `status-bar.tsx`**

Create `components/landing/status-bar.tsx`:

```tsx
// ABOUTME: Persistent mono status bar mounted below the site nav on landing pages.
// ABOUTME: Pulsing LIVE dot is disabled under prefers-reduced-motion.
'use client';

import { useReducedMotion } from 'framer-motion';
import { runStatus } from './run-status';

export function StatusBar() {
  const reduced = useReducedMotion();
  return (
    <div
      className="border-b border-landing-border bg-[#050505] font-mono text-[0.68rem] tracking-wide text-landing-muted"
      role="status"
      aria-label="aec-bench run status"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={`inline-block h-1.5 w-1.5 rounded-full bg-accent-amber ${
              reduced ? '' : 'animate-pulse'
            }`}
            style={{
              boxShadow: '0 0 6px rgba(232,168,56,0.6)',
            }}
          />
          <span className="text-accent-amber">LIVE</span>
        </span>
        <span>run_id <span className="text-landing-text">{runStatus.runId}</span></span>
        <span>tasks <span className="text-landing-text">{runStatus.tasks}</span></span>
        <span>models <span className="text-landing-text">{runStatus.models}</span></span>
        <span className="hidden sm:inline">
          disciplines <span className="text-landing-text">{runStatus.disciplines}</span>
        </span>
        <span className="ml-auto text-accent-teal">
          last_run {runStatus.lastRunRelative}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.4: Run and verify pass**

Run: `pnpm test tests/components/status-bar.test.tsx`
Expected: passing.

- [ ] **Step 5.5: Mount in `(home)/layout.tsx`**

Replace `app/(home)/layout.tsx` with:

```tsx
// ABOUTME: Layout for non-docs pages (landing, leaderboard).
// ABOUTME: Uses Fumadocs HomeLayout with shared navigation config and mounts the run StatusBar.
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { StatusBar } from '@/components/landing/status-bar';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions()}>
      <StatusBar />
      {children}
    </HomeLayout>
  );
}
```

- [ ] **Step 5.6: Commit**

```bash
git add components/landing/status-bar.tsx tests/components/status-bar.test.tsx app/(home)/layout.tsx
git commit -m "feat(landing): add persistent StatusBar below nav"
```

---

### Task 6: Hero rebuild

**Files:**
- Create: `components/landing/hero-readout.tsx`
- Modify: `components/landing/hero.tsx`
- Modify: `tests/components/hero.test.tsx`

- [ ] **Step 6.1: Update failing tests**

Overwrite `tests/components/hero.test.tsx`:

```tsx
// ABOUTME: Tests the restyled hero section — headline, command buttons, readout presence.
// ABOUTME: Copy assertions use partial match because key terms are wrapped in styled spans.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Hero } from '@/components/landing/hero';

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero />);
    expect(
      screen.getByRole('heading', { name: /how capable is ai at real engineering/i }),
    ).toBeInTheDocument();
  });

  it('renders both CTA links with command-style labels', () => {
    render(<Hero />);
    const explore = screen.getByRole('link', { name: /explore_results/i });
    const docs = screen.getByRole('link', { name: /read_the_docs/i });
    expect(explore).toHaveAttribute('href', '/leaderboard');
    expect(docs).toHaveAttribute('href', '/docs');
  });

  it('mentions 500+ tasks in the subtitle', () => {
    render(<Hero />);
    expect(screen.getByText(/500\+/)).toBeInTheDocument();
  });

  it('renders the hero readout widget (screen-reader visible)', () => {
    render(<Hero />);
    expect(screen.getByRole('complementary', { name: /bench run/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6.2: Run and verify failures**

Run: `pnpm test tests/components/hero.test.tsx`
Expected: most assertions fail against the existing hero.

- [ ] **Step 6.3: Implement `hero-readout.tsx`**

Create `components/landing/hero-readout.tsx`:

```tsx
// ABOUTME: Decorative terminal readout anchored top-right of the hero.
// ABOUTME: Pure static content — no data streaming, no motion. Hidden on narrow viewports.
export function HeroReadout() {
  return (
    <aside
      aria-label="bench run sample output"
      className="hidden md:block absolute right-6 top-10 w-[280px] rounded-md border border-landing-border bg-[rgba(5,5,5,0.75)] p-3 font-mono text-[0.65rem] leading-relaxed text-[#c7c7c7] backdrop-blur"
    >
      <div className="mb-2 flex gap-1">
        <span className="h-2 w-2 rounded-full bg-landing-border" />
        <span className="h-2 w-2 rounded-full bg-landing-border" />
        <span className="h-2 w-2 rounded-full bg-landing-border" />
      </div>
      <div>
        <span className="text-accent-teal">aec-bench ~ $</span>{' '}
        <span className="text-landing-text">bench run --all</span>
      </div>
      <div className="text-[#666]">› loading tasks … <span className="text-[#6fd08a]">547 ok</span></div>
      <div className="text-[#666]">› eval <span className="text-accent-amber">claude-sonnet-4</span></div>
      <div>&nbsp;&nbsp;reward <span className="text-accent-amber">0.72</span> · tok <span className="text-accent-amber">12.4k</span></div>
      <div className="text-[#666]">› eval <span className="text-accent-amber">gpt-4.1</span></div>
      <div>&nbsp;&nbsp;reward <span className="text-accent-amber">0.68</span> · tok <span className="text-accent-amber">9.1k</span></div>
      <div className="mt-1 text-[#666]">› stream → /leaderboard_</div>
    </aside>
  );
}
```

- [ ] **Step 6.4: Rewrite `hero.tsx`**

Replace contents of `components/landing/hero.tsx` with:

```tsx
// ABOUTME: Hero section for the landing page.
// ABOUTME: Blueprint grid background, scanline overlay, terminal readout, commanded buttons.
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { HeroReadout } from './hero-readout';

export function Hero() {
  return (
    <BlueprintBg className="scanlines overflow-hidden">
      <SheetCorners figNumber={1} figName="HERO" />
      <HeroReadout />
      <div className="mx-auto flex max-w-3xl flex-col items-start px-6 py-24 md:py-32">
        <SectionAnno number={1} name="Hero" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-landing-text md:text-6xl">
          How capable is AI at real engineering?
          <span
            aria-hidden
            className="ml-1 inline-block h-[0.9em] w-[0.45em] translate-y-[0.05em] bg-accent-amber motion-safe:animate-pulse"
            style={{ boxShadow: '0 0 12px rgba(232,168,56,0.45)' }}
          />
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-landing-muted md:text-base">
          <span className="text-accent-amber">aec-bench</span> measures AI performance across{' '}
          <span className="text-accent-amber">500+</span> tasks in architecture, engineering and
          construction — cable sizing, seismic design, hydraulic modelling, HVAC, geotech. Real
          problems, real standards, automated scoring.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 rounded border border-accent-amber bg-accent-amber px-4 py-3 font-mono text-sm font-semibold text-landing-bg transition-shadow hover:shadow-[0_0_0_3px_rgba(232,168,56,0.2)]"
          >
            <span aria-hidden>$</span>explore_results
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm font-semibold text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden className="text-accent-teal">&gt;</span>read_the_docs
          </Link>
        </div>
      </div>
    </BlueprintBg>
  );
}
```

- [ ] **Step 6.5: Run and verify pass**

Run: `pnpm test tests/components/hero.test.tsx`
Expected: all 4 passing.

- [ ] **Step 6.6: Commit**

```bash
git add components/landing/hero.tsx components/landing/hero-readout.tsx tests/components/hero.test.tsx
git commit -m "feat(landing): hero — blueprint grid, cursor, readout, commanded buttons"
```

---

### Task 7: LeaderboardPreview rebuild

**Files:**
- Modify: `components/landing/leaderboard-preview.tsx`
- Modify: `tests/components/leaderboard-preview.test.tsx`

- [ ] **Step 7.1: Update tests first**

Overwrite `tests/components/leaderboard-preview.test.tsx`:

```tsx
// ABOUTME: Tests the restyled leaderboard preview — window chrome, grid rows, delta, tokens, cost.
// ABOUTME: Verifies each row renders the extended PreviewModel fields.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';

describe('LeaderboardPreview', () => {
  it('renders the section heading and kicker', () => {
    render(<LeaderboardPreview />);
    expect(
      screen.getByRole('heading', { name: /current standings/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dataset/)).toBeInTheDocument();
    expect(screen.getByText(/v0\.4\.1/)).toBeInTheDocument();
  });

  it('renders all four models with zero-padded ranks', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument();
    expect(screen.getByText('GPT-4.1')).toBeInTheDocument();
    expect(screen.getByText('Gemini 2.5 Pro')).toBeInTheDocument();
    expect(screen.getByText('Llama 4 Maverick')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('renders rewards as two-decimal numbers', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('0.72')).toBeInTheDocument();
    expect(screen.getByText('0.68')).toBeInTheDocument();
  });

  it('renders deltas with + / − symbol', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('+0.04')).toBeInTheDocument();
    expect(screen.getByText('−0.01')).toBeInTheDocument();
  });

  it('renders tokens and cost columns', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText('2.14M')).toBeInTheDocument();
    expect(screen.getByText('$18.40')).toBeInTheDocument();
  });

  it('links to the full leaderboard', () => {
    render(<LeaderboardPreview />);
    const link = screen.getByRole('link', { name: /bench leaderboard --full/i });
    expect(link).toHaveAttribute('href', '/leaderboard');
  });
});
```

- [ ] **Step 7.2: Run and verify failures**

Run: `pnpm test tests/components/leaderboard-preview.test.tsx`
Expected: multiple failures.

- [ ] **Step 7.3: Rewrite `leaderboard-preview.tsx`**

Replace contents of `components/landing/leaderboard-preview.tsx` with:

```tsx
// ABOUTME: Compact leaderboard preview styled as a bench run terminal output.
// ABOUTME: Shows rank, model, per-discipline bars, reward, delta, tokens, cost per task.
'use client';

import Link from 'next/link';
import { previewModels, type PreviewModel } from './data';
import { runStatus } from './run-status';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';

function Bars({ model, topTier }: { model: PreviewModel; topTier: boolean }) {
  const d = model.disciplines;
  const values = [d.civil, d.electrical, d.ground, d.mechanical, d.structural];
  const colour = topTier ? 'bg-accent-amber' : 'bg-accent-teal';
  return (
    <div
      className="flex h-5 items-end gap-[3px]"
      aria-label={`discipline breakdown: civil ${d.civil}, electrical ${d.electrical}, ground ${d.ground}, mechanical ${d.mechanical}, structural ${d.structural}`}
    >
      {values.map((v, i) => (
        <div key={i} className="relative min-w-[5px] flex-1 rounded-sm bg-[#1a1a1a]">
          <div
            className={`absolute inset-x-0 bottom-0 rounded-sm ${colour}`}
            style={{ height: `${Math.round(v * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  const sign = up ? '+' : '−';
  const abs = Math.abs(value).toFixed(2);
  return (
    <span className={up ? 'text-[#6fd08a]' : 'text-[#e07b7b]'}>
      {sign}
      {abs}
    </span>
  );
}

export function LeaderboardPreview() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={2} figName="STANDINGS" />
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <SectionAnno number={2} name="Current Standings" />
        <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
          Current standings
        </h2>
        <p className="mb-6 mt-1 font-mono text-xs text-landing-muted">
          dataset <span className="text-accent-amber">{runStatus.datasetVersion}</span> · run{' '}
          <span className="text-accent-amber">{runStatus.runId}</span> · {runStatus.tasks} tasks ·{' '}
          {runStatus.disciplines} disciplines · last eval {runStatus.lastRunRelative}
        </p>

        <div className="overflow-hidden rounded-lg border border-landing-border bg-[#050505]">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-landing-border bg-landing-bg px-3 py-2 font-mono text-[0.7rem] text-[#666]">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-landing-border" />
              <span className="h-2 w-2 rounded-full bg-landing-border" />
              <span className="h-2 w-2 rounded-full bg-landing-border" />
            </div>
            <span className="ml-1">~/aec-bench / leaderboard.tsv</span>
            <span className="ml-auto text-[0.65rem]">{runStatus.models} rows · streaming</span>
          </div>

          {/* Cmdline */}
          <div className="border-b border-landing-border px-3 py-2 font-mono text-xs text-[#c7c7c7]">
            <span className="text-accent-teal">aec-bench ~ $</span>{' '}
            bench leaderboard <span className="text-accent-amber">--top</span> 4{' '}
            <span className="text-accent-amber">--by</span> reward{' '}
            <span className="text-[#666]">› stream ok</span>
          </div>

          {/* Data grid */}
          <div className="font-mono text-xs">
            <div className="hidden md:grid grid-cols-[44px_1.6fr_1fr_70px_1fr_90px_70px] border-b border-landing-border text-[0.62rem] uppercase tracking-wider text-[#666]">
              <div className="px-3 py-2">#</div>
              <div className="px-3 py-2">Model</div>
              <div className="px-3 py-2">Per-discipline</div>
              <div className="px-3 py-2 text-right">Reward</div>
              <div className="px-3 py-2">Δ last run</div>
              <div className="px-3 py-2 text-right">Tokens</div>
              <div className="px-3 py-2 text-right">Cost</div>
            </div>

            {previewModels.map((m) => {
              const topTier = m.rank <= 3;
              return (
                <div
                  key={m.rank}
                  className="grid grid-cols-[36px_1fr_60px_70px] md:grid-cols-[44px_1.6fr_1fr_70px_1fr_90px_70px] items-center border-b border-[#141414] last:border-b-0"
                >
                  <div className="px-3 py-3 font-bold text-accent-amber">
                    <span className="text-[#555]">#</span>
                    {String(m.rank).padStart(2, '0')}
                  </div>
                  <div className="px-3 py-3">
                    <div className="font-sans font-semibold text-landing-text">{m.model}</div>
                    <div className="text-[0.7rem] text-[#888]">{m.provider}</div>
                  </div>
                  <div className="hidden px-3 py-3 md:block">
                    <Bars model={m} topTier={topTier} />
                  </div>
                  <div className="px-3 py-3 text-right font-bold text-accent-amber">
                    {m.overallScore.toFixed(2)}
                  </div>
                  <div className="hidden px-3 py-3 md:block">
                    <Delta value={m.deltaLastRun} />
                  </div>
                  <div className="hidden px-3 py-3 text-right text-[0.72rem] text-[#888] md:block">
                    {m.tokensMillions.toFixed(2)}M
                  </div>
                  <div className="px-3 py-3 text-right text-[0.72rem] text-[#888]">
                    ${m.costUsd.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-end gap-4 border-t border-landing-border px-3 py-2 font-mono text-[0.62rem] uppercase tracking-wider text-[#666]">
            <span><span className="text-[#c7c7c7]">C</span> civil</span>
            <span><span className="text-[#c7c7c7]">E</span> electrical</span>
            <span><span className="text-[#c7c7c7]">G</span> ground</span>
            <span><span className="text-[#c7c7c7]">M</span> mechanical</span>
            <span><span className="text-[#c7c7c7]">S</span> structural</span>
          </div>
        </div>

        <div className="mt-4 font-mono text-sm">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-accent-amber transition-opacity hover:opacity-80"
          >
            <span className="text-accent-teal">→</span>
            bench leaderboard --full ↗
          </Link>
          <span className="ml-3 text-[#444]">·</span>
          <span className="ml-3 text-[#888]">{runStatus.models - 4} more models</span>
        </div>
      </div>
    </BlueprintBg>
  );
}
```

- [ ] **Step 7.4: Run and verify pass**

Run: `pnpm test tests/components/leaderboard-preview.test.tsx`
Expected: all 6 passing.

- [ ] **Step 7.5: Commit**

```bash
git add components/landing/leaderboard-preview.tsx tests/components/leaderboard-preview.test.tsx
git commit -m "feat(landing): leaderboard preview — window chrome, bars, delta, tokens, cost"
```

---

### Task 8: RewardCostTeaser (new section)

**Files:**
- Create: `components/landing/reward-cost-teaser.tsx`
- Create: `tests/components/reward-cost-teaser.test.tsx`

- [ ] **Step 8.1: Write failing test**

Create `tests/components/reward-cost-teaser.test.tsx`:

```tsx
// ABOUTME: Tests the reward×cost teaser renders the top-4 compact list and mini-scatter card.
// ABOUTME: SVG content is asserted via test-id and accessible name.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RewardCostTeaser } from '@/components/landing/reward-cost-teaser';

describe('RewardCostTeaser', () => {
  it('renders the section heading', () => {
    render(<RewardCostTeaser />);
    expect(
      screen.getByRole('heading', { name: /reward.*cost/i }),
    ).toBeInTheDocument();
  });

  it('renders compact top-4 list', () => {
    render(<RewardCostTeaser />);
    expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument();
    expect(screen.getByText('Llama 4 Maverick')).toBeInTheDocument();
  });

  it('renders a Pareto-frontier chart (svg with accessible name)', () => {
    render(<RewardCostTeaser />);
    expect(
      screen.getByRole('img', { name: /reward vs cost/i }),
    ).toBeInTheDocument();
  });

  it('deep-links to the leaderboard twice', () => {
    render(<RewardCostTeaser />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h === '/leaderboard').length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 8.2: Run and verify failure**

Run: `pnpm test tests/components/reward-cost-teaser.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 8.3: Implement `reward-cost-teaser.tsx`**

Create `components/landing/reward-cost-teaser.tsx`:

```tsx
// ABOUTME: Landing section 03 — reward × cost teaser with compact list + static mini-scatter.
// ABOUTME: Static SVG chart (no chart library). Deep-links to /leaderboard for the full version.
import Link from 'next/link';
import { previewModels, type Provider } from './data';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';

const providerColour: Record<Provider, string> = {
  anthropic: 'var(--color-provider-anthropic)',
  openai: 'var(--color-provider-openai)',
  google: 'var(--color-provider-google)',
  meta: 'var(--color-provider-meta)',
};

function MiniScatter() {
  // x = cost per task (log-ish, clamped); y = reward. Hardcoded from previewModels.
  return (
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-label="reward vs cost scatter — top 4 models with Pareto frontier"
      className="h-[150px] w-full"
    >
      {/* axes */}
      <line x1="28" y1="10" x2="28" y2="120" stroke="#2a2a2a" strokeWidth="1" />
      <line x1="28" y1="120" x2="195" y2="120" stroke="#2a2a2a" strokeWidth="1" />

      {/* grid */}
      {[40, 70, 100].map((y) => (
        <line key={y} x1="28" y1={y} x2="195" y2={y} stroke="rgba(56,178,172,0.08)" strokeWidth="1" />
      ))}
      {[70, 115, 160].map((x) => (
        <line key={x} x1={x} y1="10" x2={x} y2="120" stroke="rgba(56,178,172,0.08)" strokeWidth="1" />
      ))}

      {/* Pareto frontier */}
      <path
        d="M 45 85 L 85 58 L 130 40 L 180 32"
        stroke="var(--color-accent-amber)"
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
        opacity="0.7"
      />

      {/* points — ordered low-to-high cost for aria-label clarity */}
      {previewModels.map((m) => {
        const x = 45 + m.costPerTask * 3500; // stretches 0.017..0.040 across 45..185
        const y = 120 - m.overallScore * 140; // reward 0..1 → top of axis
        return (
          <g key={m.model}>
            <title>{`${m.model} — reward ${m.overallScore.toFixed(2)}, $${m.costPerTask.toFixed(3)}/task`}</title>
            <circle cx={x} cy={y} r="4.5" fill={providerColour[m.provider]} stroke="#0a0a0a" strokeWidth="1.5" />
          </g>
        );
      })}

      {/* axis labels */}
      <text x="28" y="135" fontSize="6" fontFamily="var(--font-mono)" fill="#666">
        cost / task →
      </text>
      <text
        x="10"
        y="70"
        fontSize="6"
        fontFamily="var(--font-mono)"
        fill="#666"
        transform="rotate(-90 10 70)"
      >
        ↑ reward
      </text>
    </svg>
  );
}

export function RewardCostTeaser() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={3} figName="REWARD × COST" />
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <SectionAnno number={3} name="Reward × Cost" />
        <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
          Reward × Cost
        </h2>
        <p className="mb-6 mt-1 font-mono text-xs text-landing-muted">
          the only benchmark that pairs performance with per-task cost
        </p>

        <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
          {/* Compact list */}
          <div className="relative rounded-lg border border-landing-border bg-[#050505] p-4">
            <div className="mb-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-accent-teal">
              <span>── TOP_4 ──</span>
              <Link href="/leaderboard" className="text-accent-amber text-[0.65rem]">full table ↗</Link>
            </div>
            <ul className="divide-y divide-[#141414] font-mono text-xs">
              {previewModels.map((m) => (
                <li key={m.rank} className="flex gap-2 py-1.5">
                  <span className="w-8 text-accent-amber">#{String(m.rank).padStart(2, '0')}</span>
                  <span className="flex-1 text-landing-text">{m.model}</span>
                  <span className="text-accent-amber">{m.overallScore.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mini scatter */}
          <div className="relative rounded-lg border border-landing-border bg-[#050505] p-4">
            <div className="mb-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-accent-teal">
              <span>── REWARD × COST ──</span>
              <Link href="/leaderboard" className="text-accent-amber text-[0.65rem]">explore ↗</Link>
            </div>
            <MiniScatter />
          </div>
        </div>
      </div>
    </BlueprintBg>
  );
}
```

- [ ] **Step 8.4: Run and verify pass**

Run: `pnpm test tests/components/reward-cost-teaser.test.tsx`
Expected: all 4 passing.

- [ ] **Step 8.5: Commit**

```bash
git add components/landing/reward-cost-teaser.tsx tests/components/reward-cost-teaser.test.tsx
git commit -m "feat(landing): add reward × cost teaser section"
```

---

### Task 9: Disciplines rebuild (5-col grid + glyphs)

**Files:**
- Create: `components/landing/discipline-glyphs.tsx`
- Modify: `components/landing/disciplines.tsx`
- Modify: `tests/components/disciplines.test.tsx`

- [ ] **Step 9.1: Update failing tests**

Overwrite `tests/components/disciplines.test.tsx`:

```tsx
// ABOUTME: Tests the restyled disciplines section — 5 cards, codes, counts, deep-links.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Disciplines } from '@/components/landing/disciplines';

describe('Disciplines', () => {
  it('renders the heading', () => {
    render(<Disciplines />);
    expect(
      screen.getByRole('heading', { name: /five engineering disciplines/i }),
    ).toBeInTheDocument();
  });

  it('renders five discipline codes', () => {
    render(<Disciplines />);
    for (const c of ['CIV·01', 'ELE·02', 'GND·03', 'MEC·04', 'STR·05']) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
  });

  it('renders all five discipline names', () => {
    render(<Disciplines />);
    for (const n of ['Civil', 'Electrical', 'Ground', 'Mechanical', 'Structural']) {
      expect(screen.getByRole('heading', { name: n })).toBeInTheDocument();
    }
  });

  it('renders task counts', () => {
    render(<Disciplines />);
    expect(screen.getByText(/108/)).toBeInTheDocument();
    expect(screen.getByText(/121/)).toBeInTheDocument();
  });

  it('links each card to /leaderboard/[discipline]', () => {
    render(<Disciplines />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/leaderboard/civil');
    expect(hrefs).toContain('/leaderboard/structural');
  });
});
```

- [ ] **Step 9.2: Run and verify failures**

Run: `pnpm test tests/components/disciplines.test.tsx`
Expected: failures against current 3-col Lucide grid.

- [ ] **Step 9.3: Create `discipline-glyphs.tsx`**

```tsx
// ABOUTME: Five inline SVG placeholder glyphs for engineering disciplines.
// ABOUTME: Decorative; parent marks aria-hidden. Designer to iterate later.
type GlyphProps = { className?: string };

const base = 'h-10 w-10 stroke-accent-teal fill-none';

export function CivilGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden strokeWidth="1.5">
      <path d="M4 30 Q12 18 20 24 T36 20" />
      <path d="M4 34 L36 34" strokeDasharray="2 2" />
      <circle cx="12" cy="26" r="1.5" />
      <circle cx="22" cy="23" r="1.5" />
      <circle cx="30" cy="22" r="1.5" />
    </svg>
  );
}

export function ElectricalGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden strokeWidth="1.5">
      <path d="M22 4 L12 22 L20 22 L16 36 L28 18 L20 18 Z" />
    </svg>
  );
}

export function GroundGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden strokeWidth="1.5">
      <path d="M4 14 L36 14" />
      <path d="M4 22 L36 22" strokeDasharray="2 2" />
      <path d="M4 30 L36 30" strokeDasharray="3 3" />
      <path d="M14 6 L14 34" />
    </svg>
  );
}

export function MechanicalGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden strokeWidth="1.5">
      <circle cx="20" cy="20" r="5" />
      <path d="M20 4 L20 10 M20 30 L20 36 M4 20 L10 20 M30 20 L36 20 M8 8 L13 13 M27 27 L32 32 M32 8 L27 13 M13 27 L8 32" />
    </svg>
  );
}

export function StructuralGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden strokeWidth="1.5">
      <path d="M6 6 L34 6 L34 34 L6 34 Z" />
      <path d="M6 6 L34 34 M34 6 L6 34" />
    </svg>
  );
}
```

- [ ] **Step 9.4: Rewrite `disciplines.tsx`**

Replace contents of `components/landing/disciplines.tsx` with:

```tsx
// ABOUTME: Disciplines showcase — 5 cards in a single row on desktop, two on tablet, one on mobile.
// ABOUTME: Each card links to a per-discipline leaderboard subroute (may 404 until Phase 3).
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import {
  CivilGlyph,
  ElectricalGlyph,
  GroundGlyph,
  MechanicalGlyph,
  StructuralGlyph,
} from './discipline-glyphs';
import type { ComponentType } from 'react';

interface Discipline {
  slug: string;
  code: string;
  name: string;
  description: string;
  taskCount: number;
  Glyph: ComponentType<{ className?: string }>;
}

const disciplines: Discipline[] = [
  { slug: 'civil',       code: 'CIV·01', name: 'Civil',       description: 'Roads, drainage, hydraulics, earthworks.',     taskCount: 108, Glyph: CivilGlyph      },
  { slug: 'electrical',  code: 'ELE·02', name: 'Electrical',  description: 'Cable sizing, fault current, lighting, power.', taskCount: 121, Glyph: ElectricalGlyph },
  { slug: 'ground',      code: 'GND·03', name: 'Ground',      description: 'Foundations, slopes, retaining walls.',         taskCount: 94,  Glyph: GroundGlyph     },
  { slug: 'mechanical',  code: 'MEC·04', name: 'Mechanical',  description: 'HVAC, fire protection, piping, acoustics.',     taskCount: 116, Glyph: MechanicalGlyph },
  { slug: 'structural',  code: 'STR·05', name: 'Structural',  description: 'Steel/concrete design, seismic, connections.',  taskCount: 108, Glyph: StructuralGlyph },
];

export function Disciplines() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={4} figName="DISCIPLINES" />
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <SectionAnno number={4} name="Disciplines" />
        <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
          Five engineering disciplines
        </h2>
        <p className="mb-8 mt-1 font-mono text-xs text-landing-muted">
          coverage <span className="text-accent-amber">547/547</span> tasks · verified against
          AS/NZS standards
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {disciplines.map(({ slug, code, name, description, taskCount, Glyph }) => (
            <Link
              key={slug}
              href={`/leaderboard/${slug}`}
              className="group flex min-h-[170px] flex-col overflow-hidden rounded border border-landing-border bg-[#050505] p-4 transition-colors hover:border-accent-amber"
            >
              <div className="mb-2 flex justify-between font-mono text-[0.6rem] uppercase tracking-wider text-[#666]">
                <span>{code.split('·')[0]}·</span>
                <span className="text-accent-amber">{code.split('·')[1]}</span>
              </div>
              {/* we render the code twice — once split across justify-between (above) and once as a single string for tests */}
              <span className="sr-only">{code}</span>
              <Glyph className="mb-2" />
              <h3 className="text-base font-semibold text-landing-text">{name}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-landing-muted">{description}</p>
              <div className="mt-2 font-mono text-xs text-accent-amber">
                {taskCount} <span className="text-[#555]">tasks</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </BlueprintBg>
  );
}
```

Note: the code chip renders split (`CIV·` / `01`) for visual hierarchy AND as a single screen-reader string (`CIV·01`) so the test's `getByText('CIV·01')` matches. Keep this pattern.

- [ ] **Step 9.5: Run and verify pass**

Run: `pnpm test tests/components/disciplines.test.tsx`
Expected: all 5 passing.

- [ ] **Step 9.6: Commit**

```bash
git add components/landing/disciplines.tsx components/landing/discipline-glyphs.tsx tests/components/disciplines.test.tsx
git commit -m "feat(landing): disciplines — 5-col grid, placeholder glyphs, per-discipline links"
```

---

### Task 10: HowItWorks rebuild (6-stage flow + CLI readout)

**Files:**
- Modify: `components/landing/how-it-works.tsx`
- Modify: `tests/components/how-it-works.test.tsx`

- [ ] **Step 10.1: Update failing tests**

Overwrite `tests/components/how-it-works.test.tsx`:

```tsx
// ABOUTME: Tests the restyled how-it-works section — 6 stages, CLI readout, docs link.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HowItWorks } from '@/components/landing/how-it-works';

describe('HowItWorks', () => {
  it('renders the heading', () => {
    render(<HowItWorks />);
    expect(screen.getByRole('heading', { name: /define.*run.*score/i })).toBeInTheDocument();
  });

  it('renders six numbered stages', () => {
    render(<HowItWorks />);
    for (const n of ['01', '02', '03', '04', '05', '06']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });

  it('renders the CLI readout mock', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/bench run/)).toBeInTheDocument();
    expect(screen.getByText(/cable-sizing/)).toBeInTheDocument();
  });

  it('links to architecture docs', () => {
    render(<HowItWorks />);
    const link = screen.getByRole('link', { name: /full pipeline/i });
    expect(link).toHaveAttribute('href', '/docs/core/architecture');
  });
});
```

- [ ] **Step 10.2: Run and verify failures**

Run: `pnpm test tests/components/how-it-works.test.tsx`
Expected: failures.

- [ ] **Step 10.3: Rewrite `how-it-works.tsx`**

Replace contents with:

```tsx
// ABOUTME: Landing "how it works" — six-stage flow diagram plus sample CLI readout.
// ABOUTME: Teal borders for setup phases (01-03), amber for execution phases (04-06).
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';

interface Stage {
  n: string;
  title: string;
  desc: string;
  phase: 1 | 2;
}

const stages: Stage[] = [
  { n: '01', title: 'Define task',      desc: 'Template + params',        phase: 1 },
  { n: '02', title: 'Resolve instance', desc: 'Jinja render',             phase: 1 },
  { n: '03', title: 'Stage env',        desc: 'Sandbox + tools',          phase: 1 },
  { n: '04', title: 'Execute agent',    desc: 'Harness drives the model', phase: 2 },
  { n: '05', title: 'Score output',     desc: 'Automated verifier',       phase: 2 },
  { n: '06', title: 'Aggregate',        desc: 'Ledger + report',          phase: 2 },
];

export function HowItWorks() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={5} figName="METHOD" />
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <SectionAnno number={5} name="How It Works" />
        <h2 className="mt-2 text-3xl font-bold text-landing-text md:text-4xl">
          Define → run → score
        </h2>
        <p className="mb-8 mt-1 font-mono text-xs text-landing-muted">
          six-stage pipeline · same flow every run
        </p>

        {/* Flow diagram */}
        <div className="rounded-lg border border-landing-border bg-[#050505] p-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {stages.map((s) => {
              const phaseBorder = s.phase === 1 ? 'border-accent-teal/40' : 'border-accent-amber/40';
              const phaseText   = s.phase === 1 ? 'text-accent-teal'      : 'text-accent-amber';
              return (
                <div
                  key={s.n}
                  className={`rounded border ${phaseBorder} bg-landing-bg/80 px-2 py-3`}
                >
                  <div className={`font-mono text-[0.55rem] tracking-widest ${phaseText}`}>
                    {s.n}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-landing-text">{s.title}</div>
                  <div className="mt-1 text-[0.65rem] leading-snug text-landing-muted">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CLI readout */}
        <pre className="mt-4 overflow-x-auto rounded-lg border border-landing-border bg-[#050505] p-3 font-mono text-xs leading-relaxed text-[#c7c7c7]">
<span className="text-accent-teal">aec-bench ~ $</span> bench run <span className="text-accent-amber">--task</span> cable-sizing <span className="text-accent-amber">--harness</span> tool_loop <span className="text-accent-amber">--model</span> claude-sonnet-4{'\n'}
<span className="text-[#666]">› resolving 24 task instances</span>{'\n'}
<span className="text-[#666]">› staging sandbox … </span><span className="text-[#6fd08a]">ok</span>{'\n'}
<span className="text-[#666]">› executing agent (tool_loop, 12 max turns)</span>{'\n'}
{'  '}instance 01/24 → reward <span className="text-accent-amber">0.83</span> tokens <span className="text-accent-amber">9.1k</span> turns <span className="text-accent-amber">6</span>{'\n'}
{'  '}instance 02/24 → reward <span className="text-accent-amber">0.71</span> tokens <span className="text-accent-amber">11.4k</span> turns <span className="text-accent-amber">8</span>{'\n'}
<span className="text-[#666]">› </span><span className="text-[#6fd08a]">done.</span><span className="text-[#666]"> ledger updated. see </span><span className="text-accent-amber">./out/0412-a7/</span>
        </pre>

        <div className="mt-4 font-mono text-sm">
          <Link
            href="/docs/core/architecture"
            className="inline-flex items-center gap-2 text-accent-amber transition-opacity hover:opacity-80"
          >
            <span className="text-accent-teal">→</span>
            read the full pipeline
          </Link>
        </div>
      </div>
    </BlueprintBg>
  );
}
```

- [ ] **Step 10.4: Run and verify pass**

Run: `pnpm test tests/components/how-it-works.test.tsx`
Expected: all 4 passing.

- [ ] **Step 10.5: Commit**

```bash
git add components/landing/how-it-works.tsx tests/components/how-it-works.test.tsx
git commit -m "feat(landing): how-it-works — 6-stage flow + CLI readout"
```

---

### Task 11: CTA rebuild + CopyBox

**Files:**
- Create: `components/landing/copy-box.tsx`
- Create: `tests/components/copy-box.test.tsx`
- Modify: `components/landing/cta.tsx`
- Modify: `tests/components/cta.test.tsx`

- [ ] **Step 11.1: Write CopyBox test**

Create `tests/components/copy-box.test.tsx`:

```tsx
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
    render(<CopyBox command="pip install aec-bench" />);
    expect(screen.getByText('pip install aec-bench')).toBeInTheDocument();
  });

  it('copies to clipboard and shows "copied" feedback on click', async () => {
    render(<CopyBox command="pip install aec-bench" />);
    const btn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pip install aec-bench');
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 11.2: Run and verify failure**

Run: `pnpm test tests/components/copy-box.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 11.3: Implement `copy-box.tsx`**

```tsx
// ABOUTME: Reusable terminal-style command box with copy-to-clipboard button.
// ABOUTME: Shows "copied" for 1.5s after a successful copy, then reverts.
'use client';

import { useState } from 'react';

interface CopyBoxProps {
  command: string;
  prompt?: string;
}

export function CopyBox({ command, prompt = '$' }: CopyBoxProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore — if clipboard API unavailable, just fail silently */
    }
  }

  return (
    <div className="mx-auto flex max-w-xl items-stretch overflow-hidden rounded border border-landing-border bg-[#050505]">
      <div className="flex flex-1 items-center gap-2 px-4 py-3 text-left font-mono text-sm text-landing-text">
        <span aria-hidden className="text-accent-teal">{prompt}</span>
        <span>{command}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="border-l border-landing-border bg-landing-card px-4 font-mono text-xs uppercase tracking-wider text-landing-muted transition-colors hover:text-accent-amber"
      >
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  );
}
```

- [ ] **Step 11.4: Run CopyBox tests, verify pass**

Run: `pnpm test tests/components/copy-box.test.tsx`
Expected: 2 passing.

- [ ] **Step 11.5: Update CTA tests**

Overwrite `tests/components/cta.test.tsx`:

```tsx
// ABOUTME: Tests the restyled CTA section — install command, meta line, secondary buttons.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CallToAction } from '@/components/landing/cta';

describe('CallToAction', () => {
  it('renders the pitch', () => {
    render(<CallToAction />);
    expect(
      screen.getByRole('heading', { name: /benchmark your model against real engineering/i }),
    ).toBeInTheDocument();
  });

  it('renders the pip install CopyBox', () => {
    render(<CallToAction />);
    expect(screen.getByText('pip install aec-bench')).toBeInTheDocument();
  });

  it('renders the mono meta line with latest version and stars', () => {
    render(<CallToAction />);
    expect(screen.getByText(/v0\.4\.1/)).toBeInTheDocument();
    expect(screen.getByText(/2\.4k/)).toBeInTheDocument();
  });

  it('renders three secondary commands', () => {
    render(<CallToAction />);
    expect(screen.getByRole('link', { name: /quickstart/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contribute a task/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /submit your model/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 11.6: Run, verify failure**

Run: `pnpm test tests/components/cta.test.tsx`
Expected: failures against current CTA.

- [ ] **Step 11.7: Rewrite `cta.tsx`**

```tsx
// ABOUTME: Bottom call-to-action — pip install copy-box, version meta line, three secondary commands.
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { CopyBox } from './copy-box';

export function CallToAction() {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={6} figName="CTA" />
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <div className="flex justify-center">
          <SectionAnno number={6} name="Run it yourself" />
        </div>
        <h2 className="mt-3 text-3xl font-bold leading-tight text-landing-text md:text-4xl">
          Benchmark your model against real engineering.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-landing-muted">
          Open-source. Reproducible. Runs locally or against any provider.
        </p>

        <div className="mt-8">
          <CopyBox command="pip install aec-bench" />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3 font-mono text-xs text-landing-muted">
          <span>latest <span className="text-accent-amber">v0.4.1</span></span>
          <span>·</span>
          <Link
            href="https://github.com/aurecon/aec-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-landing-text"
          >
            github.com/aurecon/aec-bench
          </Link>
          <span>·</span>
          <span className="text-accent-teal">2.4k ★</span>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs/start/quickstart"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden className="text-accent-teal">&gt;</span>quickstart
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden className="text-accent-teal">&gt;</span>contribute a task
          </Link>
          <Link
            href="https://github.com/aurecon/aec-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded border border-landing-border px-4 py-3 font-mono text-sm text-landing-text transition-colors hover:border-accent-amber"
          >
            <span aria-hidden className="text-accent-teal">&gt;</span>submit your model
          </Link>
        </div>
      </div>
    </BlueprintBg>
  );
}
```

- [ ] **Step 11.8: Run CTA tests, verify pass**

Run: `pnpm test tests/components/cta.test.tsx`
Expected: all 4 passing.

- [ ] **Step 11.9: Commit**

```bash
git add components/landing/copy-box.tsx components/landing/cta.tsx tests/components/copy-box.test.tsx tests/components/cta.test.tsx
git commit -m "feat(landing): CTA — pip install CopyBox, meta line, secondary commands"
```

---

### Task 12: Reorder landing sections (include RewardCostTeaser)

**Files:**
- Modify: `app/(home)/page.tsx`

- [ ] **Step 12.1: Rewrite `page.tsx`**

Replace contents of `app/(home)/page.tsx` with:

```tsx
// ABOUTME: Landing page assembling all sections for the aec-bench site.
// ABOUTME: Uses the (home) route group with HomeLayout and StatusBar mounted in layout.tsx.
import { Hero } from '@/components/landing/hero';
import { LeaderboardPreview } from '@/components/landing/leaderboard-preview';
import { RewardCostTeaser } from '@/components/landing/reward-cost-teaser';
import { Disciplines } from '@/components/landing/disciplines';
import { HowItWorks } from '@/components/landing/how-it-works';
import { CallToAction } from '@/components/landing/cta';

export default function HomePage() {
  return (
    <main className="bg-gradient-to-b from-landing-bg to-landing-bg-end">
      <Hero />
      <LeaderboardPreview />
      <RewardCostTeaser />
      <Disciplines />
      <HowItWorks />
      <CallToAction />
    </main>
  );
}
```

- [ ] **Step 12.2: Run full component test suite**

Run: `pnpm test`
Expected: all green.

- [ ] **Step 12.3: Commit**

```bash
git add app/(home)/page.tsx
git commit -m "feat(landing): insert RewardCostTeaser as section 03"
```

---

### Task 13: Nav cleanup — drop Blog, external icon on The Harness

**Files:**
- Modify: `lib/layout.shared.tsx`
- Delete: `app/(home)/blog/page.tsx` (+ surrounding folder)

- [ ] **Step 13.1: Update E2E to remove the Blog expectation**

The existing `tests/e2e/landing.spec.ts` does not reference `/blog` directly, but let's confirm and add a positive assertion for The Harness. Overwrite `tests/e2e/landing.spec.ts`:

```ts
// ABOUTME: End-to-end tests for the landing page and nav.
// ABOUTME: Verifies page loads, sections visible, status bar, nav, and deep links.
import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders the hero headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /how capable is ai/i })).toBeVisible();
  });

  test('shows the persistent status bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('status', { name: /aec-bench run status/i })).toBeVisible();
    await expect(page.getByText('0412-a7')).toBeVisible();
  });

  test('renders the leaderboard preview with model rows', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /current standings/i })).toBeVisible();
    await expect(page.getByText('Claude Sonnet 4')).toBeVisible();
  });

  test('renders the reward × cost teaser', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /reward.*cost/i })).toBeVisible();
  });

  test('renders disciplines and how-it-works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /five engineering disciplines/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /define.*run.*score/i })).toBeVisible();
  });

  test('CTA copy button copies pip install command', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.getByRole('button', { name: /^copy$/i }).click();
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible();
  });

  test('explore_results CTA goes to /leaderboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /explore_results/i }).click();
    await expect(page).toHaveURL('/leaderboard');
  });

  test('nav does not include Blog link', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a');
    const texts = await navLinks.allInnerTexts();
    expect(texts.every((t) => !/^blog$/i.test(t.trim()))).toBe(true);
  });

  test('nav includes The Harness linking to external blog', async ({ page }) => {
    await page.goto('/');
    const harness = page.getByRole('link', { name: /the harness/i }).first();
    await expect(harness).toHaveAttribute('href', 'https://www.theharness.blog');
  });
});
```

- [ ] **Step 13.2: Delete `(home)/blog`**

Run:
```bash
rm -rf "app/(home)/blog"
```

- [ ] **Step 13.3: Update `lib/layout.shared.tsx`**

Replace contents:

```tsx
// ABOUTME: Shared layout configuration for Fumadocs HomeLayout and DocsLayout.
// ABOUTME: Defines navigation links, logo, and GitHub URL used across all layouts.
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Image
            src="/logo-dark.png"
            alt="aec-bench"
            width={28}
            height={20}
            className="hidden dark:block"
          />
          <Image
            src="/logo-light.png"
            alt="aec-bench"
            width={28}
            height={20}
            className="dark:hidden"
          />
          <span className="font-bold">aec-bench</span>
        </div>
      ),
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Leaderboard',
        url: '/leaderboard',
        active: 'url',
      },
      {
        text: 'The Harness ↗',
        url: 'https://www.theharness.blog',
        active: 'none',
        external: true,
      },
    ],
    githubUrl: 'https://github.com/aurecon/aec-bench',
  };
}
```

Note: if Fumadocs' `BaseLayoutProps` link type doesn't accept `external`, omit the property — the `↗` glyph in the text already signals it. The `active: 'none'` + `url: https://…` is sufficient for Fumadocs to render as external.

- [ ] **Step 13.4: Run unit tests + build to ensure nothing else referenced `/blog`**

Run:
```bash
pnpm test
pnpm build
```

Expected: tests pass; build succeeds (no references to the deleted route).

If the build fails with a lingering reference (e.g., an import in `meta.json`), remove it before continuing.

- [ ] **Step 13.5: Commit**

```bash
git add lib/layout.shared.tsx tests/e2e/landing.spec.ts
git add -u  # picks up the deletion of app/(home)/blog/
git commit -m "chore(nav): retire /blog placeholder; link The Harness as external"
```

---

### Task 14: Final checks — dev-server smoke, axe, responsive

**Files:** none modified; this task is verification only.

- [ ] **Step 14.1: Start dev server**

Run in a separate shell:
```bash
pnpm dev
```

Wait for `ready - started server on 0.0.0.0:3000`.

- [ ] **Step 14.2: Manual smoke in browser**

Open `http://localhost:3000/` and verify visually:

- Status bar under the nav shows `● LIVE · run_id 0412-a7 · tasks 547 · models 14 · disciplines 5 · last_run 2h ago`
- Hero has amber cursor blink, terminal readout on the right at ≥ md viewport
- `$ explore_results` and `> read_the_docs` buttons
- Leaderboard preview shows window chrome, per-discipline bars, delta column, tokens, cost
- Reward × Cost teaser: top-4 list + mini scatter with amber dashed Pareto line
- Disciplines: 5 cards in a single row at lg viewport, codes CIV·01..STR·05
- How It Works: 6 stages (3 teal + 3 amber) and CLI readout
- CTA: `$ pip install aec-bench` copy-box, meta line with `v0.4.1` and `2.4k ★`, three ghost buttons
- Shrink to 375px: mobile layout stacks, no horizontal scroll

- [ ] **Step 14.3: Run full test + E2E suites**

```bash
pnpm test
pnpm test:e2e
```

Expected: both green.

- [ ] **Step 14.4: Accessibility spot-check**

In the browser DevTools, run an Axe audit against `/` (via the Axe browser extension, or manually check these known items):

- All SVG glyphs have `aria-hidden` or `role="img"` + label
- Headings form a valid outline (H1 once, H2 per section)
- Status bar has `role="status"` and an `aria-label`
- Reduced-motion: set `prefers-reduced-motion: reduce` in DevTools → Rendering → verify no animations run (cursor becomes solid, LIVE dot stops pulsing)

- [ ] **Step 14.5: Commit any incidental fixes**

If Step 14.2/14.4 surfaces small issues (e.g., missing focus ring on a Link, a typo), fix them in a follow-up commit:

```bash
git add -A
git commit -m "fix(landing): <one-line description of the incidental fix>"
```

Only commit if there are real changes — do NOT commit an empty follow-up.

---

## Self-Review

Checked each spec section against a task:

- Colour tokens / `.anno` utility → Task 1
- Typography roles → established in hero/preview tasks (no dedicated task needed — no new fonts)
- Status bar → Task 5
- Blueprint grid → Task 3 (primitive), applied inside each section task
- Corner annotations → Task 3 (primitive), applied in each section task
- Scanlines → Task 1 (utility), Task 6 (hero uses `className="scanlines"`)
- Motion rules → Task 2 (primitive); each section consumes `<FadeUp>` if wrapping is added at integration time. Note: the plan currently doesn't sprinkle `<FadeUp>` into every section to keep tasks smaller; adding it is a one-line wrap per section. If Theo wants explicit motion coverage, add a Task 15 to wrap each section's children in `<FadeUp>`.
- Section 01 Hero → Task 6
- Section 02 Standings table → Task 7
- Section 03 Reward × Cost (new) → Task 8
- Section 04 Disciplines → Task 9
- Section 05 How It Works → Task 10
- Section 06 CTA → Task 11
- Page reorder with new section → Task 12
- Nav de-dupe + /blog deletion → Task 13
- Accessibility + reduced-motion + responsive → Task 14
- Data contract extensions → Task 4

Placeholders scan: no `TBD`/`TODO` lines; every test includes the actual test code; every implementation step includes the full component; commands have expected outputs.

Type consistency: `PreviewModel.provider` is a union (`'anthropic' | 'openai' | 'google' | 'meta'`), used as the key of `providerColour` in Task 8 — consistent. `deltaLastRun` is a `number` consistently (positive/negative), formatted with `+`/`−` at render time.

One small ambiguity noted and accepted: the spec says "may import `BenchmarkRunFlow` with simplified labels, or write a landing-specific variant". The plan (Task 10) writes a landing-specific variant to keep the task self-contained — this is an intentional call, and the variant is a small enough component that the cost of duplication is acceptable.

---

## Out of Scope (deferred — see memory `aecbench-deferred-scope`)

- `/leaderboard` full interactive table + Pareto scatter (Phase 3, Nivo).
- `/leaderboard/[discipline]` subroutes (Phase 3).
- `/leaderboard/models/[slug]` (Phase 4).
- Supabase wiring — all data remains in TS files.
- Real discipline glyph artwork.
- Footer restyling.
