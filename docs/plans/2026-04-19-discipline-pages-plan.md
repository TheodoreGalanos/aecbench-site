# `/leaderboard/[discipline]` Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five thin RSC wrappers at `/leaderboard/{civil,electrical,ground,mechanical,structural}` around the existing `LeaderboardSurface`, each augmented with a server-rendered catalogue trailing slot that groups the library's templates + seeds by category, plus a landing refactor that consumes live catalogue counts.

**Architecture:** Bottom-up in six layers. (1) Test fixtures for the new library-catalogue shape. (2) Pure-logic modules: `lib/disciplines.ts` (metadata + neighbours) and `lib/aec-bench/library-catalogue.ts` (zod contract + `getCatalogueForDiscipline` grouping). (3) A `scripts/sync/library-catalogue.ts` dev sync script that pulls `artefacts/library-catalogue.json` from the sibling `aec-bench/` checkout, plus a `.gitignore` exception that commits the resulting file as a production artefact. (4) Four server components under `components/discipline/` — `CatalogueSummary`, `TaskCard`, `CategorySection` (native `<details>`), `DisciplineNav` — assembled by `DisciplineTrailingSlot`. (5) A single dynamic route `app/(home)/leaderboard/[discipline]/page.tsx` with `generateStaticParams`, `generateMetadata`, and `notFound()` fallback. (6) Landing refactor: import `DISCIPLINE_META` from `lib/disciplines`, replace hardcoded `taskCount` with `{N built / +M proposed}`, live coverage figure. E2E + axe + bundle budget follow the `/leaderboard` precedent.

**Tech Stack:** TypeScript, React 19, Next.js 15 App Router RSC, Tailwind CSS 4, zod (already a dep), vitest + @testing-library/react for unit/component tests, Playwright + @axe-core/playwright for E2E + a11y, `tsx` for node scripts. Zero new runtime dependencies.

**Reference spec:** `docs/specs/2026-04-19-discipline-pages-design.md`.

---

## Pre-flight

Create an isolated worktree off `main`, then confirm the baseline is green before starting.

```bash
cd /Users/theodoros.galanos/LocalProjects/aecbench-site
git fetch --all --prune
git worktree add .worktrees/discipline-pages -b phase3/discipline-pages main
cd .worktrees/discipline-pages
pnpm install

# First catalogue sync (sibling aec-bench must have artefacts/library-catalogue.json).
# We'll build the proper sync script in Task 5; this manual copy gets tests green in the meantime.
mkdir -p public/data
cp ../../../aec-bench/artefacts/library-catalogue.json public/data/library-catalogue.json

pnpm ingest
pnpm test
pnpm test:e2e --project=chromium tests/e2e/leaderboard-smoke.spec.ts
```

Expected: all existing tests pass. If not, stop and investigate — you want a clean baseline.

Every subsequent task runs inside `.worktrees/discipline-pages`. When all tasks are green, raise a PR from `phase3/discipline-pages` back to `main`.

---

## Task 1: Synthetic LibraryCatalogue fixtures for unit tests

**Files:**
- Create: `tests/discipline/fixtures/catalogue.ts`
- Create: `tests/discipline/fixtures/catalogue.test.ts`

These fixtures are the foundation every later unit test imports. `makeCatalogueEntry()` returns a schema-valid entry with overridable fields; `FIXTURE_CATALOGUE` is a varied hand-rolled catalogue covering built+proposed, three disciplines, two categories per discipline.

- [ ] **Step 1: Write the failing test**

```ts
// tests/discipline/fixtures/catalogue.test.ts
// ABOUTME: Sanity test for the synthetic LibraryCatalogue fixture helpers.
// ABOUTME: Guards fixture shape so downstream tests can rely on it.
import { describe, it, expect } from 'vitest';
import { makeCatalogueEntry, makeCatalogue, FIXTURE_CATALOGUE } from './catalogue';
import { LibraryCatalogueSchema, LibraryCatalogueEntrySchema } from '@/lib/aec-bench/library-catalogue';

describe('fixture catalogue', () => {
  it('makeCatalogueEntry produces a schema-valid entry with overridable fields', () => {
    const e = makeCatalogueEntry({ task_name: 'Override Test', discipline: 'electrical' });
    const parsed = LibraryCatalogueEntrySchema.parse(e);
    expect(parsed.task_name).toBe('Override Test');
    expect(parsed.discipline).toBe('electrical');
  });

  it('makeCatalogue wraps entries into a schema-valid catalogue', () => {
    const cat = makeCatalogue({ templates: [makeCatalogueEntry({ status: 'built' })] });
    expect(() => LibraryCatalogueSchema.parse(cat)).not.toThrow();
  });

  it('FIXTURE_CATALOGUE is schema-valid, has both built and proposed entries, and spans ≥3 disciplines', () => {
    expect(() => LibraryCatalogueSchema.parse(FIXTURE_CATALOGUE)).not.toThrow();
    expect(FIXTURE_CATALOGUE.templates.length).toBeGreaterThan(0);
    expect(FIXTURE_CATALOGUE.seeds.length).toBeGreaterThan(0);
    const disciplines = new Set([
      ...FIXTURE_CATALOGUE.templates.map((t) => t.discipline),
      ...FIXTURE_CATALOGUE.seeds.map((s) => s.discipline),
    ]);
    expect(disciplines.size).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test tests/discipline/fixtures/catalogue.test.ts
```

Expected: FAIL with module-not-found for `./catalogue` and `@/lib/aec-bench/library-catalogue`.

- [ ] **Step 3: Create the fixture module**

```ts
// tests/discipline/fixtures/catalogue.ts
// ABOUTME: Synthetic LibraryCatalogue fixtures for unit tests.
// ABOUTME: Use makeCatalogueEntry({...overrides}) + makeCatalogue({...overrides}); FIXTURE_CATALOGUE is a varied default.
import type {
  LibraryCatalogue,
  LibraryCatalogueEntry,
} from '@/lib/aec-bench/library-catalogue';

const BASE_ENTRY: LibraryCatalogueEntry = {
  task_id: 'voltage-drop',
  discipline: 'electrical',
  category: 'cable-sizing',
  category_label: 'Cable Sizing',
  task_name: 'Voltage Drop Calculation',
  description: 'Cable voltage drop calculation per AS/NZS 3008.1.1.',
  long_description: 'Calculates voltage drop along a cable run using tabulated mV/A/m values.',
  standards: ['AS/NZS 3008.1.1', 'AS/NZS 3000:2018', 'IEC 60364-5-52'],
  tags: ['electrical', 'cable-sizing', 'voltage-drop'],
  inputs: [
    { name: 'cable_size_mm2', description: 'Cable size', unit: 'mm²', type: 'enum' },
    { name: 'length_m', description: 'Route length', unit: 'm', type: 'float' },
  ],
  outputs: [
    { name: 'voltage_drop_v', description: 'Voltage drop', unit: null, tolerance: 0.03 },
  ],
  status: 'built',
  difficulty_tiers: ['easy', 'medium', 'hard'],
  complexity: null,
  tool_mode: 'with-tool',
  archetype_count: 4,
};

export function makeCatalogueEntry(overrides: Partial<LibraryCatalogueEntry> = {}): LibraryCatalogueEntry {
  return { ...BASE_ENTRY, ...overrides };
}

const BUILT_TEMPLATES: LibraryCatalogueEntry[] = [
  makeCatalogueEntry({ task_id: 'voltage-drop', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', task_name: 'Voltage Drop Calculation', status: 'built' }),
  makeCatalogueEntry({ task_id: 'cable-ampacity', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', task_name: 'Cable Ampacity', status: 'built', difficulty_tiers: ['easy', 'medium'] }),
  makeCatalogueEntry({ task_id: 'hudson-armor-sizing', discipline: 'civil', category: 'armor-stability', category_label: 'Armor Stability', task_name: 'Hudson Armor Sizing', status: 'built', archetype_count: 5 }),
  makeCatalogueEntry({ task_id: 'bearing-capacity', discipline: 'ground', category: 'foundations', category_label: 'Foundations', task_name: 'Bearing Capacity', status: 'built', difficulty_tiers: ['medium'] }),
];

const PROPOSED_SEEDS: LibraryCatalogueEntry[] = [
  makeCatalogueEntry({
    task_id: 'gravel-road-thickness',
    discipline: 'civil',
    category: 'access-roads',
    category_label: 'Access Road Design',
    task_name: 'Gravel Road Pavement Thickness',
    description: 'Calculate required pavement thickness for light-duty gravel access road.',
    long_description: undefined,
    tags: undefined,
    inputs: [{ name: 'Subgrade CBR (%)', description: null, unit: null, type: null }],
    outputs: [{ name: 'Thickness (mm)', description: null, unit: null, tolerance: null }],
    status: 'proposed',
    difficulty_tiers: null,
    complexity: 'low',
    tool_mode: null,
    archetype_count: null,
  }),
  makeCatalogueEntry({
    task_id: 'hvac-load',
    discipline: 'mechanical',
    category: 'hvac',
    category_label: 'HVAC',
    task_name: 'HVAC Heating Load',
    description: 'Heating load calculation for a residential zone.',
    long_description: undefined,
    tags: undefined,
    inputs: [{ name: 'Zone volume (m³)', description: null, unit: null, type: null }],
    outputs: [{ name: 'Heating demand (kW)', description: null, unit: null, tolerance: null }],
    status: 'proposed',
    difficulty_tiers: null,
    complexity: 'medium',
    tool_mode: null,
    archetype_count: null,
  }),
  makeCatalogueEntry({
    task_id: 'steel-beam',
    discipline: 'structural',
    category: 'member-design',
    category_label: 'Member Design',
    task_name: 'Steel Beam Sizing',
    description: 'Select a UB section for a simply supported span.',
    long_description: undefined,
    tags: undefined,
    inputs: [{ name: 'Span (m)', description: null, unit: null, type: null }],
    outputs: [{ name: 'Section designation', description: null, unit: null, tolerance: null }],
    status: 'proposed',
    difficulty_tiers: null,
    complexity: 'high',
    tool_mode: null,
    archetype_count: null,
  }),
];

export function makeCatalogue(overrides: Partial<LibraryCatalogue> = {}): LibraryCatalogue {
  const templates = overrides.templates ?? BUILT_TEMPLATES;
  const seeds = overrides.seeds ?? PROPOSED_SEEDS;
  const by_discipline: LibraryCatalogue['counts']['by_discipline'] = {} as LibraryCatalogue['counts']['by_discipline'];
  for (const d of ['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const) {
    by_discipline[d] = {
      templates: templates.filter((t) => t.discipline === d).length,
      seeds: seeds.filter((s) => s.discipline === d).length,
    };
  }
  return {
    schema_version: 1,
    generated_at: '2026-04-19T09:00:00Z',
    library_version: '0.1.0',
    library_commit: '1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    counts: {
      total_templates: templates.length,
      total_seeds: seeds.length,
      by_discipline,
    },
    templates,
    seeds,
    ...overrides,
  };
}

export const FIXTURE_CATALOGUE: LibraryCatalogue = makeCatalogue();
```

- [ ] **Step 4: Run the test to verify it still fails differently**

```bash
pnpm test tests/discipline/fixtures/catalogue.test.ts
```

Expected: FAIL with module-not-found for `@/lib/aec-bench/library-catalogue` (we'll create it in Task 3). That's fine — the fixture compiles against its types once they exist.

- [ ] **Step 5: Commit**

```bash
git add tests/discipline/fixtures/catalogue.ts tests/discipline/fixtures/catalogue.test.ts
git commit -m "test(discipline): synthetic LibraryCatalogue fixtures"
```

---

## Task 2: `lib/disciplines.ts` — metadata module

**Files:**
- Create: `lib/disciplines.ts`
- Create: `tests/discipline/disciplines.test.ts`

Single source of truth for each discipline's `{code, name, description}` plus a `neighbours()` helper for prev/next chip nav.

- [ ] **Step 1: Write the failing test**

```ts
// tests/discipline/disciplines.test.ts
// ABOUTME: Tests for the discipline metadata registry + neighbours helper.
// ABOUTME: Asserts the 5-slug order and wraparound behaviour used by /leaderboard/[discipline].
import { describe, it, expect } from 'vitest';
import { DISCIPLINE_META, DISCIPLINE_ORDER, neighbours } from '@/lib/disciplines';

describe('DISCIPLINE_ORDER', () => {
  it('contains exactly the five slugs in fixed order', () => {
    expect(DISCIPLINE_ORDER).toEqual([
      'civil', 'electrical', 'ground', 'mechanical', 'structural',
    ]);
  });
});

describe('DISCIPLINE_META', () => {
  it.each([
    ['civil',      'CIV·01', 'Civil'],
    ['electrical', 'ELE·02', 'Electrical'],
    ['ground',     'GND·03', 'Ground'],
    ['mechanical', 'MEC·04', 'Mechanical'],
    ['structural', 'STR·05', 'Structural'],
  ] as const)('%s has expected code and name', (slug, code, name) => {
    expect(DISCIPLINE_META[slug].code).toBe(code);
    expect(DISCIPLINE_META[slug].name).toBe(name);
    expect(DISCIPLINE_META[slug].description.length).toBeGreaterThan(10);
  });
});

describe('neighbours', () => {
  it('returns neighbours for middle slug', () => {
    expect(neighbours('ground')).toEqual({ prev: 'electrical', next: 'mechanical' });
  });

  it('wraps at the first slug', () => {
    expect(neighbours('civil')).toEqual({ prev: 'structural', next: 'electrical' });
  });

  it('wraps at the last slug', () => {
    expect(neighbours('structural')).toEqual({ prev: 'mechanical', next: 'civil' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/disciplines.test.ts
```

Expected: FAIL — module `@/lib/disciplines` not found.

- [ ] **Step 3: Create the module**

```ts
// lib/disciplines.ts
// ABOUTME: Single source of truth for per-discipline metadata (code, name, description).
// ABOUTME: Consumed by the landing Disciplines component and /leaderboard/[discipline] routes.
import type { Domain } from '@/lib/aec-bench/contracts';

export interface DisciplineMeta {
  code: string;
  name: string;
  description: string;
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

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/disciplines.test.ts
```

Expected: PASS (all three `describe` blocks green).

- [ ] **Step 5: Commit**

```bash
git add lib/disciplines.ts tests/discipline/disciplines.test.ts
git commit -m "feat(discipline): DISCIPLINE_META registry + neighbours helper"
```

---

## Task 3: Library-catalogue zod contract

**Files:**
- Create: `lib/aec-bench/library-catalogue.ts`
- Create: `tests/discipline/library-catalogue-contract.test.ts`

The zod schema that mirrors the library's v1 export shape. Read helpers come in Task 4 — keep this file focused on types + validation first.

- [ ] **Step 1: Write the failing test**

```ts
// tests/discipline/library-catalogue-contract.test.ts
// ABOUTME: Tests the zod contract for the library catalogue (v1 schema).
// ABOUTME: Round-trips the fixture, exercises schema_version gate, checks required fields.
import { describe, it, expect } from 'vitest';
import {
  LibraryCatalogueSchema,
  LibraryCatalogueEntrySchema,
} from '@/lib/aec-bench/library-catalogue';
import { FIXTURE_CATALOGUE, makeCatalogueEntry, makeCatalogue } from './fixtures/catalogue';

describe('LibraryCatalogueSchema', () => {
  it('accepts the fixture catalogue (v1 round-trip)', () => {
    const parsed = LibraryCatalogueSchema.parse(FIXTURE_CATALOGUE);
    expect(parsed.schema_version).toBe(1);
    expect(parsed.counts.total_templates).toBe(FIXTURE_CATALOGUE.templates.length);
  });

  it('rejects schema_version 2 (v2 not supported)', () => {
    const v2 = { ...FIXTURE_CATALOGUE, schema_version: 2 };
    expect(() => LibraryCatalogueSchema.parse(v2)).toThrow();
  });

  it('requires counts.by_discipline for every domain', () => {
    const missing = makeCatalogue();
    // @ts-expect-error — deliberately malformed for test
    delete missing.counts.by_discipline.structural;
    expect(() => LibraryCatalogueSchema.parse(missing)).toThrow();
  });
});

describe('LibraryCatalogueEntrySchema', () => {
  it('accepts a template entry with difficulty_tiers array', () => {
    const e = makeCatalogueEntry({ status: 'built', difficulty_tiers: ['easy', 'medium', 'hard'], complexity: null });
    expect(() => LibraryCatalogueEntrySchema.parse(e)).not.toThrow();
  });

  it('accepts a seed entry with null tiers and a complexity value', () => {
    const e = makeCatalogueEntry({ status: 'proposed', difficulty_tiers: null, complexity: 'low', tool_mode: null, archetype_count: null });
    expect(() => LibraryCatalogueEntrySchema.parse(e)).not.toThrow();
  });

  it('rejects an entry with an unknown discipline', () => {
    // @ts-expect-error — deliberately invalid discipline
    const e = makeCatalogueEntry({ discipline: 'quantum' });
    expect(() => LibraryCatalogueEntrySchema.parse(e)).toThrow();
  });

  it('rejects an entry with an unknown status', () => {
    // @ts-expect-error — deliberately invalid status
    const e = makeCatalogueEntry({ status: 'drafted' });
    expect(() => LibraryCatalogueEntrySchema.parse(e)).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/library-catalogue-contract.test.ts
```

Expected: FAIL — `@/lib/aec-bench/library-catalogue` not found.

- [ ] **Step 3: Create the contract**

```ts
// lib/aec-bench/library-catalogue.ts
// ABOUTME: Zod contract mirroring the aec-bench library-catalogue v1 export shape.
// ABOUTME: Read helpers (getCatalogue, getCatalogueForDiscipline) live alongside in Task 4.
import { z } from 'zod';
import { DOMAINS } from '@/lib/aec-bench/contracts';

export const CatalogueIOSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  type: z.string().nullable().optional(),
  tolerance: z.number().nullable().optional(),
});
export type CatalogueIO = z.infer<typeof CatalogueIOSchema>;

export const LibraryCatalogueEntrySchema = z.object({
  task_id: z.string().min(1),
  discipline: z.enum(DOMAINS),
  category: z.string().min(1),
  category_label: z.string().nullable(),
  task_name: z.string().min(1),
  description: z.string(),
  long_description: z.string().optional(),
  standards: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  inputs: z.array(CatalogueIOSchema),
  outputs: z.array(CatalogueIOSchema),
  status: z.enum(['built', 'proposed']),
  difficulty_tiers: z.array(z.enum(['easy', 'medium', 'hard'])).nullable(),
  complexity: z.enum(['low', 'medium', 'high']).nullable().optional(),
  tool_mode: z.string().nullable().optional(),
  archetype_count: z.number().int().nullable().optional(),
});
export type LibraryCatalogueEntry = z.infer<typeof LibraryCatalogueEntrySchema>;

const ByDisciplineSchema = z.object(
  Object.fromEntries(
    DOMAINS.map((d) => [d, z.object({ templates: z.number().int().nonnegative(), seeds: z.number().int().nonnegative() })]),
  ) as Record<(typeof DOMAINS)[number], z.ZodTypeAny>,
);

export const LibraryCatalogueSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string().min(1),
  library_version: z.string().min(1),
  library_commit: z.string().min(1),
  counts: z.object({
    total_templates: z.number().int().nonnegative(),
    total_seeds: z.number().int().nonnegative(),
    by_discipline: ByDisciplineSchema,
  }),
  templates: z.array(LibraryCatalogueEntrySchema),
  seeds: z.array(LibraryCatalogueEntrySchema),
});
export type LibraryCatalogue = z.infer<typeof LibraryCatalogueSchema>;
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/library-catalogue-contract.test.ts tests/discipline/fixtures/catalogue.test.ts
```

Expected: PASS both files. (The fixture's own tests finally compile against the real contract.)

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/library-catalogue.ts tests/discipline/library-catalogue-contract.test.ts
git commit -m "feat(catalogue): zod contract for library catalogue v1"
```

---

## Task 4: Library-catalogue read helpers

**Files:**
- Modify: `lib/aec-bench/library-catalogue.ts` (append functions; do not change schemas)
- Create: `tests/discipline/library-catalogue-read.test.ts`

Add `getCatalogue()` (cached file read + validate), and `getCatalogueForDiscipline()` (groups by category, computes totals).

- [ ] **Step 1: Write the failing test**

```ts
// tests/discipline/library-catalogue-read.test.ts
// ABOUTME: Tests the getCatalogueForDiscipline grouping + totals arithmetic.
// ABOUTME: Uses the fixture builder so assertions are independent of real data.
import { describe, it, expect } from 'vitest';
import { getCatalogueForDiscipline } from '@/lib/aec-bench/library-catalogue';
import { makeCatalogue, makeCatalogueEntry } from './fixtures/catalogue';

describe('getCatalogueForDiscipline', () => {
  const catalogue = makeCatalogue({
    templates: [
      makeCatalogueEntry({ task_id: 't1', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'built' }),
      makeCatalogueEntry({ task_id: 't2', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'built' }),
      makeCatalogueEntry({ task_id: 't3', discipline: 'electrical', category: 'fault-current', category_label: 'Fault Current', status: 'built' }),
      makeCatalogueEntry({ task_id: 't4', discipline: 'civil', category: 'armor-stability', category_label: 'Armor Stability', status: 'built' }),
    ],
    seeds: [
      makeCatalogueEntry({ task_id: 's1', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'proposed', difficulty_tiers: null, complexity: 'low' }),
      makeCatalogueEntry({ task_id: 's2', discipline: 'electrical', category: 'lighting', category_label: null, status: 'proposed', difficulty_tiers: null, complexity: 'medium' }),
    ],
  });

  it('filters templates and seeds to the given discipline', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    expect(slice.templates.map((t) => t.task_id).sort()).toEqual(['t1', 't2', 't3']);
    expect(slice.seeds.map((s) => s.task_id).sort()).toEqual(['s1', 's2']);
  });

  it('groups by category with counts and status split', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    const cableSizing = slice.categories.find((c) => c.key === 'cable-sizing');
    expect(cableSizing?.label).toBe('Cable Sizing');
    expect(cableSizing?.built.map((e) => e.task_id).sort()).toEqual(['t1', 't2']);
    expect(cableSizing?.proposed.map((e) => e.task_id)).toEqual(['s1']);
  });

  it('uses category slug (prettified) when category_label is null', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    const lighting = slice.categories.find((c) => c.key === 'lighting');
    expect(lighting?.label).toBe('Lighting'); // prettified from 'lighting'
  });

  it('orders categories alphabetically by label', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    const labels = slice.categories.map((c) => c.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it('computes totals consistent with per-entry counts', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    expect(slice.totals.tasks).toBe(5);
    expect(slice.totals.built).toBe(3);
    expect(slice.totals.proposed).toBe(2);
    expect(slice.totals.categories).toBe(3); // cable-sizing, fault-current, lighting
    expect(slice.totals.standards).toBeGreaterThan(0);
  });

  it('returns empty categories array for a discipline with no entries', () => {
    const slice = getCatalogueForDiscipline('structural', catalogue);
    expect(slice.templates).toEqual([]);
    expect(slice.seeds).toEqual([]);
    expect(slice.categories).toEqual([]);
    expect(slice.totals).toEqual({ tasks: 0, built: 0, proposed: 0, categories: 0, standards: 0 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/library-catalogue-read.test.ts
```

Expected: FAIL — `getCatalogueForDiscipline` is not an export.

- [ ] **Step 3: Implement helpers**

Append to `lib/aec-bench/library-catalogue.ts` (keep existing schema code above, add below the type exports):

```ts
import artefact from '@/public/data/library-catalogue.json' assert { type: 'json' };
import type { Domain } from '@/lib/aec-bench/contracts';

let cached: LibraryCatalogue | null = null;

function prettifyCategory(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getCatalogue(): LibraryCatalogue {
  if (cached) return cached;
  const parsed = LibraryCatalogueSchema.safeParse(artefact);
  if (!parsed.success) {
    const msg =
      typeof (artefact as { schema_version?: unknown }).schema_version === 'number' &&
      (artefact as { schema_version: number }).schema_version !== 1
        ? `Library catalogue schema_version ${(artefact as { schema_version: number }).schema_version} unsupported (site supports v1). Re-run 'pnpm sync:catalogue' or upgrade the site.`
        : `Library catalogue failed validation: ${parsed.error.message}`;
    throw new Error(msg);
  }
  cached = parsed.data;
  return cached;
}

export interface DisciplineCatalogueSlice {
  templates: LibraryCatalogueEntry[];
  seeds: LibraryCatalogueEntry[];
  categories: Array<{
    key: string;
    label: string;
    built: LibraryCatalogueEntry[];
    proposed: LibraryCatalogueEntry[];
  }>;
  totals: {
    tasks: number;
    built: number;
    proposed: number;
    categories: number;
    standards: number;
  };
}

export function getCatalogueForDiscipline(
  domain: Domain,
  catalogue: LibraryCatalogue = getCatalogue(),
): DisciplineCatalogueSlice {
  const templates = catalogue.templates.filter((t) => t.discipline === domain);
  const seeds = catalogue.seeds.filter((s) => s.discipline === domain);

  const byCategory = new Map<string, { label: string; built: LibraryCatalogueEntry[]; proposed: LibraryCatalogueEntry[] }>();
  for (const entry of [...templates, ...seeds]) {
    const key = entry.category;
    if (!byCategory.has(key)) {
      byCategory.set(key, {
        label: entry.category_label ?? prettifyCategory(key),
        built: [],
        proposed: [],
      });
    }
    const bucket = byCategory.get(key)!;
    if (entry.status === 'built') bucket.built.push(entry);
    else bucket.proposed.push(entry);
  }

  const categories = Array.from(byCategory.entries())
    .map(([key, v]) => ({ key, label: v.label, built: v.built, proposed: v.proposed }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const standards = new Set<string>();
  for (const e of [...templates, ...seeds]) for (const s of e.standards) standards.add(s);

  return {
    templates,
    seeds,
    categories,
    totals: {
      tasks: templates.length + seeds.length,
      built: templates.length,
      proposed: seeds.length,
      categories: categories.length,
      standards: standards.size,
    },
  };
}
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/library-catalogue-read.test.ts
```

Expected: PASS.

- [ ] **Step 5: Sanity-check the cached helper reads the real artefact**

```bash
pnpm test tests/discipline/library-catalogue-contract.test.ts tests/discipline/library-catalogue-read.test.ts
```

Expected: both files green.

- [ ] **Step 6: Commit**

```bash
git add lib/aec-bench/library-catalogue.ts tests/discipline/library-catalogue-read.test.ts
git commit -m "feat(catalogue): getCatalogue + per-discipline grouping helper"
```

---

## Task 5: Sync script `scripts/sync/library-catalogue.ts`

**Files:**
- Create: `scripts/sync/library-catalogue.ts`
- Create: `tests/sync/library-catalogue.test.ts`

Copy the sibling `aec-bench/artefacts/library-catalogue.json` into the site's `public/data/library-catalogue.json`. Honours `AEC_BENCH_ROOT` env var (default `../aec-bench` relative to site repo root). Validates with zod before writing.

- [ ] **Step 1: Write the failing test**

```ts
// tests/sync/library-catalogue.test.ts
// ABOUTME: Tests for the catalogue sync script — path resolution, schema validation, error messages.
// ABOUTME: Uses a temp directory so the real public/data file is never touched by tests.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncCatalogue } from '@/scripts/sync/library-catalogue';
import { makeCatalogue } from '../discipline/fixtures/catalogue';

describe('syncCatalogue', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'sync-catalogue-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('copies a valid catalogue from AEC_BENCH_ROOT to the target', () => {
    const source = join(tmp, 'aec-bench', 'artefacts', 'library-catalogue.json');
    const target = join(tmp, 'site', 'public', 'data', 'library-catalogue.json');
    mkdirSync(join(tmp, 'aec-bench', 'artefacts'), { recursive: true });
    writeFileSync(source, JSON.stringify(makeCatalogue(), null, 2));

    syncCatalogue({ aecBenchRoot: join(tmp, 'aec-bench'), target });

    expect(existsSync(target)).toBe(true);
    const written = JSON.parse(readFileSync(target, 'utf-8'));
    expect(written.schema_version).toBe(1);
  });

  it('throws an actionable error when source is missing', () => {
    const missing = join(tmp, 'nonexistent');
    const target = join(tmp, 'public', 'data', 'library-catalogue.json');
    expect(() => syncCatalogue({ aecBenchRoot: missing, target })).toThrow(
      /Library catalogue not found/,
    );
  });

  it('throws when source exists but fails schema validation', () => {
    const source = join(tmp, 'aec-bench', 'artefacts', 'library-catalogue.json');
    const target = join(tmp, 'site', 'public', 'data', 'library-catalogue.json');
    mkdirSync(join(tmp, 'aec-bench', 'artefacts'), { recursive: true });
    writeFileSync(source, JSON.stringify({ schema_version: 99 }));

    expect(() => syncCatalogue({ aecBenchRoot: join(tmp, 'aec-bench'), target })).toThrow(
      /validation|schema_version/i,
    );
  });

  it('creates the target directory if missing', () => {
    const source = join(tmp, 'aec-bench', 'artefacts', 'library-catalogue.json');
    const target = join(tmp, 'site', 'public', 'data', 'library-catalogue.json');
    mkdirSync(join(tmp, 'aec-bench', 'artefacts'), { recursive: true });
    writeFileSync(source, JSON.stringify(makeCatalogue(), null, 2));

    syncCatalogue({ aecBenchRoot: join(tmp, 'aec-bench'), target });

    expect(existsSync(target)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/sync/library-catalogue.test.ts
```

Expected: FAIL — `@/scripts/sync/library-catalogue` module missing.

- [ ] **Step 3: Create the sync script**

```ts
// scripts/sync/library-catalogue.ts
// ABOUTME: Dev sync — copies sibling aec-bench/artefacts/library-catalogue.json into public/data.
// ABOUTME: Validates against the v1 schema before writing; invoked via `pnpm sync:catalogue`.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { LibraryCatalogueSchema } from '@/lib/aec-bench/library-catalogue';

export interface SyncCatalogueOptions {
  aecBenchRoot: string;
  target: string;
}

export function syncCatalogue(opts: SyncCatalogueOptions): void {
  const source = resolve(opts.aecBenchRoot, 'artefacts', 'library-catalogue.json');

  if (!existsSync(source)) {
    throw new Error(
      `Library catalogue not found at: ${source}\n\n` +
        `Resolve by either:\n` +
        `  1. Running 'aec-bench library export' in the sibling repo, OR\n` +
        `  2. Setting AEC_BENCH_ROOT to the library checkout path`,
    );
  }

  const raw = readFileSync(source, 'utf-8');
  const data = JSON.parse(raw);
  const parsed = LibraryCatalogueSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Library catalogue at ${source} failed v1 schema validation:\n${parsed.error.message}`,
    );
  }

  const target = resolve(opts.target);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(parsed.data, null, 2) + '\n');

  const shortCommit = parsed.data.library_commit.slice(0, 7);
  // eslint-disable-next-line no-console
  console.log(
    `[sync:catalogue] ${source} → ${target}\n` +
      `              library v${parsed.data.library_version} @ ${shortCommit} · generated ${parsed.data.generated_at}`,
  );
}

// CLI entry — only runs when invoked directly via tsx.
const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('library-catalogue.ts');
if (isMain) {
  const aecBenchRoot = process.env.AEC_BENCH_ROOT ?? join(process.cwd(), '..', 'aec-bench');
  const target = join(process.cwd(), 'public', 'data', 'library-catalogue.json');
  try {
    syncCatalogue({ aecBenchRoot, target });
  } catch (e) {
    console.error(`\n${(e as Error).message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/sync/library-catalogue.test.ts
```

Expected: PASS on all four cases.

- [ ] **Step 5: Commit**

```bash
git add scripts/sync/library-catalogue.ts tests/sync/library-catalogue.test.ts
git commit -m "feat(sync): library-catalogue sync script with schema validation"
```

---

## Task 6: Wire sync into pnpm + carve gitignore exception + commit catalogue

**Files:**
- Modify: `package.json` (add `sync:catalogue` script; prepend to `ingest`)
- Modify: `.gitignore` (exception for `public/data/library-catalogue.json`)
- Add: `public/data/library-catalogue.json` (committed artefact — first version)

This is the production delivery path (option C). After this task, Vercel can build without a sibling checkout.

- [ ] **Step 1: Add the script to package.json**

Modify the `scripts` block in `package.json`:

```json
{
  "scripts": {
    "dev": "pnpm ingest && next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "prebuild": "pnpm ingest",
    "ingest": "pnpm sync:catalogue && tsx scripts/ingest/cli.ts",
    "sync:catalogue": "tsx scripts/sync/library-catalogue.ts",
    "ingest:snapshot": "tsx scripts/ingest/promote-snapshot.ts",
    "mock:generate": "tsx scripts/mock/cli.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:registry": "tsx -e \"import('./scripts/ingest/pricing-parity.ts').then(async (m) => { import('./scripts/ingest/registry.ts').then(async (r) => { m.checkParity(await m.loadSnapshot(), await r.loadRegistry()); }); });\"",
    "test:bundle": "tsx scripts/check-bundle-size.ts"
  }
}
```

Note: `ingest` now runs `sync:catalogue` first, so `pnpm dev`, `pnpm prebuild`, and direct `pnpm ingest` all refresh the catalogue.

- [ ] **Step 2: Verify sync runs cleanly against the sibling**

```bash
pnpm sync:catalogue
```

Expected output:
```
[sync:catalogue] /…/aec-bench/artefacts/library-catalogue.json → /…/aecbench-site/public/data/library-catalogue.json
              library v0.1.0 @ 1a2b3c4 · generated 2026-04-19T…
```

If this fails, stop and fix the source (the sibling's catalogue must exist first).

- [ ] **Step 3: Carve gitignore exception**

Modify `.gitignore`. Find the line:

```
/public/data/
```

Replace with:

```
/public/data/
!/public/data/library-catalogue.json
```

- [ ] **Step 4: Verify git now sees the catalogue**

```bash
git status public/data/
```

Expected: shows `public/data/library-catalogue.json` as an untracked file (or modified, if a previous hand-copy is tracked).

- [ ] **Step 5: Run full test suite to make sure the committed catalogue parses via `getCatalogue()`**

```bash
pnpm test tests/discipline/
```

Expected: PASS. (The contract test never reads the real file, but `getCatalogue` is invoked indirectly when the read test runs — the cache is cleared per-file by Vitest's module isolation.)

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore public/data/library-catalogue.json
git commit -m "chore(catalogue): commit library-catalogue + wire pnpm sync:catalogue"
```

---

## Task 7: `CatalogueSummary` component

**Files:**
- Create: `components/discipline/catalogue-summary.tsx`
- Create: `tests/discipline/catalogue-summary.test.tsx`

Server component. Two mono lines: totals + provenance with truncated commit.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/discipline/catalogue-summary.test.tsx
// ABOUTME: Tests CatalogueSummary — totals + provenance line render.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogueSummary } from '@/components/discipline/catalogue-summary';

describe('CatalogueSummary', () => {
  const baseProps = {
    totals: { tasks: 87, built: 56, proposed: 31, categories: 12, standards: 42 },
    libraryVersion: '0.1.0',
    libraryCommit: '1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    generatedAt: '2026-04-19T09:00:00Z',
  };

  it('renders the totals line', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.getByText(/87 tasks/)).toBeInTheDocument();
    expect(screen.getByText(/56 built/)).toBeInTheDocument();
    expect(screen.getByText(/31 proposed/)).toBeInTheDocument();
    expect(screen.getByText(/12 categories/)).toBeInTheDocument();
    expect(screen.getByText(/42 standards/)).toBeInTheDocument();
  });

  it('renders the provenance line with truncated commit', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.getByText(/library v0\.1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/1a2b3c4/)).toBeInTheDocument();
    expect(screen.queryByText(/5e6f7890/)).not.toBeInTheDocument();
  });

  it('renders the generated date (date portion only)', () => {
    render(<CatalogueSummary {...baseProps} />);
    expect(screen.getByText(/2026-04-19/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/catalogue-summary.test.tsx
```

Expected: FAIL — component missing.

- [ ] **Step 3: Create the component**

```tsx
// components/discipline/catalogue-summary.tsx
// ABOUTME: Two-line summary header: totals + provenance for the discipline catalogue.
// ABOUTME: Server component; pure presentation, props-driven.
export interface CatalogueSummaryProps {
  totals: {
    tasks: number;
    built: number;
    proposed: number;
    categories: number;
    standards: number;
  };
  libraryVersion: string;
  libraryCommit: string;
  generatedAt: string;
}

export function CatalogueSummary({
  totals,
  libraryVersion,
  libraryCommit,
  generatedAt,
}: CatalogueSummaryProps) {
  const date = generatedAt.slice(0, 10);
  const commit = libraryCommit.slice(0, 7);

  return (
    <header className="mb-4">
      <p className="font-mono text-xs text-landing-text">
        <span className="text-accent-amber">{totals.tasks}</span> tasks ·{' '}
        {totals.built} built · {totals.proposed} proposed ·{' '}
        {totals.categories} categories · {totals.standards} standards
      </p>
      <p className="mt-1 font-mono text-[0.65rem] text-landing-muted">
        catalogue library v{libraryVersion} · @ {commit} · generated {date}
      </p>
    </header>
  );
}
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/catalogue-summary.test.tsx
```

Expected: PASS all three tests.

- [ ] **Step 5: Commit**

```bash
git add components/discipline/catalogue-summary.tsx tests/discipline/catalogue-summary.test.tsx
git commit -m "feat(discipline): CatalogueSummary totals + provenance header"
```

---

## Task 8: `TaskCard` component

**Files:**
- Create: `components/discipline/task-card.tsx`
- Create: `tests/discipline/task-card.test.tsx`

Single-component renderer for both templates (built) and seeds (proposed).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/discipline/task-card.test.tsx
// ABOUTME: Tests TaskCard — built/proposed variants, difficulty rendering, standards overflow, IO footer.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/discipline/task-card';
import { makeCatalogueEntry } from './fixtures/catalogue';

describe('TaskCard — built template', () => {
  const builtAllTiers = makeCatalogueEntry({
    status: 'built',
    task_name: 'Voltage Drop',
    description: 'Cable voltage drop calculation.',
    standards: ['AS/NZS 3008.1.1', 'AS/NZS 3000:2018', 'IEC 60364-5-52', 'IEEE 141'],
    difficulty_tiers: ['easy', 'medium', 'hard'],
    complexity: null,
    archetype_count: 4,
    inputs: [
      { name: 'a', description: null, unit: null, type: null },
      { name: 'b', description: null, unit: null, type: null },
    ],
    outputs: [{ name: 'c', description: null, unit: null, tolerance: null }],
  });

  it('renders the BUILT pill', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText('BUILT')).toBeInTheDocument();
  });

  it('renders task_name as title', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText('Voltage Drop')).toBeInTheDocument();
  });

  it('renders difficulty_tiers as min–max range when length > 1', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText(/easy–hard/)).toBeInTheDocument();
  });

  it('renders difficulty_tiers single value when length === 1', () => {
    const single = { ...builtAllTiers, difficulty_tiers: ['medium'] as const };
    render(<TaskCard entry={single} />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders up to 3 standards chips and a +N overflow count', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText('AS/NZS 3008.1.1')).toBeInTheDocument();
    expect(screen.getByText('AS/NZS 3000:2018')).toBeInTheDocument();
    expect(screen.getByText('IEC 60364-5-52')).toBeInTheDocument();
    expect(screen.queryByText('IEEE 141')).not.toBeInTheDocument();
    expect(screen.getByText(/\+1 more/)).toBeInTheDocument();
  });

  it('renders the IO footer with archetype count when present', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText(/2 inputs → 1 outputs/)).toBeInTheDocument();
    expect(screen.getByText(/4 archetypes/)).toBeInTheDocument();
  });
});

describe('TaskCard — proposed seed', () => {
  const seed = makeCatalogueEntry({
    status: 'proposed',
    task_name: 'Gravel Road Thickness',
    description: 'Thickness calculation.',
    standards: ['Austroads Guides'],
    difficulty_tiers: null,
    complexity: 'low',
    archetype_count: null,
    tool_mode: null,
    inputs: [{ name: 'a', description: null, unit: null, type: null }],
    outputs: [{ name: 'b', description: null, unit: null, tolerance: null }],
  });

  it('renders the PROPOSED pill', () => {
    render(<TaskCard entry={seed} />);
    expect(screen.getByText('PROPOSED')).toBeInTheDocument();
  });

  it('renders complexity as the chip (not a range)', () => {
    render(<TaskCard entry={seed} />);
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });

  it('omits archetype count when null', () => {
    render(<TaskCard entry={seed} />);
    expect(screen.queryByText(/archetypes/)).not.toBeInTheDocument();
  });
});

describe('TaskCard — no difficulty', () => {
  it('omits the difficulty chip when both tiers and complexity are null', () => {
    const entry = makeCatalogueEntry({
      status: 'proposed',
      difficulty_tiers: null,
      complexity: null,
    });
    render(<TaskCard entry={entry} />);
    for (const s of ['easy', 'medium', 'hard', 'low', 'high']) {
      expect(screen.queryByText(s)).not.toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/task-card.test.tsx
```

Expected: FAIL — `TaskCard` missing.

- [ ] **Step 3: Create the component**

```tsx
// components/discipline/task-card.tsx
// ABOUTME: Single card presentation for a library catalogue entry (template or seed).
// ABOUTME: Status pill + title + description + standards chips + IO/archetype footer.
import type { LibraryCatalogueEntry } from '@/lib/aec-bench/library-catalogue';

const TIER_ORDER: Record<'easy' | 'medium' | 'hard', number> = { easy: 0, medium: 1, hard: 2 };

function difficultyChip(entry: LibraryCatalogueEntry): string | null {
  if (entry.difficulty_tiers && entry.difficulty_tiers.length > 0) {
    const sorted = [...entry.difficulty_tiers].sort((a, b) => TIER_ORDER[a] - TIER_ORDER[b]);
    if (sorted.length === 1) return sorted[0];
    return `${sorted[0]}–${sorted[sorted.length - 1]}`;
  }
  if (entry.complexity) return entry.complexity;
  return null;
}

export interface TaskCardProps {
  entry: LibraryCatalogueEntry;
}

export function TaskCard({ entry }: TaskCardProps) {
  const chip = difficultyChip(entry);
  const shownStandards = entry.standards.slice(0, 3);
  const overflow = Math.max(0, entry.standards.length - shownStandards.length);
  const pillClass =
    entry.status === 'built'
      ? 'bg-accent-amber text-[#0a0a0a]'
      : 'bg-accent-teal text-[#0a0a0a]';

  return (
    <article className="flex flex-col gap-2 rounded border border-landing-border bg-[#050505] p-3">
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider ${pillClass}`}
          >
            {entry.status === 'built' ? 'BUILT' : 'PROPOSED'}
          </span>
          <h4 className="truncate text-sm font-semibold text-landing-text">{entry.task_name}</h4>
        </div>
        {chip && (
          <span className="shrink-0 font-mono text-[0.65rem] text-landing-muted">{chip}</span>
        )}
      </header>

      <p className="line-clamp-2 text-xs text-landing-muted">{entry.description}</p>

      {shownStandards.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1">
          {shownStandards.map((s) => (
            <li
              key={s}
              className="rounded border border-landing-border px-1.5 py-0.5 font-mono text-[0.6rem] text-landing-text"
            >
              {s}
            </li>
          ))}
          {overflow > 0 && (
            <li className="font-mono text-[0.6rem] text-landing-muted">+{overflow} more</li>
          )}
        </ul>
      )}

      <footer className="font-mono text-[0.6rem] text-landing-muted">
        {entry.inputs.length} inputs → {entry.outputs.length} outputs
        {entry.archetype_count && entry.archetype_count > 0
          ? ` · ${entry.archetype_count} archetypes`
          : ''}
      </footer>
    </article>
  );
}
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/task-card.test.tsx
```

Expected: PASS all tests.

- [ ] **Step 5: Commit**

```bash
git add components/discipline/task-card.tsx tests/discipline/task-card.test.tsx
git commit -m "feat(discipline): TaskCard renderer for templates + seeds"
```

---

## Task 9: `CategorySection` component

**Files:**
- Create: `components/discipline/category-section.tsx`
- Create: `tests/discipline/category-section.test.tsx`

Collapsible section wrapping built + proposed task cards. Uses native `<details>`/`<summary>` — no JS.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/discipline/category-section.test.tsx
// ABOUTME: Tests CategorySection — collapsed by default, badge arithmetic, card ordering.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategorySection } from '@/components/discipline/category-section';
import { makeCatalogueEntry } from './fixtures/catalogue';

const category = {
  key: 'cable-sizing',
  label: 'Cable Sizing',
  built: [
    makeCatalogueEntry({ task_id: 'b1', task_name: 'Built One', status: 'built' }),
    makeCatalogueEntry({ task_id: 'b2', task_name: 'Built Two', status: 'built' }),
  ],
  proposed: [
    makeCatalogueEntry({
      task_id: 'p1',
      task_name: 'Proposed One',
      status: 'proposed',
      difficulty_tiers: null,
      complexity: 'low',
    }),
  ],
};

describe('CategorySection', () => {
  it('renders the category label and counts', () => {
    render(<CategorySection category={category} />);
    expect(screen.getByText(/Cable Sizing/)).toBeInTheDocument();
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/2 built/)).toBeInTheDocument();
    expect(screen.getByText(/1 proposed/)).toBeInTheDocument();
  });

  it('is collapsed by default (details without open attribute)', () => {
    const { container } = render(<CategorySection category={category} />);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.hasAttribute('open')).toBe(false);
  });

  it('renders all cards inside the details body (present in DOM even when collapsed)', () => {
    render(<CategorySection category={category} />);
    expect(screen.getByText('Built One')).toBeInTheDocument();
    expect(screen.getByText('Built Two')).toBeInTheDocument();
    expect(screen.getByText('Proposed One')).toBeInTheDocument();
  });

  it('renders built cards before proposed cards', () => {
    render(<CategorySection category={category} />);
    const allTitles = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(allTitles.indexOf('Built One')).toBeLessThan(allTitles.indexOf('Proposed One'));
    expect(allTitles.indexOf('Built Two')).toBeLessThan(allTitles.indexOf('Proposed One'));
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/category-section.test.tsx
```

Expected: FAIL — component missing.

- [ ] **Step 3: Create the component**

```tsx
// components/discipline/category-section.tsx
// ABOUTME: Native <details>/<summary> collapsible section for a single category.
// ABOUTME: No JS, no framer-motion — keeps route bundle zero-cost.
import type { DisciplineCatalogueSlice } from '@/lib/aec-bench/library-catalogue';
import { TaskCard } from './task-card';

type Category = DisciplineCatalogueSlice['categories'][number];

export interface CategorySectionProps {
  category: Category;
}

export function CategorySection({ category }: CategorySectionProps) {
  const total = category.built.length + category.proposed.length;

  return (
    <details className="group rounded border border-landing-border bg-[#0a0a0a]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-mono text-sm marker:hidden">
        <span className="font-semibold text-landing-text">{category.label}</span>
        <span className="font-mono text-xs text-landing-muted">
          ({total}) ·{' '}
          <span className="text-accent-amber">● {category.built.length} built</span>{' '}
          · ○ {category.proposed.length} proposed
        </span>
      </summary>
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
        {category.built.map((e) => (
          <TaskCard key={e.task_id} entry={e} />
        ))}
        {category.proposed.map((e) => (
          <TaskCard key={e.task_id} entry={e} />
        ))}
      </div>
    </details>
  );
}
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/category-section.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/discipline/category-section.tsx tests/discipline/category-section.test.tsx
git commit -m "feat(discipline): CategorySection collapsible (native details)"
```

---

## Task 10: `DisciplineNav` component

**Files:**
- Create: `components/discipline/discipline-nav.tsx`
- Create: `tests/discipline/discipline-nav.test.tsx`

Bottom-of-page prev/next chip pair using `neighbours()`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/discipline/discipline-nav.test.tsx
// ABOUTME: Tests DisciplineNav — prev/next hrefs, labels, and wraparound for each of the 5 slugs.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisciplineNav } from '@/components/discipline/discipline-nav';
import type { Domain } from '@/lib/aec-bench/contracts';

describe('DisciplineNav', () => {
  const cases: Array<{ slug: Domain; prev: string; next: string }> = [
    { slug: 'civil',      prev: 'structural', next: 'electrical' },
    { slug: 'electrical', prev: 'civil',      next: 'ground' },
    { slug: 'ground',     prev: 'electrical', next: 'mechanical' },
    { slug: 'mechanical', prev: 'ground',     next: 'structural' },
    { slug: 'structural', prev: 'mechanical', next: 'civil' },
  ];

  it.each(cases)('%s → prev: %s, next: %s', ({ slug, prev, next }) => {
    render(<DisciplineNav slug={slug} />);
    const prevLink = screen.getByRole('link', { name: new RegExp(`prev: ${prev}`, 'i') });
    const nextLink = screen.getByRole('link', { name: new RegExp(`next: ${next}`, 'i') });
    expect(prevLink).toHaveAttribute('href', `/leaderboard/${prev}`);
    expect(nextLink).toHaveAttribute('href', `/leaderboard/${next}`);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/discipline-nav.test.tsx
```

Expected: FAIL — component missing.

- [ ] **Step 3: Create the component**

Labels use the raw slug to match the spec's `← prev: electrical · next: ground →` example. A future pass can swap slug→display name if needed.

```tsx
// components/discipline/discipline-nav.tsx
// ABOUTME: Prev/next discipline chips (bottom-of-page nav) using neighbours() wraparound.
// ABOUTME: Server component; pure links.
import Link from 'next/link';
import type { Domain } from '@/lib/aec-bench/contracts';
import { neighbours } from '@/lib/disciplines';

export interface DisciplineNavProps {
  slug: Domain;
}

export function DisciplineNav({ slug }: DisciplineNavProps) {
  const { prev, next } = neighbours(slug);
  return (
    <nav className="mt-8 flex items-center justify-between font-mono text-sm">
      <Link
        href={`/leaderboard/${prev}`}
        className="text-landing-muted transition-colors hover:text-accent-amber"
      >
        ← prev: {prev}
      </Link>
      <span className="text-[#444]">·</span>
      <Link
        href={`/leaderboard/${next}`}
        className="text-landing-muted transition-colors hover:text-accent-amber"
      >
        next: {next} →
      </Link>
    </nav>
  );
}
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/discipline-nav.test.tsx
```

Expected: PASS all 5 parametrised cases.

- [ ] **Step 5: Commit**

```bash
git add components/discipline/discipline-nav.tsx tests/discipline/discipline-nav.test.tsx
git commit -m "feat(discipline): DisciplineNav prev/next wraparound chips"
```

---

## Task 11: `DisciplineTrailingSlot` assembly

**Files:**
- Create: `components/discipline/discipline-trailing-slot.tsx`
- Create: `tests/discipline/discipline-trailing-slot.test.tsx`

Composition: `CatalogueSummary` → `CategorySection[]` → `DisciplineNav`. Renders the empty-state fallback when a discipline has zero entries (future-proofs for a discipline that exists with no seeds or templates).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/discipline/discipline-trailing-slot.test.tsx
// ABOUTME: Tests DisciplineTrailingSlot composition (summary → categories → nav) + empty-state fallback.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisciplineTrailingSlot } from '@/components/discipline/discipline-trailing-slot';
import { getCatalogueForDiscipline } from '@/lib/aec-bench/library-catalogue';
import { makeCatalogue, makeCatalogueEntry } from './fixtures/catalogue';

const catalogue = makeCatalogue({
  templates: [
    makeCatalogueEntry({ task_id: 't1', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'built' }),
  ],
  seeds: [],
});
const sliceElectrical = getCatalogueForDiscipline('electrical', catalogue);
const sliceStructural = getCatalogueForDiscipline('structural', catalogue); // empty

const baseMeta = {
  libraryVersion: '0.1.0',
  libraryCommit: '1a2b3c4d5e6f78',
  generatedAt: '2026-04-19T09:00:00Z',
};

describe('DisciplineTrailingSlot', () => {
  it('renders summary, category sections, and nav for a populated slice', () => {
    render(
      <DisciplineTrailingSlot
        slug="electrical"
        slice={sliceElectrical}
        {...baseMeta}
      />,
    );
    expect(screen.getByText(/1 tasks/)).toBeInTheDocument();        // summary totals
    expect(screen.getByText(/Cable Sizing/)).toBeInTheDocument();   // category section
    expect(screen.getByRole('link', { name: /prev: civil/ })).toBeInTheDocument(); // nav
    expect(screen.getByRole('link', { name: /next: ground/ })).toBeInTheDocument();
  });

  it('renders an empty-state message when the slice has no entries', () => {
    render(
      <DisciplineTrailingSlot
        slug="structural"
        slice={sliceStructural}
        {...baseMeta}
      />,
    );
    expect(screen.getByText(/no templates or seeds registered/i)).toBeInTheDocument();
    // Nav still renders on empty state:
    expect(screen.getByRole('link', { name: /prev: mechanical/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/discipline-trailing-slot.test.tsx
```

Expected: FAIL — component missing.

- [ ] **Step 3: Create the assembly component**

```tsx
// components/discipline/discipline-trailing-slot.tsx
// ABOUTME: Composes CatalogueSummary → CategorySection[] → DisciplineNav for the discipline page.
// ABOUTME: Server component; receives pre-grouped slice from the route.
import type { Domain } from '@/lib/aec-bench/contracts';
import type { DisciplineCatalogueSlice } from '@/lib/aec-bench/library-catalogue';
import { CatalogueSummary } from './catalogue-summary';
import { CategorySection } from './category-section';
import { DisciplineNav } from './discipline-nav';

export interface DisciplineTrailingSlotProps {
  slug: Domain;
  slice: DisciplineCatalogueSlice;
  libraryVersion: string;
  libraryCommit: string;
  generatedAt: string;
}

export function DisciplineTrailingSlot({
  slug,
  slice,
  libraryVersion,
  libraryCommit,
  generatedAt,
}: DisciplineTrailingSlotProps) {
  return (
    <section aria-labelledby="catalogue-heading">
      <h2 id="catalogue-heading" className="sr-only">
        Task catalogue for {slug}
      </h2>
      <CatalogueSummary
        totals={slice.totals}
        libraryVersion={libraryVersion}
        libraryCommit={libraryCommit}
        generatedAt={generatedAt}
      />
      {slice.categories.length === 0 ? (
        <p className="font-mono text-xs text-landing-muted">
          no templates or seeds registered for this discipline yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {slice.categories.map((c) => (
            <CategorySection key={c.key} category={c} />
          ))}
        </div>
      )}
      <DisciplineNav slug={slug} />
    </section>
  );
}
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm test tests/discipline/discipline-trailing-slot.test.tsx
```

Expected: PASS both cases.

- [ ] **Step 5: Commit**

```bash
git add components/discipline/discipline-trailing-slot.tsx tests/discipline/discipline-trailing-slot.test.tsx
git commit -m "feat(discipline): DisciplineTrailingSlot assembly + empty-state fallback"
```

---

## Task 12: Route `/leaderboard/[discipline]/page.tsx` + loading

**Files:**
- Create: `app/(home)/leaderboard/[discipline]/page.tsx`
- Create: `app/(home)/leaderboard/[discipline]/loading.tsx`
- Create: `tests/discipline/route.test.tsx`

The RSC wrapper consuming `LeaderboardSurface` with `lockedDiscipline` + `trailingSlot`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/discipline/route.test.tsx
// ABOUTME: Tests the discipline dynamic route — generateStaticParams, metadata, valid/invalid slug behaviour.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  default as DisciplinePage,
  generateStaticParams,
  generateMetadata,
} from '@/app/(home)/leaderboard/[discipline]/page';

// Jest-DOM + render-async helpers: Next's RSC page is async, so we await it.
async function renderAsync(slug: string) {
  const element = await DisciplinePage({ params: Promise.resolve({ discipline: slug }) as any });
  return render(element);
}

describe('generateStaticParams', () => {
  it('returns the five discipline slugs', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([
      { discipline: 'civil' },
      { discipline: 'electrical' },
      { discipline: 'ground' },
      { discipline: 'mechanical' },
      { discipline: 'structural' },
    ]);
  });
});

describe('generateMetadata', () => {
  it('produces title + description for a valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ discipline: 'civil' }) as any });
    expect(meta.title).toMatch(/Civil/);
    expect(meta.description).toMatch(/civil/i);
  });
});

describe('DisciplinePage — valid slug', () => {
  it('renders the LeaderboardSurface heading with the discipline name', async () => {
    await renderAsync('electrical');
    expect(screen.getByRole('heading', { level: 1, name: /Electrical/i })).toBeInTheDocument();
  });

  it('renders the trailing slot (catalogue summary)', async () => {
    await renderAsync('electrical');
    // CatalogueSummary renders a totals line containing "tasks · ... built ... proposed"
    expect(screen.getByText(/tasks.*built.*proposed/)).toBeInTheDocument();
  });

  it('renders prev/next nav chips', async () => {
    await renderAsync('electrical');
    expect(screen.getByRole('link', { name: /prev: civil/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /next: ground/i })).toBeInTheDocument();
  });
});

describe('DisciplinePage — invalid slug', () => {
  it('calls notFound() which throws NEXT_NOT_FOUND', async () => {
    await expect(
      DisciplinePage({ params: Promise.resolve({ discipline: 'quantum' }) as any }),
    ).rejects.toThrow(/NEXT_NOT_FOUND|NOT_FOUND/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test tests/discipline/route.test.tsx
```

Expected: FAIL — page module missing.

- [ ] **Step 3: Create the loading fallback**

```tsx
// app/(home)/leaderboard/[discipline]/loading.tsx
// ABOUTME: Loading fallback for the discipline route — shared with /leaderboard pattern.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="h-8 w-64 animate-pulse rounded bg-[#1a1a1a]" />
      <div className="mt-4 h-4 w-96 animate-pulse rounded bg-[#1a1a1a]" />
    </div>
  );
}
```

- [ ] **Step 4: Create the route**

```tsx
// app/(home)/leaderboard/[discipline]/page.tsx
// ABOUTME: RSC wrapper for /leaderboard/[discipline] — five thin wrappers around LeaderboardSurface.
// ABOUTME: Pre-filters to the slug via lockedDiscipline, renders catalogue trailing slot.
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DOMAINS, type Domain } from '@/lib/aec-bench/contracts';
import { DISCIPLINE_META, DISCIPLINE_ORDER } from '@/lib/disciplines';
import { getByDiscipline, getRunStatus, isMock } from '@/lib/aec-bench/read';
import { getCatalogue, getCatalogueForDiscipline } from '@/lib/aec-bench/library-catalogue';
import { LeaderboardSurface } from '@/components/leaderboard/leaderboard-surface';
import { DisciplineTrailingSlot } from '@/components/discipline/discipline-trailing-slot';
import Loading from './loading';

export async function generateStaticParams() {
  return DISCIPLINE_ORDER.map((discipline) => ({ discipline }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discipline: string }>;
}): Promise<Metadata> {
  const { discipline } = await params;
  if (!isValidDiscipline(discipline)) {
    return { title: 'Not Found — AEC-Bench' };
  }
  const meta = DISCIPLINE_META[discipline];
  return {
    title: `${meta.name} — AEC-Bench Leaderboard`,
    description: `${meta.description} Benchmark results for ${meta.name.toLowerCase()} engineering tasks across models and harnesses.`,
  };
}

function isValidDiscipline(slug: string): slug is Domain {
  return (DOMAINS as readonly string[]).includes(slug);
}

export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ discipline: string }>;
}) {
  const { discipline } = await params;
  if (!isValidDiscipline(discipline)) notFound();

  const slice = await getByDiscipline(discipline);
  const runStatus = getRunStatus();
  const catalogue = getCatalogue();
  const catalogueSlice = getCatalogueForDiscipline(discipline, catalogue);
  const meta = DISCIPLINE_META[discipline];

  return (
    <div className="bg-landing-bg">
      <Suspense fallback={<Loading />}>
        <LeaderboardSurface
          entries={slice.entries}
          isMock={isMock()}
          runStatus={runStatus}
          heading={meta.name}
          subheading={meta.description}
          lockedDiscipline={discipline}
          trailingSlot={
            <DisciplineTrailingSlot
              slug={discipline}
              slice={catalogueSlice}
              libraryVersion={catalogue.library_version}
              libraryCommit={catalogue.library_commit}
              generatedAt={catalogue.generated_at}
            />
          }
        />
      </Suspense>
    </div>
  );
}
```

Note: `getByDiscipline` already exists in `lib/aec-bench/read.ts` and dynamically imports the slice JSON. If its return shape has `entries` at top-level (it returns `LeaderboardArtefact`), then `slice.entries` is correct.

- [ ] **Step 5: Run to verify pass**

```bash
pnpm test tests/discipline/route.test.tsx
```

Expected: PASS all four describes. If the invalid-slug test fails because `notFound()` throws asynchronously inside the RSC, adjust the assertion to match the actual thrown string (Next 15 throws `NEXT_NOT_FOUND` as a Digest Error).

- [ ] **Step 6: Run the whole discipline test folder**

```bash
pnpm test tests/discipline/
```

Expected: PASS.

- [ ] **Step 7: Manually smoke-test in dev**

```bash
pnpm dev
# Visit http://localhost:3000/leaderboard/civil — expect the heading "Civil", locked discipline filter,
# catalogue section with collapsible categories, and prev/next chips.
# Also visit /leaderboard/electrical and one invalid slug (/leaderboard/quantum) to confirm 404.
```

- [ ] **Step 8: Commit**

```bash
git add app/\(home\)/leaderboard/\[discipline\]/ tests/discipline/route.test.tsx
git commit -m "feat(discipline): /leaderboard/[discipline] RSC route + loading"
```

---

## Task 13: Landing — import metadata from `lib/disciplines`

**Files:**
- Modify: `components/landing/disciplines.tsx` (import `DISCIPLINE_META`/`DISCIPLINE_ORDER`; accept `counts` prop for taskCount)
- Modify: `app/(home)/page.tsx` (or wherever the landing page composes `<Disciplines>` — RSC now passes counts from catalogue)
- Modify: `tests/components/disciplines.test.tsx` (update expectations)

This is the biggest landing edit — split into TWO tasks (Task 13 = metadata module consumption + live counts; Task 14 = coverage-line live number).

- [ ] **Step 1: Find where `<Disciplines>` is rendered**

```bash
grep -Rln 'Disciplines' app/ components/
```

Expected: lists the landing page RSC (likely `app/(home)/page.tsx`) and `components/landing/disciplines.tsx`.

- [ ] **Step 2: Update the test first**

Replace `tests/components/disciplines.test.tsx` with:

```tsx
// tests/components/disciplines.test.tsx
// ABOUTME: Tests the restyled disciplines section — props-driven counts and metadata module usage.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Disciplines } from '@/components/landing/disciplines';

const counts = {
  civil:      { templates: 56, seeds: 31 },
  electrical: { templates: 13, seeds: 131 },
  ground:     { templates: 10, seeds: 3 },
  mechanical: { templates: 0,  seeds: 141 },
  structural: { templates: 0,  seeds: 82 },
};

describe('Disciplines', () => {
  it('renders the heading', () => {
    render(<Disciplines counts={counts} />);
    expect(
      screen.getByRole('heading', { name: /five engineering disciplines/i }),
    ).toBeInTheDocument();
  });

  it('renders five discipline codes', () => {
    render(<Disciplines counts={counts} />);
    for (const c of ['CIV·01', 'ELE·02', 'GND·03', 'MEC·04', 'STR·05']) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
  });

  it('renders all five discipline names', () => {
    render(<Disciplines counts={counts} />);
    for (const n of ['Civil', 'Electrical', 'Ground', 'Mechanical', 'Structural']) {
      expect(screen.getByRole('heading', { name: n })).toBeInTheDocument();
    }
  });

  it('renders two-line built / proposed counts per card', () => {
    render(<Disciplines counts={counts} />);
    // Civil: 56 built + 31 proposed
    expect(screen.getByText(/56 built/)).toBeInTheDocument();
    expect(screen.getByText(/\+ 31 proposed/)).toBeInTheDocument();
    // Electrical: 13 built + 131 proposed
    expect(screen.getByText(/13 built/)).toBeInTheDocument();
    expect(screen.getByText(/\+ 131 proposed/)).toBeInTheDocument();
    // Mechanical: 0 built
    expect(screen.getByText(/0 built/)).toBeInTheDocument();
    expect(screen.getByText(/\+ 141 proposed/)).toBeInTheDocument();
  });

  it('links each card to /leaderboard/[discipline]', () => {
    render(<Disciplines counts={counts} />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/leaderboard/civil');
    expect(hrefs).toContain('/leaderboard/structural');
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
pnpm test tests/components/disciplines.test.tsx
```

Expected: FAIL — `<Disciplines>` currently doesn't accept `counts` (it's propless).

- [ ] **Step 4: Update the Disciplines component**

Replace `components/landing/disciplines.tsx` with:

```tsx
// components/landing/disciplines.tsx
// ABOUTME: Disciplines showcase — 5 cards in a row; metadata pulled from lib/disciplines.
// ABOUTME: Each card links to /leaderboard/[discipline] and displays live built/proposed counts.
import Link from 'next/link';
import { BlueprintBg } from './blueprint-bg';
import { SectionAnno } from './section-anno';
import { SheetCorners } from './sheet-corners';
import { FadeUp } from './motion-primitives';
import {
  CivilGlyph,
  ElectricalGlyph,
  GroundGlyph,
  MechanicalGlyph,
  StructuralGlyph,
} from './discipline-glyphs';
import type { ComponentType } from 'react';
import type { Domain } from '@/lib/aec-bench/contracts';
import { DISCIPLINE_META, DISCIPLINE_ORDER } from '@/lib/disciplines';

const GLYPHS: Record<Domain, ComponentType<{ className?: string }>> = {
  civil: CivilGlyph,
  electrical: ElectricalGlyph,
  ground: GroundGlyph,
  mechanical: MechanicalGlyph,
  structural: StructuralGlyph,
};

export interface DisciplinesProps {
  counts: Record<Domain, { templates: number; seeds: number }>;
}

export function Disciplines({ counts }: DisciplinesProps) {
  return (
    <BlueprintBg>
      <SheetCorners figNumber={4} figName="DISCIPLINES" />
      <FadeUp>
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
            {DISCIPLINE_ORDER.map((slug) => {
              const meta = DISCIPLINE_META[slug];
              const Glyph = GLYPHS[slug];
              const c = counts[slug];
              return (
                <Link
                  key={slug}
                  href={`/leaderboard/${slug}`}
                  className="group flex min-h-[170px] flex-col overflow-hidden rounded border border-landing-border bg-[#050505] p-4 transition-colors hover:border-accent-amber"
                >
                  <div className="mb-2 flex justify-between font-mono text-[0.6rem] uppercase tracking-wider text-[#666]">
                    <span>{meta.code.split('·')[0]}·</span>
                    <span className="text-accent-amber">{meta.code.split('·')[1]}</span>
                  </div>
                  <span className="sr-only">{meta.code}</span>
                  <Glyph className="mb-2" />
                  <h3 className="text-base font-semibold text-landing-text">{meta.name}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-landing-muted">
                    {meta.description}
                  </p>
                  <div className="mt-2 font-mono text-xs text-accent-amber">
                    {c.templates} <span className="text-[#555]">built</span>
                  </div>
                  <div className="font-mono text-[0.65rem] text-landing-muted">
                    + {c.seeds} proposed
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </FadeUp>
    </BlueprintBg>
  );
}
```

Note: the coverage line (`547/547`) stays hardcoded in this task — Task 14 replaces it live.

- [ ] **Step 5: Update the landing page RSC to pass `counts`**

Find where `<Disciplines />` is called (likely `app/(home)/page.tsx`) and update the call site:

```tsx
// app/(home)/page.tsx — affected import + usage only
import { Disciplines } from '@/components/landing/disciplines';
import { getCatalogue } from '@/lib/aec-bench/library-catalogue';

// ... inside the page component:
const catalogue = getCatalogue();
const counts = catalogue.counts.by_discipline;

// ... and where <Disciplines /> is rendered:
<Disciplines counts={counts} />
```

Before editing, inspect the current file layout — if `<Disciplines />` is currently rendered inside a sub-component, pass `counts` through props rather than re-reading the catalogue twice.

- [ ] **Step 6: Run tests**

```bash
pnpm test tests/components/disciplines.test.tsx
pnpm test
```

Expected: both green.

- [ ] **Step 7: Manually verify the landing**

```bash
pnpm dev
# Visit http://localhost:3000 — scroll to Disciplines section.
# Expect each card to show (e.g.) "56 built" / "+ 31 proposed" instead of the old "108 tasks".
```

- [ ] **Step 8: Commit**

```bash
git add components/landing/disciplines.tsx app/\(home\)/page.tsx tests/components/disciplines.test.tsx
git commit -m "refactor(landing): source discipline metadata from lib/disciplines + live counts"
```

---

## Task 14: Landing — live coverage line

**Files:**
- Modify: `components/landing/disciplines.tsx` (accept a `totalTasks` prop; replace hardcoded `547`)
- Modify: call site (RSC) to pass `catalogue.counts.total_templates + catalogue.counts.total_seeds`
- Modify: `tests/components/disciplines.test.tsx`

- [ ] **Step 1: Update the test to cover the new prop**

Append inside the `describe('Disciplines', …)` in `tests/components/disciplines.test.tsx`:

```tsx
  it('renders the live coverage line using totalTasks prop', () => {
    render(<Disciplines counts={counts} totalTasks={467} />);
    expect(screen.getByText(/467\/467/)).toBeInTheDocument();
  });
```

Also update all existing `<Disciplines counts={counts} />` instances in the test file to pass `totalTasks={467}` (or whatever value) to match the now-required prop. The test at the top of Task 13 is the baseline — edit it to:

```tsx
render(<Disciplines counts={counts} totalTasks={467} />);
```

in every test.

- [ ] **Step 2: Run to verify the existing tests now fail on the missing prop**

```bash
pnpm test tests/components/disciplines.test.tsx
```

Expected: TypeScript error or assertion mismatch on `547/547` since the component still hardcodes it.

- [ ] **Step 3: Update the component**

In `components/landing/disciplines.tsx`:

```tsx
// Replace the interface:
export interface DisciplinesProps {
  counts: Record<Domain, { templates: number; seeds: number }>;
  totalTasks: number;
}

// Replace the signature:
export function Disciplines({ counts, totalTasks }: DisciplinesProps) {

// Replace the coverage <p> line inside the JSX with:
<p className="mb-8 mt-1 font-mono text-xs text-landing-muted">
  coverage <span className="text-accent-amber">{totalTasks}/{totalTasks}</span> tasks · verified against
  AS/NZS standards
</p>
```

- [ ] **Step 4: Update the call site**

```tsx
// app/(home)/page.tsx — just the relevant usage:
const catalogue = getCatalogue();
const counts = catalogue.counts.by_discipline;
const totalTasks = catalogue.counts.total_templates + catalogue.counts.total_seeds;

// ...
<Disciplines counts={counts} totalTasks={totalTasks} />
```

- [ ] **Step 5: Run tests**

```bash
pnpm test
```

Expected: all green.

- [ ] **Step 6: Manually verify the landing header**

```bash
pnpm dev
# Visit http://localhost:3000 — expect "coverage 467/467 tasks" (or the current total), not 547/547.
```

- [ ] **Step 7: Commit**

```bash
git add components/landing/disciplines.tsx app/\(home\)/page.tsx tests/components/disciplines.test.tsx
git commit -m "feat(landing): live coverage total from library catalogue"
```

---

## Task 15: E2E smoke — all 5 discipline routes

**Files:**
- Create: `tests/e2e/discipline-pages.spec.ts`

Five tests (one per slug) via Playwright's `test.describe.parallel` pattern; verify landing → card click → route → expand → prev/next navigation → wraparound.

- [ ] **Step 1: Write the spec**

```ts
// tests/e2e/discipline-pages.spec.ts
// ABOUTME: Full e2e path for the 5 discipline routes — link-through, collapsible, nav chips.
import { test, expect, type Page } from '@playwright/test';

const SLUGS = ['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const;
type Slug = (typeof SLUGS)[number];

const NAMES: Record<Slug, string> = {
  civil: 'Civil',
  electrical: 'Electrical',
  ground: 'Ground',
  mechanical: 'Mechanical',
  structural: 'Structural',
};

async function landingToDiscipline(page: Page, slug: Slug) {
  await page.goto('/');
  await page.locator(`a[href="/leaderboard/${slug}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/leaderboard/${slug}$`));
}

test.describe('discipline pages — smoke', () => {
  for (const slug of SLUGS) {
    test(`${slug}: landing → page → heading + catalogue summary`, async ({ page }) => {
      await landingToDiscipline(page, slug);
      await expect(
        page.getByRole('heading', { level: 1, name: new RegExp(NAMES[slug], 'i') }),
      ).toBeVisible();
      await expect(page.getByText(/tasks.*built.*proposed/)).toBeVisible();
    });
  }

  test('civil → expand first category → cards visible', async ({ page }) => {
    await page.goto('/leaderboard/civil');
    const firstDetails = page.locator('details').first();
    await expect(firstDetails).toHaveAttribute('open', /.*/, { timeout: 0 }).catch(() => {});
    // Click summary to expand:
    await firstDetails.locator('summary').click();
    // After expansion the details has the `open` attribute:
    await expect(firstDetails).toHaveJSProperty('open', true);
    // At least one task card title is now visible:
    const article = firstDetails.locator('article').first();
    await expect(article).toBeVisible();
  });

  test('electrical → next chip → ground; wraps at structural', async ({ page }) => {
    await page.goto('/leaderboard/electrical');
    await page.getByRole('link', { name: /next: ground/i }).click();
    await expect(page).toHaveURL(/\/leaderboard\/ground$/);

    await page.goto('/leaderboard/structural');
    await page.getByRole('link', { name: /next: civil/i }).click();
    await expect(page).toHaveURL(/\/leaderboard\/civil$/);
  });

  test('civil → prev chip → structural (wraparound)', async ({ page }) => {
    await page.goto('/leaderboard/civil');
    await page.getByRole('link', { name: /prev: structural/i }).click();
    await expect(page).toHaveURL(/\/leaderboard\/structural$/);
  });

  test('invalid slug returns 404', async ({ page }) => {
    const response = await page.goto('/leaderboard/quantum');
    expect(response?.status()).toBe(404);
  });
});
```

- [ ] **Step 2: Run to verify the spec passes**

```bash
pnpm test:e2e tests/e2e/discipline-pages.spec.ts
```

Expected: all tests pass. If the collapsible test fails because `toHaveAttribute('open', /.*/)` throws, remove that intermediate assertion — the direct `toHaveJSProperty('open', true)` check after clicking is sufficient.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/discipline-pages.spec.ts
git commit -m "test(e2e): discipline pages smoke across all 5 slugs"
```

---

## Task 16: Bundle budget guard for discipline route

**Files:**
- Modify: `scripts/check-bundle-size.ts`

Extend the existing guard to also inspect `/leaderboard/[discipline]`. Budget: 150 KB (same as `/leaderboard`). Because the trailing slot is all server-rendered, the client bundle should be essentially identical to `/leaderboard`.

- [ ] **Step 1: Read current bundle-size script**

```bash
cat scripts/check-bundle-size.ts
```

- [ ] **Step 2: Refactor to handle multiple entries**

Replace `scripts/check-bundle-size.ts` with:

```ts
// ABOUTME: Fails CI if the /leaderboard or /leaderboard/[discipline] route bundles exceed the gzip budget.
// ABOUTME: Reads the Turbopack page_client-reference-manifest.js and sums unique chunk gzip sizes per entry.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 150;

interface ClientReferenceManifest {
  entryJSFiles: Record<string, string[]>;
  [key: string]: unknown;
}

interface RouteSpec {
  label: string;
  manifestPath: string;
  patterns: RegExp[];
}

const ROUTES: RouteSpec[] = [
  {
    label: 'leaderboard',
    manifestPath: '.next/server/app/(home)/leaderboard/page_client-reference-manifest.js',
    patterns: [/app\/\(home\)\/leaderboard\/page$/, /app\/leaderboard\/page$/],
  },
  {
    label: 'discipline',
    manifestPath:
      '.next/server/app/(home)/leaderboard/[discipline]/page_client-reference-manifest.js',
    patterns: [
      /app\/\(home\)\/leaderboard\/\[discipline\]\/page$/,
      /app\/leaderboard\/\[discipline\]\/page$/,
    ],
  },
];

function extractManifest(raw: string): ClientReferenceManifest {
  const match = raw.match(/globalThis\.__RSC_MANIFEST\["[^"]+"\]\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) throw new Error('Could not parse client-reference-manifest.');
  return JSON.parse(match[1]) as ClientReferenceManifest;
}

function measureRoute(route: RouteSpec): number {
  let raw: string;
  try {
    raw = readFileSync(route.manifestPath, 'utf-8');
  } catch {
    console.error(`Could not read ${route.manifestPath}. Run 'pnpm build' first.`);
    process.exit(1);
  }
  const manifest = extractManifest(raw);
  const entryJSFiles = manifest.entryJSFiles;
  if (!entryJSFiles) {
    console.error(`[${route.label}] manifest missing entryJSFiles`);
    process.exit(1);
  }
  const entryKey = Object.keys(entryJSFiles).find((k) => route.patterns.some((p) => p.test(k)));
  if (!entryKey) {
    console.error(`[${route.label}] entry not found. Available: ${Object.keys(entryJSFiles).join(', ')}`);
    process.exit(1);
  }
  const uniqueChunks = [...new Set(entryJSFiles[entryKey])];
  let totalGzip = 0;
  for (const chunk of uniqueChunks) {
    try {
      const buf = readFileSync(join('.next', chunk));
      totalGzip += gzipSync(buf).length;
    } catch {
      // chunk may be inlined — ignore
    }
  }
  const kb = totalGzip / 1024;
  console.log(`[${route.label}] client JS: ${kb.toFixed(1)} KB gzipped  (budget: ${BUDGET_KB} KB, chunks: ${uniqueChunks.length})`);
  return kb;
}

function main(): void {
  let anyExceeded = false;
  const measurements: Array<{ label: string; kb: number }> = [];

  for (const route of ROUTES) {
    const kb = measureRoute(route);
    measurements.push({ label: route.label, kb });
    if (kb > BUDGET_KB) {
      console.error(
        `\n[${route.label}] bundle exceeds budget by ${(kb - BUDGET_KB).toFixed(1)} KB.`,
      );
      anyExceeded = true;
    }
  }

  // Discipline route should not add >10 KB vs leaderboard (trailing slot is server-rendered).
  const leaderboardKb = measurements.find((m) => m.label === 'leaderboard')?.kb ?? 0;
  const disciplineKb = measurements.find((m) => m.label === 'discipline')?.kb ?? 0;
  const delta = disciplineKb - leaderboardKb;
  if (delta > 10) {
    console.error(
      `\n[discipline] route is ${delta.toFixed(1)} KB heavier than /leaderboard (expected ≤10 KB).`,
    );
    anyExceeded = true;
  }

  if (anyExceeded) process.exit(1);
  console.log('All route bundles within budget.');
}

main();
```

- [ ] **Step 3: Build and run the guard**

```bash
pnpm build
pnpm test:bundle
```

Expected output:
```
[leaderboard] client JS: NNN.N KB gzipped  (budget: 150 KB, chunks: N)
[discipline] client JS: NNN.N KB gzipped  (budget: 150 KB, chunks: N)
All route bundles within budget.
```

If the `[discipline]` entry is not found, the build may not be emitting a manifest for dynamic routes. In that case, inspect `.next/server/app/(home)/leaderboard/\[discipline\]/` to confirm the manifest file name and adjust `manifestPath` regex.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-bundle-size.ts
git commit -m "test(perf): bundle budget guard for /leaderboard/[discipline]"
```

---

## Task 17: a11y audit for discipline page

**Files:**
- Create: `tests/e2e/discipline-a11y.spec.ts`

Zero-violation axe audit on `/leaderboard/civil`, desktop + mobile viewports, collapsed + expanded states.

- [ ] **Step 1: Write the spec**

```ts
// tests/e2e/discipline-a11y.spec.ts
// ABOUTME: axe audit for /leaderboard/civil — desktop + mobile, collapsed + expanded categories.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('discipline page a11y', () => {
  test('desktop · collapsed categories', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/leaderboard/civil');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('desktop · expanded first category', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/leaderboard/civil');
    await page.waitForLoadState('networkidle');
    await page.locator('details summary').first().click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('mobile · collapsed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/leaderboard/civil');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/e2e/discipline-a11y.spec.ts
```

Expected: all three pass. If any violation appears, fix it in the relevant component (most likely candidates: status pill contrast on `accent-teal`, or the summary lacking `aria-label`).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/discipline-a11y.spec.ts
git commit -m "test(a11y): axe audit for /leaderboard/[discipline] desktop + mobile"
```

---

## Task 18: Full sweep + PR prep

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

```bash
pnpm test
```

Expected: all green, no skipped, no snapshot failures.

- [ ] **Step 2: Run the full e2e suite**

```bash
pnpm test:e2e
```

Expected: all green.

- [ ] **Step 3: Run the bundle guard against a fresh build**

```bash
pnpm build
pnpm test:bundle
```

Expected: both routes within budget.

- [ ] **Step 4: Run the registry parity check**

```bash
pnpm test:registry
```

Expected: PASS (unrelated to this sprint, but catches regressions).

- [ ] **Step 5: Manual visual pass**

```bash
pnpm dev
```

Open in a browser:
- `/` — verify the Disciplines section shows `N built / +M proposed` in every card and the coverage line shows a live total.
- `/leaderboard/civil` — verify heading, locked discipline filter, catalogue section with collapsible categories, prev/next chips wrapping to structural / electrical.
- `/leaderboard/electrical` — same, plus one category expansion to confirm cards render.
- `/leaderboard/mechanical` — expect "0 built" + N proposed; empty leaderboard slice should degrade gracefully (table + chart show zero-state).
- `/leaderboard/quantum` — expect Next.js 404 page.

- [ ] **Step 6: Confirm no dead files or untracked artefacts**

```bash
git status
```

Expected: clean working tree (everything staged in prior tasks is now committed).

- [ ] **Step 7: Push the branch and open a PR**

```bash
git push -u origin phase3/discipline-pages
gh pr create \
  --title "Phase 3: /leaderboard/[discipline] pages + landing live counts" \
  --body "$(cat <<'EOF'
## Summary
- Five thin `/leaderboard/[discipline]` RSC wrappers around `LeaderboardSurface`, one per discipline.
- New `components/discipline/` trailing slot (catalogue summary, category-grouped collapsibles, prev/next nav) backed by the library's v1 `library-catalogue.json` export.
- Landing: discipline metadata lifted to `lib/disciplines.ts`, hardcoded taskCounts replaced with live `N built / +M proposed`, coverage line now uses the catalogue total.

## Test plan
- [x] pnpm test
- [x] pnpm test:e2e
- [x] pnpm build && pnpm test:bundle
- [x] Manual browser sweep across all 5 slugs + landing

Spec: `docs/specs/2026-04-19-discipline-pages-design.md`
Plan: `docs/plans/2026-04-19-discipline-pages-plan.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 8: Clean up the worktree after merge**

```bash
cd /Users/theodoros.galanos/LocalProjects/aecbench-site
git worktree remove .worktrees/discipline-pages
git branch -d phase3/discipline-pages
```

---

## Summary of commits

18 commits landed on `phase3/discipline-pages`, mirroring the task numbering:

| # | Task | Commit prefix |
|---|---|---|
| 1 | Fixtures | `test(discipline)` |
| 2 | `lib/disciplines.ts` | `feat(discipline)` |
| 3 | Catalogue zod contract | `feat(catalogue)` |
| 4 | Catalogue read helpers | `feat(catalogue)` |
| 5 | Sync script | `feat(sync)` |
| 6 | pnpm wiring + gitignore + commit catalogue | `chore(catalogue)` |
| 7 | CatalogueSummary | `feat(discipline)` |
| 8 | TaskCard | `feat(discipline)` |
| 9 | CategorySection | `feat(discipline)` |
| 10 | DisciplineNav | `feat(discipline)` |
| 11 | DisciplineTrailingSlot | `feat(discipline)` |
| 12 | Route + loading | `feat(discipline)` |
| 13 | Landing: metadata + counts | `refactor(landing)` |
| 14 | Landing: coverage total | `feat(landing)` |
| 15 | E2E smoke | `test(e2e)` |
| 16 | Bundle guard | `test(perf)` |
| 17 | a11y audit | `test(a11y)` |
| 18 | Final verification | (no commit — PR only) |
