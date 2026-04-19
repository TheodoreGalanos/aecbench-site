# `/leaderboard/[discipline]` — design spec

**Date:** 2026-04-19
**Status:** Approved for planning
**Supersedes:** N/A (new feature)
**Related specs:**
- `2026-04-18-leaderboard-ui-design.md` (LeaderboardSurface container + `lockedDiscipline` prop it exposes)
- `2026-04-18-leaderboard-infra-design.md` (ingest pipeline, per-discipline slice emission)

## 1. Goal

Ship the 5 per-discipline sub-routes the landing already deep-links to (`civil`, `electrical`, `ground`, `mechanical`, `structural`). Each route is a thin RSC wrapper around the existing `LeaderboardSurface`, pre-filtered to the slug and augmented with a trailing content slot that shows the library's task catalogue for that discipline.

This is a deferred Phase 3 item from the landing-polish scope, enabled by a new library-side export (`aec-bench library export` → `artefacts/library-catalogue.json`) that ships rich per-task metadata the site has not previously had access to.

## 2. Non-goals

- `/leaderboard/models/[slug]` (Phase 4).
- Task-detail pages (not yet scoped).
- Real discipline glyph SVGs (placeholders stay; designer follow-up).
- Production delivery automation for the library catalogue (commit-pointer today; release-asset flow later).
- Search/filter within the catalogue section (YAGNI at current scale; category grouping carries the load).
- Per-discipline OpenGraph images (Phase 4 niceness).

## 3. User-facing outcomes

- A user clicking a discipline card from the landing lands on a dedicated page headed with the discipline name and a short description.
- The Pareto chart + leaderboard table are pre-filtered (re-ranked) to that discipline. Filter state is locked for the discipline axis; harness and axis-x filters remain interactive.
- Below the surface, users see the full task catalogue for the discipline — grouped by category, collapsed by default, with honest `built / proposed` status.
- Prev/next navigation chips at the bottom let users traverse the five disciplines without returning to the landing.

## 4. Architecture

### 4.1 Route

`app/(home)/leaderboard/[discipline]/page.tsx` — React Server Component.

- `generateStaticParams()` returns the five slugs.
- Invalid slug → `notFound()` (renders Next's 404).
- Per-discipline `generateMetadata()` populates title + description.

### 4.2 Reuse

`LeaderboardSurface` is consumed unchanged via its existing props:

```ts
<LeaderboardSurface
  entries={slice.entries}          // pre-reranked from public/data/disciplines/{slug}.json
  isMock={isMock()}
  runStatus={getRunStatus()}
  heading={DISCIPLINE_META[slug].name}
  subheading={DISCIPLINE_META[slug].description}
  lockedDiscipline={slug}
  trailingSlot={<DisciplineTrailingSlot … />}
/>
```

No changes to `LeaderboardSurface`, `useLeaderboardState`, or any component under `components/leaderboard/`.

### 4.3 New modules

| Path | Purpose |
|---|---|
| `lib/disciplines.ts` | Single source of truth for `{code, name, description}` per discipline + `neighbours()` helper. Consumed by landing + new routes. |
| `lib/aec-bench/library-catalogue.ts` | Zod contract + read helper for `public/data/library-catalogue.json`. |
| `scripts/sync/library-catalogue.ts` | Copies the library's catalogue artefact from the sibling `aec-bench/` checkout to the site's `public/data/`. |
| `components/discipline/discipline-trailing-slot.tsx` | Server component composing the trailing slot. |
| `components/discipline/catalogue-summary.tsx` | One-line stats + provenance. |
| `components/discipline/category-section.tsx` | Native `<details>` collapsible section per category. |
| `components/discipline/task-card.tsx` | Single task card (template or seed). |
| `components/discipline/discipline-nav.tsx` | Prev/next chip nav. |

### 4.4 Data flow

```
aec-bench (sibling checkout)
  └─ artefacts/library-catalogue.json              (manual: aec-bench library export)
          │ pnpm sync:catalogue  (dev — option A)
          ↓
aecbench-site/
  ├─ public/data/library-catalogue.json            (committed — option C for prod)
  └─ public/data/disciplines/{slug}.json           (existing, from pnpm ingest)
          │
          ↓ RSC reads at build time
app/(home)/leaderboard/[discipline]/page.tsx
  └─ <LeaderboardSurface … trailingSlot={<DisciplineTrailingSlot />} />
```

Dev loop: `pnpm sync:catalogue && pnpm ingest && pnpm dev`. Production: Vercel builds from committed artefacts; no network calls, no sibling repo requirement.

## 5. Data contract

`lib/aec-bench/library-catalogue.ts` mirrors the library's v1 export shape.

```ts
export const CatalogueIOSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  type: z.string().nullable().optional(),
  tolerance: z.number().nullable().optional(),
});

export const LibraryCatalogueEntrySchema = z.object({
  task_id: z.string(),
  discipline: z.enum(DOMAINS),
  category: z.string(),
  category_label: z.string().nullable(),
  task_name: z.string(),
  description: z.string(),
  long_description: z.string().optional(),
  standards: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  inputs:  z.array(CatalogueIOSchema),
  outputs: z.array(CatalogueIOSchema),
  status: z.enum(['built', 'proposed']),
  difficulty_tiers: z.array(z.enum(['easy','medium','hard'])).nullable(),
  complexity: z.enum(['low','medium','high']).nullable().optional(),
  tool_mode: z.string().nullable().optional(),
  archetype_count: z.number().int().nullable().optional(),
});

export const LibraryCatalogueSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string(),
  library_version: z.string(),
  library_commit: z.string(),
  counts: z.object({
    total_templates: z.number(),
    total_seeds: z.number(),
    by_discipline: z.record(z.enum(DOMAINS), z.object({
      templates: z.number(),
      seeds: z.number(),
    })),
  }),
  templates: z.array(LibraryCatalogueEntrySchema),
  seeds:     z.array(LibraryCatalogueEntrySchema),
});
```

### Schema-version handling

`getCatalogue()` validates with zod. `schema_version` mismatch throws with an actionable message:

```
Library catalogue schema_version 2 unsupported (site supports v1).
Re-run 'pnpm sync:catalogue' or upgrade the site.
```

Fail loudly at build — do not soft-degrade.

### Read helpers

```ts
getCatalogue(): LibraryCatalogue                               // cached file read + validate
getCatalogueForDiscipline(slug: Domain): {
  templates: LibraryCatalogueEntry[];
  seeds:     LibraryCatalogueEntry[];
  categories: Array<{
    key: string;              // category slug
    label: string;            // category_label or prettified key
    built: LibraryCatalogueEntry[];
    proposed: LibraryCatalogueEntry[];
  }>;
  totals: { tasks: number; built: number; proposed: number; categories: number; standards: number };
}
```

## 6. Discipline metadata module

`lib/disciplines.ts`:

```ts
import type { Domain } from '@/lib/aec-bench/contracts';

export interface DisciplineMeta {
  code: string;         // e.g. "CIV·01"
  name: string;         // e.g. "Civil"
  description: string;  // one-line card copy
}

export const DISCIPLINE_META: Record<Domain, DisciplineMeta> = {
  civil:      { code: 'CIV·01', name: 'Civil',      description: 'Roads, drainage, hydraulics, earthworks.' },
  electrical: { code: 'ELE·02', name: 'Electrical', description: 'Cable sizing, fault current, lighting, power.' },
  ground:     { code: 'GND·03', name: 'Ground',     description: 'Foundations, slopes, retaining walls.' },
  mechanical: { code: 'MEC·04', name: 'Mechanical', description: 'HVAC, fire protection, piping, acoustics.' },
  structural: { code: 'STR·05', name: 'Structural', description: 'Steel/concrete design, seismic, connections.' },
};

export const DISCIPLINE_ORDER: readonly Domain[] = [
  'civil', 'electrical', 'ground', 'mechanical', 'structural',
];

export function neighbours(slug: Domain): { prev: Domain; next: Domain } {
  const i = DISCIPLINE_ORDER.indexOf(slug);
  const n = DISCIPLINE_ORDER.length;
  return {
    prev: DISCIPLINE_ORDER[(i - 1 + n) % n],
    next: DISCIPLINE_ORDER[(i + 1) % n],
  };
}
```

## 7. Component specs

### 7.1 `DisciplineTrailingSlot`

Server component. Props:

```ts
{
  slug: Domain;
  catalogue: ReturnType<typeof getCatalogueForDiscipline>;
  catalogueMeta: { library_version: string; library_commit: string; generated_at: string };
}
```

Layout:

```
┌──────────────────────────────────────────────┐
│ CatalogueSummary                              │
├──────────────────────────────────────────────┤
│ ▶ Category A (8)  ● 3 built · ○ 5 proposed   │   ← collapsed
│ ▶ Category B (12) ● 0 built · ○ 12 proposed  │
│ ▶ …                                           │
├──────────────────────────────────────────────┤
│ DisciplineNav (prev/next chips)               │
└──────────────────────────────────────────────┘
```

### 7.2 `CatalogueSummary`

Two lines, mono styling matching the leaderboard header.

```
87 tasks · 56 built · 31 proposed · 12 categories · 42 standards
catalogue library v0.1.0 · @ 1a2b3c4 · generated 2026-04-19
```

Line 2 is muted (`text-landing-muted`). Commit hash truncated to 7 chars.

### 7.3 `CategorySection`

Native `<details>`/`<summary>` — no JS, no client component, no framer-motion.

```jsx
<details className="…">
  <summary className="…">
    <span className="font-semibold">{label}</span>
    <span className="font-mono text-xs text-landing-muted">
      ({total}) · <span className="text-accent-amber">● {built}</span> · ○ {proposed}
    </span>
  </summary>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
    {allCards}
  </div>
</details>
```

Collapsed by default. Expansion state is not URL-persisted (ephemeral).

### 7.4 `TaskCard`

One component handles both templates and seeds (distinguished by `status`).

```
┌──────────────────────────────────────┐
│ [BUILT]  Hudson Armor Sizing  [hard] │  ← status pill, task_name, difficulty chip
│ Armor stone sizing using Hudson's…   │  ← description (clamp-2)
│ [AS/NZS 3008.1.1] [CIRIA C683] +1    │  ← standards chips, overflow
│ 5 inputs → 3 outputs · 5 archetypes  │  ← footer, mono
└──────────────────────────────────────┘
```

- Status pill: `BUILT` (amber bg, dark text) or `PROPOSED` (teal bg, dark text). Uppercase, mono, 0.65rem.
- Difficulty chip:
  - Template (`difficulty_tiers` non-null, canonically sorted `[easy < medium < hard]`): render as `min–max` range (e.g. `easy–hard`, `easy–medium`) when array length > 1; single tier string when length === 1.
  - Seed (`complexity` non-null): render the single value (`low` / `medium` / `high`).
  - Both null: omit the chip entirely.
- Standards: up to 3 chips, `+N more` for overflow (no expansion — just a count signal).
- IO footer: `"N inputs → M outputs"`. Add `"· K archetypes"` if template has `archetype_count > 0`.
- Not clickable — no detail page exists yet. Cursor stays default.

### 7.5 `DisciplineNav`

Bottom-of-page mono line:

```
← prev: electrical   ·   next: ground →
```

Both are `<Link>` elements. Wraps: structural→civil.

## 8. Landing changes

### 8.1 Metadata extraction

`components/landing/disciplines.tsx` currently hardcodes the `disciplines` array. Refactor to import `DISCIPLINE_META` + `DISCIPLINE_ORDER` from `lib/disciplines.ts`. Glyph component map stays local (landing-specific).

### 8.2 Live taskCounts — per-card display

Replace hardcoded `{ taskCount: 108, … }` with live counts from the catalogue. The Disciplines component receives counts as props from the landing page RSC.

Display format (option B from design Q):

```
56 built
+ 31 proposed
```

Line 1: `text-accent-amber`, mono. Line 2: `text-landing-muted`, smaller.

### 8.3 Landing coverage line

Header today reads: `coverage 547/547 tasks · verified against AS/NZS standards`. Replace `547` with `catalogue.counts.total_templates + catalogue.counts.total_seeds` (today: 79 + 388 = 467). Denominator matches the numerator — no partial coverage claim.

### 8.4 What does not change

- Discipline card visual layout, colours, glyphs, hover behaviour.
- Disciplines section position, background, figure number annotation.
- Any other landing section.

## 9. Sync script

`scripts/sync/library-catalogue.ts` + `pnpm sync:catalogue`.

Contract:

```
SOURCE: $AEC_BENCH_ROOT/artefacts/library-catalogue.json   (default: ../aec-bench)
TARGET: public/data/library-catalogue.json
BEHAVIOUR:
  - Read source (fail if absent with actionable message).
  - Parse + zod-validate (fail on schema drift).
  - Write to target with 2-space JSON.
  - Log source commit + generated_at for traceability.
```

Missing-source error:

```
Library catalogue not found at: ../aec-bench/artefacts/library-catalogue.json

Resolve by either:
  1. Running 'aec-bench library export' in the sibling repo, OR
  2. Setting AEC_BENCH_ROOT to the library checkout path
```

Wiring:
- `pnpm ingest` invokes `pnpm sync:catalogue` as its first step.
- `pnpm sync:catalogue` is idempotent and safe to run standalone.

## 10. Delivery (dev / production)

Per Q3 resolution: **A for dev, C for production**.

- **Dev (A):** `pnpm sync:catalogue` copies from the sibling checkout at build/dev time. Catalogue file is gitignored by default.
- **Production (C):** the catalogue file is **committed** to the site repo at `public/data/library-catalogue.json`. Vercel builds consume the committed artefact; no sibling repo, no network.

This requires carving an exception in `.gitignore`:

```gitignore
/public/data/
!/public/data/library-catalogue.json
```

Catalogue refresh workflow when the library updates:
1. `pnpm sync:catalogue` in dev → updates the committed file.
2. PR with the diff (reviewers can see task counts / schema changes).
3. Merge → Vercel redeploys.

Equivalent pattern to `data/pricing-snapshot.json` and `data/models.yml`.

Future-work memory note (to be added after this spec approves): library-side CI that publishes `library-catalogue.json` as a GitHub release asset per tagged library version. Until that exists, the PR-bump flow is authoritative.

## 11. Empty-state behaviour

- **Leaderboard slice empty** (no submissions for the discipline yet). `LeaderboardSurface` already handles zero entries gracefully — verified during implementation, no new code.
- **Catalogue empty** (impossible today; all 5 disciplines have ≥13 entries). If it happens in future, `DisciplineTrailingSlot` renders `CatalogueSummary` + a "no templates or seeds registered for this discipline yet" mono line, skipping category sections.
- **Catalogue file missing entirely.** Build fails via sync script — never reaches runtime.

## 12. Testing strategy

Layered following the `/leaderboard` sprint precedent.

### 12.1 Pure-logic unit tests (Vitest)

- `lib/disciplines.test.ts` — `neighbours()` wraparound; slug validity.
- `lib/aec-bench/library-catalogue.test.ts` — zod round-trip against a frozen fixture; `schema_version` mismatch throws; `getCatalogueForDiscipline()` groups correctly; counts reconcile with per-entry filter (sanity check against pre-computed `counts`).
- `scripts/sync/library-catalogue.test.ts` — honours `AEC_BENCH_ROOT`; missing-source error message format; target written with correct content.

### 12.2 Component unit tests (Vitest + Testing Library)

- `CatalogueSummary` — totals, provenance line, truncated commit.
- `CategorySection` — collapsed by default; expand exposes cards; badge arithmetic.
- `TaskCard` — built vs proposed pill colour; template vs seed rendering (difficulty_tiers array vs complexity string); standards overflow; IO count line; archetype footer conditional.
- `DisciplineNav` — 5 slugs' prev/next pairs; wraparound.
- `Disciplines` (landing) — props-driven counts render two-line `N built / +M proposed`.

### 12.3 Route integration (Vitest, RSC render)

- Each of 5 slugs: renders heading, subheading, surface, trailing slot.
- Invalid slug → `notFound()` path exercised.
- `generateStaticParams()` returns exactly `['civil','electrical','ground','mechanical','structural']`.
- `generateMetadata()` produces per-slug title/description.

### 12.4 E2E (Playwright)

- From landing, click each discipline card → correct route, correct heading.
- `lockedDiscipline` behaviour: ControlStrip does not expose the `--discipline` chip.
- Expand a `CategorySection` → cards visible. Collapse → hidden.
- Prev/next nav: click next → URL + heading update, wraparound works.
- URL-sync cross-page: set `axisX=tokens` on `/leaderboard/civil`, navigate to `/leaderboard/electrical` via next chip, verify existing `useLeaderboardState` preserves intended behaviour (spec verifies; no new code — if broken, file a follow-up).

### 12.5 Bundle budget guard

- Extend `pnpm test:bundle` to include `/leaderboard/civil` as the representative discipline bundle.
- Budget: same 150 KB ceiling as `/leaderboard`. Trailing slot is server-rendered so the incremental cost is near-zero.
- Fail if discipline route exceeds `/leaderboard` by more than 10 KB.

### 12.6 a11y (axe-core + Playwright)

- Zero-violation audit on `/leaderboard/civil` desktop + mobile.
- Native `<details>`/`<summary>` a11y is verified in both collapsed and expanded states.
- Status pill contrast meets WCAG AA on the dark background.

### 12.7 Fixture management

- Vitest uses a frozen `__fixtures__/library-catalogue.json` committed into the site repo — so contract and grouping tests assert against a known snapshot independent of catalogue refreshes.
- Playwright and the Vercel production build both consume the committed `public/data/library-catalogue.json` directly; no sync step in CI. The sync script exists solely to refresh that committed file during dev from the sibling `aec-bench/` checkout.

## 13. TDD / build order

For the implementation plan:

1. `lib/disciplines.ts` + tests (smallest, zero deps).
2. `lib/aec-bench/library-catalogue.ts` contract + read helper + tests.
3. `scripts/sync/library-catalogue.ts` + tests.
4. Bottom-up components: `DisciplineNav`, `CatalogueSummary`, `TaskCard`, `CategorySection` + tests.
5. `DisciplineTrailingSlot` assembly + tests.
6. Route wiring (`app/(home)/leaderboard/[discipline]/page.tsx`) + integration tests.
7. Landing refactor: metadata module consumption + live taskCounts + coverage line + tests.
8. E2E + bundle guard + a11y audit.
9. Commit `public/data/library-catalogue.json` and carve gitignore exception.

## 14. Risks / known gaps

- Mechanical and structural have 0 built templates today. Catalogue sections show honest `0 built / N proposed` — acceptable per "no one has seen the site yet" (Theo, 2026-04-19).
- Library catalogue is produced manually — no CI publication yet. Track as a lib-gap memory item.
- Per-discipline OG images, task-detail pages, search/filter within catalogue — all Phase 4+.

## 15. Open decisions (resolved during brainstorm)

| # | Decision | Resolution |
|---|---|---|
| D1 | Catalogue file committed vs gitignored | **Committed** (option C). Gitignore exception for the specific path. |
| D2 | Prev/next chip placement | **Bottom of trailing slot** only. |
| D3 | Cards layout | **Grouped by category, collapsed by default** (option B from Q4). |
| D4 | Sequencing relative to library export | **Library export landed first** (2026-04-19); site consumes v1 schema. |
| D5 | Landing taskCount format | **Two-line `N built / +M proposed`** (option B from section 3). |

## 16. Success criteria

- All 5 slugs render without error.
- Landing deep-links resolve (no 404s).
- Bundle budget within 150 KB on the representative discipline route.
- Zero axe violations.
- Full e2e path green across all 5 disciplines.
- Landing no longer shows the hardcoded 108/121/94/116/108 figures; real catalogue counts drive the cards.
- Leaderboard slice ranking remains correct under `lockedDiscipline` (existing behaviour, verified).
