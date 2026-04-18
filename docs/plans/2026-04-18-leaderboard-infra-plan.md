# Leaderboard Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the data pipeline, contracts, and build-time aggregation that feeds the landing page's leaderboard preview from real (mock-for-now) submissions committed as files under `results/`, so the landing stops relying on hand-curated `data.ts`.

**Architecture:** Three layers — TypeScript+zod mirrors of aec-bench library pydantic contracts, a Node ingest script that walks `results/experiments/`, validates, resolves a site-owned model registry, aggregates, and emits typed JSON artefacts to `public/data/`, and a thin read layer that pages import from. Mock experiments live alongside real ones under `results/experiments/_mock-*/` with a `mock: true` flag that surfaces a preview banner.

**Tech Stack:** TypeScript, zod (validation), js-yaml (YAML parsing), seedrandom (deterministic PRNG for mock generator), vitest (unit + integration), Playwright (E2E). Next.js 15 `prebuild` hook invokes the ingest script; no runtime backend.

**Reference spec:** `docs/specs/2026-04-18-leaderboard-infra-design.md`.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (auto-regenerated)

- [ ] **Step 1: Add runtime and dev dependencies**

```bash
pnpm add zod@^3.23.8 js-yaml@^4.1.0 seedrandom@^3.0.5
pnpm add -D @types/js-yaml@^4.0.9 @types/seedrandom@^3.0.8
```

- [ ] **Step 2: Verify the additions**

Run: `pnpm list zod js-yaml seedrandom`
Expected: all three listed with the versions above.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add zod, js-yaml, seedrandom for ingest pipeline"
```

---

## Task 2: Scaffold contracts module (library-mirror types)

**Files:**
- Create: `lib/aec-bench/contracts.ts`
- Create: `tests/ingest/contracts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/contracts.test.ts
// ABOUTME: Exercises zod schemas mirroring aec-bench library pydantic contracts.
// ABOUTME: Asserts every schema accepts a valid fixture and rejects known malformations.
import { describe, it, expect } from 'vitest';
import {
  TrialRecordSchema,
  DatasetManifestSchema,
  SubmissionSchema,
  ModelEntrySchema,
} from '@/lib/aec-bench/contracts';

const validTrial = {
  trial_id: 'pf-droop__abc123',
  experiment_id: 'sonnet4-tool-loop',
  dataset_id: 'aec-bench@0.4.1',
  timestamp: '2026-04-10T12:00:00Z',
  task: { task_id: 'electrical/pf-droop', task_revision: 'deadbeef' },
  agent: {
    adapter: 'tool_loop',
    model: 'claude-sonnet-4-6',
    adapter_revision: '1.0.0',
    configuration: {},
  },
  evaluation: {
    reward: 0.82,
    validity: {
      output_parseable: true,
      schema_valid: true,
      verifier_completed: true,
    },
  },
  timing: { total_seconds: 42.5, agent_seconds: 30.1 },
  cost: {
    tokens_in: 50000,
    tokens_out: 10000,
    cache_read_tokens: null,
    cache_write_tokens: null,
    estimated_cost_usd: 0.3,
  },
  completeness: 'complete' as const,
};

describe('TrialRecordSchema', () => {
  it('accepts a valid TrialRecord', () => {
    expect(() => TrialRecordSchema.parse(validTrial)).not.toThrow();
  });

  it('rejects reward outside [0, 1]', () => {
    const bad = { ...validTrial, evaluation: { ...validTrial.evaluation, reward: 1.5 } };
    expect(() => TrialRecordSchema.parse(bad)).toThrow();
  });

  it('rejects unknown completeness', () => {
    const bad = { ...validTrial, completeness: 'maybe' as unknown as 'complete' };
    expect(() => TrialRecordSchema.parse(bad)).toThrow();
  });

  it('allows cost to be null', () => {
    expect(() => TrialRecordSchema.parse({ ...validTrial, cost: null })).not.toThrow();
  });
});

describe('DatasetManifestSchema', () => {
  it('accepts a valid manifest', () => {
    const manifest = {
      name: 'aec-bench',
      version: '0.4.1',
      content_hash: 'hash-' + 'a'.repeat(56),
      description: { summary: 'AEC engineering tasks', task_count: 547 },
      tasks: [
        { task_id: 'electrical/pf-droop', domain: 'electrical', difficulty: 'medium', tags: [] },
      ],
    };
    expect(() => DatasetManifestSchema.parse(manifest)).not.toThrow();
  });

  it('rejects unknown domain', () => {
    const bad = {
      name: 'x',
      version: '0.0.1',
      content_hash: 'h',
      description: { summary: 's', task_count: 1 },
      tasks: [{ task_id: 't', domain: 'biology', difficulty: 'medium', tags: [] }],
    };
    expect(() => DatasetManifestSchema.parse(bad)).toThrow();
  });
});

describe('SubmissionSchema', () => {
  it('accepts a real submission without mock flag', () => {
    const sub = {
      experiment_id: 'e1',
      dataset: 'aec-bench@0.4.1',
      submitter: { github: 'aurecon' },
      model_claim: { library_model: 'claude-sonnet-4-6' },
      submitted_at: '2026-04-10T12:00:00Z',
    };
    expect(() => SubmissionSchema.parse(sub)).not.toThrow();
  });

  it('accepts mock: true with mock_notes', () => {
    const sub = {
      experiment_id: 'mock-1',
      dataset: 'aec-bench@0.4.1',
      submitter: { github: 'aec-bench-bot' },
      model_claim: { library_model: 'claude-sonnet-4-6' },
      submitted_at: '2026-04-10T12:00:00Z',
      mock: true,
      mock_notes: 'Synthetic seed data',
    };
    expect(() => SubmissionSchema.parse(sub)).not.toThrow();
  });
});

describe('ModelEntrySchema', () => {
  it('accepts a valid entry', () => {
    const entry = {
      match: 'claude-sonnet-4',
      display: 'Claude Sonnet 4',
      provider: 'anthropic',
      family: 'Claude 4',
    };
    expect(() => ModelEntrySchema.parse(entry)).not.toThrow();
  });

  it('rejects unknown provider', () => {
    const bad = {
      match: 'foo',
      display: 'Foo',
      provider: 'acme',
    };
    expect(() => ModelEntrySchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/contracts.test.ts`
Expected: FAIL with "Cannot find module '@/lib/aec-bench/contracts'".

- [ ] **Step 3: Implement the contracts module**

```ts
// lib/aec-bench/contracts.ts
// ABOUTME: TypeScript mirrors of aec-bench pydantic contracts plus zod validators.
// ABOUTME: Only the subset the site reads is mirrored — not EnvironmentSpec or ToolSpec.
import { z } from 'zod';

export const DOMAINS = ['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const;
export type Domain = (typeof DOMAINS)[number];

export const PROVIDERS = ['anthropic', 'openai', 'google', 'meta', 'other'] as const;
export type Provider = (typeof PROVIDERS)[number];

// --- Library-mirror contracts ---

export const TrialRecordSchema = z.object({
  trial_id: z.string().min(1),
  experiment_id: z.string().min(1),
  dataset_id: z.string().nullable(),
  timestamp: z.string().min(1),
  task: z.object({
    task_id: z.string().min(1),
    task_revision: z.string().min(1),
  }),
  agent: z.object({
    adapter: z.string().min(1),
    model: z.string().min(1),
    adapter_revision: z.string().nullable(),
    configuration: z.record(z.unknown()),
  }),
  evaluation: z.object({
    reward: z.number().min(0).max(1),
    validity: z.object({
      output_parseable: z.boolean(),
      schema_valid: z.boolean(),
      verifier_completed: z.boolean(),
    }),
  }),
  timing: z.object({
    total_seconds: z.number().nonnegative(),
    agent_seconds: z.number().nonnegative().nullable(),
  }),
  cost: z
    .object({
      tokens_in: z.number().int().nonnegative().nullable(),
      tokens_out: z.number().int().nonnegative().nullable(),
      cache_read_tokens: z.number().int().nonnegative().nullable(),
      cache_write_tokens: z.number().int().nonnegative().nullable(),
      estimated_cost_usd: z.number().nonnegative().nullable(),
    })
    .nullable(),
  completeness: z.enum(['complete', 'partial']),
});
export type TrialRecord = z.infer<typeof TrialRecordSchema>;

export const DatasetTaskEntrySchema = z.object({
  task_id: z.string().min(1),
  domain: z.enum(DOMAINS),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
});
export type DatasetTaskEntry = z.infer<typeof DatasetTaskEntrySchema>;

export const DatasetManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  content_hash: z.string().min(1),
  description: z.object({
    summary: z.string().min(1),
    task_count: z.number().int().nonnegative(),
  }),
  tasks: z.array(DatasetTaskEntrySchema).min(1),
});
export type DatasetManifest = z.infer<typeof DatasetManifestSchema>;

// --- Site-owned contracts ---

export const ModelEntrySchema = z.object({
  match: z.string().min(1),
  display: z.string().min(1),
  provider: z.enum(PROVIDERS),
  family: z.string().optional(),
});
export type ModelEntry = z.infer<typeof ModelEntrySchema>;

export const SubmissionSchema = z.object({
  experiment_id: z.string().min(1),
  dataset: z.string().min(1),
  submitter: z.object({
    github: z.string().min(1),
    organisation: z.string().optional(),
  }),
  model_claim: z.object({
    library_model: z.string().min(1),
    display_override: z.string().optional(),
    provider_override: z.enum(PROVIDERS).optional(),
  }),
  notes: z.string().optional(),
  submitted_at: z.string().min(1),
  mock: z.literal(true).optional(),
  mock_notes: z.string().optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const ActivePointerSchema = z.object({
  benchmark: z.string().min(1),
  version: z.string().min(1),
});
export type ActivePointer = z.infer<typeof ActivePointerSchema>;

// --- Derived aggregates (what the build emits) ---

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
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const RunStatusSchema = z.object({
  tasks: z.number().int().nonnegative(),
  models: z.number().int().nonnegative(),
  adapters: z.number().int().nonnegative(),
  disciplines: z.number().int().nonnegative(),
  last_submission: z.string().min(1),
  generated_at: z.string().min(1),
});
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const LeaderboardArtefactSchema = z.object({
  generated_at: z.string().min(1),
  dataset: DatasetManifestSchema,
  entries: z.array(LeaderboardEntrySchema),
  is_mock: z.boolean(),
  run_status: RunStatusSchema,
});
export type LeaderboardArtefact = z.infer<typeof LeaderboardArtefactSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/contracts.test.ts`
Expected: PASS (4 describe blocks, 10+ tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/contracts.ts tests/ingest/contracts.test.ts
git commit -m "feat(ingest): add aec-bench contracts with zod schemas"
```

---

## Task 3: Model registry — YAML loader and matcher

**Files:**
- Create: `data/models.yml`
- Create: `scripts/ingest/registry.ts`
- Create: `tests/ingest/registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/registry.test.ts
// ABOUTME: Exercises the model registry loader and substring matcher.
// ABOUTME: Matching is case-insensitive, first-match-wins, order matters.
import { describe, it, expect } from 'vitest';
import { loadRegistry, resolveModel, RegistryError } from '@/scripts/ingest/registry';
import type { ModelEntry } from '@/lib/aec-bench/contracts';

const fixture: ModelEntry[] = [
  { match: 'claude-opus-4', display: 'Claude Opus 4', provider: 'anthropic', family: 'Claude 4' },
  { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic', family: 'Claude 4' },
  { match: 'gpt-4.1-mini', display: 'GPT-4.1 Mini', provider: 'openai', family: 'GPT-4.1' },
  { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai', family: 'GPT-4.1' },
];

describe('resolveModel', () => {
  it('returns the first-match entry for a simple lib model string', () => {
    const entry = resolveModel('claude-sonnet-4-6', fixture);
    expect(entry.display).toBe('Claude Sonnet 4');
  });

  it('matches case-insensitively against Bedrock-prefixed strings', () => {
    const entry = resolveModel('au.anthropic.claude-sonnet-4-6', fixture);
    expect(entry.display).toBe('Claude Sonnet 4');
  });

  it('honours order — gpt-4.1-mini wins over gpt-4.1 when input contains both', () => {
    const entry = resolveModel('gpt-4.1-mini-preview', fixture);
    expect(entry.display).toBe('GPT-4.1 Mini');
  });

  it('throws RegistryError with the offending string when no match', () => {
    expect(() => resolveModel('mistral-large', fixture)).toThrow(RegistryError);
    expect(() => resolveModel('mistral-large', fixture)).toThrow(/mistral-large/);
  });
});

describe('loadRegistry', () => {
  it('parses the committed data/models.yml into ModelEntry[]', async () => {
    const entries = await loadRegistry();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveProperty('match');
    expect(entries[0]).toHaveProperty('display');
    expect(entries[0]).toHaveProperty('provider');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/registry.test.ts`
Expected: FAIL with "Cannot find module '@/scripts/ingest/registry'".

- [ ] **Step 3: Create the YAML registry with seeded entries**

```yaml
# data/models.yml
# ABOUTME: Site-owned model registry mapping library model strings to display + provider.
# ABOUTME: Matching is substring, case-insensitive, first-match-wins. Order entries most-specific first (mirrors pricing.py convention).

- match: "claude-opus-4"
  display: "Claude Opus 4"
  provider: anthropic
  family: "Claude 4"
- match: "claude-sonnet-4"
  display: "Claude Sonnet 4"
  provider: anthropic
  family: "Claude 4"
- match: "claude-haiku"
  display: "Claude Haiku"
  provider: anthropic
  family: "Claude 4"
- match: "gpt-4.1-nano"
  display: "GPT-4.1 Nano"
  provider: openai
  family: "GPT-4.1"
- match: "gpt-4.1-mini"
  display: "GPT-4.1 Mini"
  provider: openai
  family: "GPT-4.1"
- match: "gpt-4.1"
  display: "GPT-4.1"
  provider: openai
  family: "GPT-4.1"
- match: "gpt-4o-mini"
  display: "GPT-4o Mini"
  provider: openai
  family: "GPT-4o"
- match: "gpt-4o"
  display: "GPT-4o"
  provider: openai
  family: "GPT-4o"
- match: "o4-mini"
  display: "o4-mini"
  provider: openai
  family: "o-series"
- match: "o3-mini"
  display: "o3-mini"
  provider: openai
  family: "o-series"
- match: "o3"
  display: "o3"
  provider: openai
  family: "o-series"
- match: "gemini-2.5-pro"
  display: "Gemini 2.5 Pro"
  provider: google
  family: "Gemini 2.5"
- match: "gemini-2.5"
  display: "Gemini 2.5"
  provider: google
  family: "Gemini 2.5"
- match: "llama-4-maverick"
  display: "Llama 4 Maverick"
  provider: meta
  family: "Llama 4"
- match: "llama-4"
  display: "Llama 4"
  provider: meta
  family: "Llama 4"
```

- [ ] **Step 4: Implement the loader and resolver**

```ts
// scripts/ingest/registry.ts
// ABOUTME: Loads data/models.yml and resolves raw library model strings to canonical entries.
// ABOUTME: Substring match, case-insensitive, first-match-wins — mirrors aec-bench pricing.py.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { z } from 'zod';
import { ModelEntrySchema, type ModelEntry } from '@/lib/aec-bench/contracts';

export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

const REGISTRY_PATH = resolve(process.cwd(), 'data/models.yml');
const RegistryFileSchema = z.array(ModelEntrySchema);

export async function loadRegistry(path: string = REGISTRY_PATH): Promise<ModelEntry[]> {
  const raw = await readFile(path, 'utf-8');
  const parsed = load(raw);
  return RegistryFileSchema.parse(parsed);
}

export function resolveModel(libraryModel: string, registry: ModelEntry[]): ModelEntry {
  const needle = libraryModel.toLowerCase();
  for (const entry of registry) {
    if (needle.includes(entry.match.toLowerCase())) {
      return entry;
    }
  }
  throw new RegistryError(
    `Unknown model string: "${libraryModel}". Add an entry to data/models.yml under the relevant provider.`,
  );
}

export function slugify(display: string): string {
  return display
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function modelKey(entry: ModelEntry, adapter: string): string {
  return `${slugify(entry.display)}/${adapter}`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/registry.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/models.yml scripts/ingest/registry.ts tests/ingest/registry.test.ts
git commit -m "feat(ingest): model registry loader with substring matching"
```

---

## Task 4: Pricing parity snapshot + CI check

**Files:**
- Create: `data/pricing-snapshot.json`
- Create: `scripts/ingest/pricing-parity.ts`
- Create: `tests/ingest/pricing-parity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/pricing-parity.test.ts
// ABOUTME: Asserts data/models.yml covers every substring pattern in the pricing snapshot.
// ABOUTME: Drift from the library's pricing.py must be detected and fail CI.
import { describe, it, expect } from 'vitest';
import { checkParity, ParityError } from '@/scripts/ingest/pricing-parity';

describe('checkParity', () => {
  it('passes when every snapshot pattern has a matching registry entry', () => {
    const snapshot = { patterns: ['claude-sonnet-4', 'gpt-4.1'] };
    const registry = [
      { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic' as const },
      { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai' as const },
    ];
    expect(() => checkParity(snapshot, registry)).not.toThrow();
  });

  it('throws ParityError naming the missing patterns', () => {
    const snapshot = { patterns: ['claude-sonnet-4', 'gpt-4.1', 'new-model-x'] };
    const registry = [
      { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic' as const },
      { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai' as const },
    ];
    expect(() => checkParity(snapshot, registry)).toThrow(ParityError);
    expect(() => checkParity(snapshot, registry)).toThrow(/new-model-x/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/pricing-parity.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Create the snapshot file**

Seeded from `aec-bench/src/aec_bench/contracts/pricing.py` as of 2026-04-18. Regenerate manually when the library bumps pricing.

```json
{
  "source": "aec-bench/src/aec_bench/contracts/pricing.py",
  "captured_at": "2026-04-18",
  "patterns": [
    "claude-opus-4",
    "claude-sonnet-4",
    "claude-haiku",
    "gpt-4.1-nano",
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-4o-mini",
    "gpt-4o",
    "o3-mini",
    "o4-mini",
    "o3"
  ]
}
```

- [ ] **Step 4: Implement the parity checker**

```ts
// scripts/ingest/pricing-parity.ts
// ABOUTME: Checks data/models.yml covers every substring pattern in the pricing snapshot.
// ABOUTME: Snapshot is refreshed from aec-bench pricing.py whenever the library bumps.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { ModelEntry } from '@/lib/aec-bench/contracts';

export class ParityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParityError';
  }
}

const SnapshotSchema = z.object({
  source: z.string(),
  captured_at: z.string(),
  patterns: z.array(z.string().min(1)),
});
export type PricingSnapshot = z.infer<typeof SnapshotSchema>;

const SNAPSHOT_PATH = resolve(process.cwd(), 'data/pricing-snapshot.json');

export async function loadSnapshot(path: string = SNAPSHOT_PATH): Promise<PricingSnapshot> {
  const raw = await readFile(path, 'utf-8');
  return SnapshotSchema.parse(JSON.parse(raw));
}

export function checkParity(snapshot: PricingSnapshot, registry: ModelEntry[]): void {
  const registered = new Set(registry.map((e) => e.match.toLowerCase()));
  const missing = snapshot.patterns.filter((p) => !registered.has(p.toLowerCase()));
  if (missing.length > 0) {
    throw new ParityError(
      `data/models.yml missing patterns present in pricing snapshot: ${missing.join(', ')}. ` +
        `Add entries for each, or regenerate the snapshot if the library dropped them.`,
    );
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/pricing-parity.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/pricing-snapshot.json scripts/ingest/pricing-parity.ts tests/ingest/pricing-parity.test.ts
git commit -m "feat(ingest): pricing snapshot parity check against registry"
```

---

## Task 5: Experiment discovery

**Files:**
- Create: `scripts/ingest/discover.ts`
- Create: `tests/ingest/discover.test.ts`
- Create: `tests/ingest/fixtures/discover/results/experiments/alpha/submission.yml`
- Create: `tests/ingest/fixtures/discover/results/experiments/alpha/trials/t1.json`
- Create: `tests/ingest/fixtures/discover/results/experiments/beta/submission.yml`
- Create: `tests/ingest/fixtures/discover/results/experiments/beta/trials/t2.json`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/discover.test.ts
// ABOUTME: Walks results/experiments/ and lists experiment folders containing a submission.yml.
// ABOUTME: Missing submission.yml is an error that names the offending folder.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { discoverExperiments } from '@/scripts/ingest/discover';

const FIXTURE_ROOT = resolve(__dirname, 'fixtures/discover');

describe('discoverExperiments', () => {
  it('returns every folder under results/experiments that has a submission.yml', async () => {
    const experiments = await discoverExperiments(FIXTURE_ROOT);
    const ids = experiments.map((e) => e.id).sort();
    expect(ids).toEqual(['alpha', 'beta']);
  });

  it('resolves full paths for submission.yml and trials/', async () => {
    const [alpha] = (await discoverExperiments(FIXTURE_ROOT)).filter((e) => e.id === 'alpha');
    expect(alpha.submissionPath).toMatch(/fixtures\/discover\/results\/experiments\/alpha\/submission\.yml$/);
    expect(alpha.trialsDir).toMatch(/fixtures\/discover\/results\/experiments\/alpha\/trials$/);
  });
});
```

- [ ] **Step 2: Create fixture files**

```yaml
# tests/ingest/fixtures/discover/results/experiments/alpha/submission.yml
experiment_id: alpha
dataset: aec-bench@0.4.1
submitter:
  github: tester
model_claim:
  library_model: claude-sonnet-4-6
submitted_at: 2026-04-10T12:00:00Z
```

```json
// tests/ingest/fixtures/discover/results/experiments/alpha/trials/t1.json
{ "placeholder": true }
```

```yaml
# tests/ingest/fixtures/discover/results/experiments/beta/submission.yml
experiment_id: beta
dataset: aec-bench@0.4.1
submitter:
  github: tester
model_claim:
  library_model: gpt-4.1
submitted_at: 2026-04-10T12:00:00Z
```

```json
// tests/ingest/fixtures/discover/results/experiments/beta/trials/t2.json
{ "placeholder": true }
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test tests/ingest/discover.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement discovery**

```ts
// scripts/ingest/discover.ts
// ABOUTME: Walks results/experiments/ and returns the list of experiment folders to ingest.
// ABOUTME: An experiment is a folder that contains a submission.yml file.
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface DiscoveredExperiment {
  id: string;
  dir: string;
  submissionPath: string;
  trialsDir: string;
}

export async function discoverExperiments(projectRoot: string): Promise<DiscoveredExperiment[]> {
  const root = resolve(projectRoot, 'results/experiments');
  let entries;
  try {
    entries = await readdir(root);
  } catch {
    return [];
  }

  const experiments: DiscoveredExperiment[] = [];
  for (const name of entries) {
    const dir = join(root, name);
    const s = await stat(dir);
    if (!s.isDirectory()) continue;
    const submissionPath = join(dir, 'submission.yml');
    try {
      await stat(submissionPath);
    } catch {
      continue;
    }
    experiments.push({
      id: name,
      dir,
      submissionPath,
      trialsDir: join(dir, 'trials'),
    });
  }
  return experiments;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/discover.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest/discover.ts tests/ingest/discover.test.ts tests/ingest/fixtures/discover/
git commit -m "feat(ingest): walk results/experiments and list submissions"
```

---

## Task 6: Validation — parse and enforce submission + trial constraints

**Files:**
- Create: `scripts/ingest/validate.ts`
- Create: `tests/ingest/validate.test.ts`
- Create: `tests/ingest/fixtures/validate/valid/results/...` (fixture tree — see step 2)

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/validate.test.ts
// ABOUTME: Exercises per-experiment validation — submission.yml, trials, cross-file invariants.
// ABOUTME: Every failure produces a ValidationError that names the offending file.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { discoverExperiments } from '@/scripts/ingest/discover';
import { validateExperiment, ValidationError } from '@/scripts/ingest/validate';
import type { DatasetManifest } from '@/lib/aec-bench/contracts';

const VALID_ROOT = resolve(__dirname, 'fixtures/validate/valid');
const MISMATCH_ROOT = resolve(__dirname, 'fixtures/validate/mismatch');
const DUPLICATE_ROOT = resolve(__dirname, 'fixtures/validate/duplicate-trial');

const manifest: DatasetManifest = {
  name: 'aec-bench',
  version: '0.4.1',
  content_hash: 'h',
  description: { summary: 's', task_count: 1 },
  tasks: [{ task_id: 'electrical/pf-droop', domain: 'electrical', difficulty: 'medium', tags: [] }],
};

describe('validateExperiment', () => {
  it('returns a ValidatedExperiment for a well-formed folder', async () => {
    const [exp] = await discoverExperiments(VALID_ROOT);
    const result = await validateExperiment(exp, manifest, 'aec-bench@0.4.1');
    expect(result.submission.experiment_id).toBe('valid-exp');
    expect(result.trials).toHaveLength(1);
    expect(result.trials[0].trial_id).toBe('t-1');
  });

  it('rejects a submission whose dataset does not match active', async () => {
    const [exp] = await discoverExperiments(MISMATCH_ROOT);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(ValidationError);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(/dataset/);
  });

  it('rejects duplicate trial_ids within an experiment', async () => {
    const [exp] = await discoverExperiments(DUPLICATE_ROOT);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(ValidationError);
    await expect(validateExperiment(exp, manifest, 'aec-bench@0.4.1')).rejects.toThrow(/duplicate/i);
  });

  it('rejects trials whose task_id is not in the dataset manifest', async () => {
    const strictManifest: DatasetManifest = {
      ...manifest,
      tasks: [{ task_id: 'ground/foo', domain: 'ground', difficulty: 'easy', tags: [] }],
    };
    const [exp] = await discoverExperiments(VALID_ROOT);
    await expect(validateExperiment(exp, strictManifest, 'aec-bench@0.4.1')).rejects.toThrow(/task_id/);
  });
});
```

- [ ] **Step 2: Create fixture files**

```yaml
# tests/ingest/fixtures/validate/valid/results/experiments/valid-exp/submission.yml
experiment_id: valid-exp
dataset: aec-bench@0.4.1
submitter:
  github: tester
model_claim:
  library_model: claude-sonnet-4-6
submitted_at: 2026-04-10T12:00:00Z
```

```json
// tests/ingest/fixtures/validate/valid/results/experiments/valid-exp/trials/t-1.json
{
  "trial_id": "t-1",
  "experiment_id": "valid-exp",
  "dataset_id": "aec-bench@0.4.1",
  "timestamp": "2026-04-10T12:00:00Z",
  "task": { "task_id": "electrical/pf-droop", "task_revision": "r1" },
  "agent": {
    "adapter": "tool_loop",
    "model": "claude-sonnet-4-6",
    "adapter_revision": "1.0.0",
    "configuration": {}
  },
  "evaluation": {
    "reward": 0.8,
    "validity": { "output_parseable": true, "schema_valid": true, "verifier_completed": true }
  },
  "timing": { "total_seconds": 10.0, "agent_seconds": 8.0 },
  "cost": {
    "tokens_in": 50000,
    "tokens_out": 10000,
    "cache_read_tokens": null,
    "cache_write_tokens": null,
    "estimated_cost_usd": 0.3
  },
  "completeness": "complete"
}
```

Create analogous fixtures under `fixtures/validate/mismatch/` (same shape but `dataset: aec-bench@0.5.0`) and under `fixtures/validate/duplicate-trial/` (two trials with `trial_id: "t-1"`).

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test tests/ingest/validate.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement the validator**

```ts
// scripts/ingest/validate.ts
// ABOUTME: Per-experiment validation — parse submission + trials, enforce cross-file invariants.
// ABOUTME: Any failure throws a ValidationError that names the offending file.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'js-yaml';
import {
  SubmissionSchema,
  TrialRecordSchema,
  type DatasetManifest,
  type Submission,
  type TrialRecord,
} from '@/lib/aec-bench/contracts';
import type { DiscoveredExperiment } from '@/scripts/ingest/discover';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidatedExperiment {
  id: string;
  dir: string;
  submission: Submission;
  trials: TrialRecord[];
}

export async function validateExperiment(
  exp: DiscoveredExperiment,
  manifest: DatasetManifest,
  activeDataset: string,
): Promise<ValidatedExperiment> {
  // 1. Parse submission.yml
  const submission = await parseSubmission(exp.submissionPath);

  // 2. Enforce: submission.experiment_id must match folder name
  if (submission.experiment_id !== exp.id) {
    throw new ValidationError(
      `${exp.submissionPath}: submission.experiment_id "${submission.experiment_id}" does not match folder name "${exp.id}"`,
    );
  }

  // 3. Enforce: submission.dataset must match active
  if (submission.dataset !== activeDataset) {
    throw new ValidationError(
      `${exp.submissionPath}: submission.dataset "${submission.dataset}" does not match active "${activeDataset}"`,
    );
  }

  // 4. Parse every trial
  const trials = await parseTrials(exp.trialsDir);

  // 5. Enforce: every trial.experiment_id == folder id
  for (const trial of trials) {
    if (trial.experiment_id !== exp.id) {
      throw new ValidationError(
        `${exp.trialsDir}/${trial.trial_id}.json: trial.experiment_id "${trial.experiment_id}" does not match folder "${exp.id}"`,
      );
    }
  }

  // 6. Enforce: trial_ids unique within experiment
  const seen = new Set<string>();
  for (const trial of trials) {
    if (seen.has(trial.trial_id)) {
      throw new ValidationError(`${exp.trialsDir}: duplicate trial_id "${trial.trial_id}"`);
    }
    seen.add(trial.trial_id);
  }

  // 7. Enforce: every trial.task.task_id appears in the active manifest
  const manifestTaskIds = new Set(manifest.tasks.map((t) => t.task_id));
  for (const trial of trials) {
    if (!manifestTaskIds.has(trial.task.task_id)) {
      throw new ValidationError(
        `${exp.trialsDir}/${trial.trial_id}.json: task_id "${trial.task.task_id}" not in active dataset manifest`,
      );
    }
  }

  return { id: exp.id, dir: exp.dir, submission, trials };
}

async function parseSubmission(path: string): Promise<Submission> {
  const raw = await readFile(path, 'utf-8');
  try {
    return SubmissionSchema.parse(load(raw));
  } catch (err) {
    throw new ValidationError(`${path}: ${(err as Error).message}`);
  }
}

async function parseTrials(dir: string): Promise<TrialRecord[]> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    throw new ValidationError(`${dir}: trials directory missing`);
  }
  const trials: TrialRecord[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const path = join(dir, file);
    const raw = await readFile(path, 'utf-8');
    try {
      trials.push(TrialRecordSchema.parse(JSON.parse(raw)));
    } catch (err) {
      throw new ValidationError(`${path}: ${(err as Error).message}`);
    }
  }
  return trials;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/validate.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest/validate.ts tests/ingest/validate.test.ts tests/ingest/fixtures/validate/
git commit -m "feat(ingest): per-experiment validation with cross-file invariants"
```

---

## Task 7: Active pointer + dataset manifest loaders

**Files:**
- Create: `scripts/ingest/active.ts`
- Create: `tests/ingest/active.test.ts`
- Create: `tests/ingest/fixtures/active/results/active.json`
- Create: `tests/ingest/fixtures/active/results/datasets/aec-bench@0.4.1/manifest.json`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/active.test.ts
// ABOUTME: Exercises loading of results/active.json and the referenced DatasetManifest.
// ABOUTME: Missing pointer or manifest is a fatal error that names the expected path.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { loadActive, ActiveLoadError } from '@/scripts/ingest/active';

const ROOT = resolve(__dirname, 'fixtures/active');
const EMPTY = resolve(__dirname, 'fixtures/nonexistent');

describe('loadActive', () => {
  it('returns pointer + manifest for a valid fixture', async () => {
    const { pointer, manifest, activeKey } = await loadActive(ROOT);
    expect(pointer.benchmark).toBe('aec-bench');
    expect(pointer.version).toBe('0.4.1');
    expect(activeKey).toBe('aec-bench@0.4.1');
    expect(manifest.tasks.length).toBeGreaterThan(0);
  });

  it('throws ActiveLoadError when results/active.json is missing', async () => {
    await expect(loadActive(EMPTY)).rejects.toThrow(ActiveLoadError);
  });
});
```

- [ ] **Step 2: Create fixtures**

```json
// tests/ingest/fixtures/active/results/active.json
{ "benchmark": "aec-bench", "version": "0.4.1" }
```

```json
// tests/ingest/fixtures/active/results/datasets/aec-bench@0.4.1/manifest.json
{
  "name": "aec-bench",
  "version": "0.4.1",
  "content_hash": "hash",
  "description": { "summary": "AEC engineering tasks", "task_count": 1 },
  "tasks": [
    { "task_id": "electrical/pf-droop", "domain": "electrical", "difficulty": "medium", "tags": [] }
  ]
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test tests/ingest/active.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement loader**

```ts
// scripts/ingest/active.ts
// ABOUTME: Loads results/active.json and the referenced DatasetManifest for the active version.
// ABOUTME: Missing files are fatal and name the expected path in the error message.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ActivePointerSchema,
  DatasetManifestSchema,
  type ActivePointer,
  type DatasetManifest,
} from '@/lib/aec-bench/contracts';

export class ActiveLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActiveLoadError';
  }
}

export interface ActiveContext {
  pointer: ActivePointer;
  manifest: DatasetManifest;
  activeKey: string; // "name@version"
}

export async function loadActive(projectRoot: string): Promise<ActiveContext> {
  const pointerPath = resolve(projectRoot, 'results/active.json');
  let pointerRaw: string;
  try {
    pointerRaw = await readFile(pointerPath, 'utf-8');
  } catch {
    throw new ActiveLoadError(`${pointerPath}: file missing — expected { benchmark, version }`);
  }

  let pointer: ActivePointer;
  try {
    pointer = ActivePointerSchema.parse(JSON.parse(pointerRaw));
  } catch (err) {
    throw new ActiveLoadError(`${pointerPath}: ${(err as Error).message}`);
  }

  const activeKey = `${pointer.benchmark}@${pointer.version}`;
  const manifestPath = resolve(projectRoot, `results/datasets/${activeKey}/manifest.json`);

  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, 'utf-8');
  } catch {
    throw new ActiveLoadError(`${manifestPath}: dataset manifest missing for active pointer ${activeKey}`);
  }

  let manifest: DatasetManifest;
  try {
    manifest = DatasetManifestSchema.parse(JSON.parse(manifestRaw));
  } catch (err) {
    throw new ActiveLoadError(`${manifestPath}: ${(err as Error).message}`);
  }

  return { pointer, manifest, activeKey };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/active.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest/active.ts tests/ingest/active.test.ts tests/ingest/fixtures/active/
git commit -m "feat(ingest): load active pointer and referenced dataset manifest"
```

---

## Task 8: Aggregation — grouping by (model_key, adapter)

**Files:**
- Create: `scripts/ingest/aggregate.ts`
- Create: `tests/ingest/aggregate-grouping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/aggregate-grouping.test.ts
// ABOUTME: Exercises grouping of trials by (model_key, adapter) after registry resolution.
// ABOUTME: Asserts that Bedrock-prefixed and raw provider IDs collapse into the same group.
import { describe, it, expect } from 'vitest';
import { groupTrials } from '@/scripts/ingest/aggregate';
import type { ModelEntry, TrialRecord } from '@/lib/aec-bench/contracts';

const registry: ModelEntry[] = [
  { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic' },
  { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai' },
];

function makeTrial(overrides: Partial<TrialRecord>): TrialRecord {
  return {
    trial_id: 'x',
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: '2026-04-10T12:00:00Z',
    task: { task_id: 't', task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'claude-sonnet-4-6',
      adapter_revision: '1.0.0',
      configuration: {},
    },
    evaluation: {
      reward: 0.5,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds: 1, agent_seconds: 1 },
    cost: null,
    completeness: 'complete',
    ...overrides,
  };
}

describe('groupTrials', () => {
  it('groups raw and Bedrock-prefixed model strings together', () => {
    const trials = [
      makeTrial({ trial_id: 'a', agent: { ...makeTrial({}).agent, model: 'claude-sonnet-4-6' } }),
      makeTrial({ trial_id: 'b', agent: { ...makeTrial({}).agent, model: 'au.anthropic.claude-sonnet-4-6' } }),
    ];
    const groups = groupTrials(trials, registry);
    expect(groups.size).toBe(1);
    expect([...groups.keys()][0]).toBe('claude-sonnet-4/tool_loop');
  });

  it('splits the same model across different adapters', () => {
    const trials = [
      makeTrial({ trial_id: 'a', agent: { ...makeTrial({}).agent, adapter: 'tool_loop' } }),
      makeTrial({ trial_id: 'b', agent: { ...makeTrial({}).agent, adapter: 'rlm' } }),
    ];
    const groups = groupTrials(trials, registry);
    expect(groups.size).toBe(2);
  });

  it('splits different models into different groups', () => {
    const trials = [
      makeTrial({ trial_id: 'a', agent: { ...makeTrial({}).agent, model: 'claude-sonnet-4-6' } }),
      makeTrial({ trial_id: 'b', agent: { ...makeTrial({}).agent, model: 'gpt-4.1' } }),
    ];
    const groups = groupTrials(trials, registry);
    expect(groups.size).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/aggregate-grouping.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement grouping**

```ts
// scripts/ingest/aggregate.ts
// ABOUTME: Aggregation — grouping, reward mean+CI, per-discipline, cost rollup, ranking, delta.
// ABOUTME: Functions are pure. Orchestrator calls them in sequence.
import type {
  LeaderboardEntry,
  ModelEntry,
  TrialRecord,
} from '@/lib/aec-bench/contracts';
import { modelKey, resolveModel } from '@/scripts/ingest/registry';

export interface TrialGroup {
  key: string;          // model_key/adapter
  entry: ModelEntry;    // resolved registry entry
  adapter: string;
  trials: TrialRecord[];
}

export function groupTrials(trials: TrialRecord[], registry: ModelEntry[]): Map<string, TrialGroup> {
  const groups = new Map<string, TrialGroup>();
  for (const trial of trials) {
    const entry = resolveModel(trial.agent.model, registry);
    const adapter = trial.agent.adapter;
    const key = modelKey(entry, adapter);
    const existing = groups.get(key);
    if (existing) {
      existing.trials.push(trial);
    } else {
      groups.set(key, { key, entry, adapter, trials: [trial] });
    }
  }
  return groups;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/aggregate-grouping.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest/aggregate.ts tests/ingest/aggregate-grouping.test.ts
git commit -m "feat(ingest): group trials by (model_key, adapter) via registry"
```

---

## Task 9: Aggregation — reward mean and bootstrap CI

**Files:**
- Modify: `scripts/ingest/aggregate.ts`
- Create: `tests/ingest/aggregate-reward.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/aggregate-reward.test.ts
// ABOUTME: Exercises reward mean + bootstrap CI computation per trial group.
// ABOUTME: CI is null for reps < 3; deterministic seeding produces reproducible intervals.
import { describe, it, expect } from 'vitest';
import { computeReward } from '@/scripts/ingest/aggregate';
import type { TrialRecord } from '@/lib/aec-bench/contracts';

function makeTrial(trial_id: string, reward: number, completeness: 'complete' | 'partial' = 'complete'): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: '2026-04-10T12:00:00Z',
    task: { task_id: 't', task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'claude-sonnet-4-6',
      adapter_revision: '1.0.0',
      configuration: {},
    },
    evaluation: {
      reward,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds: 1, agent_seconds: 1 },
    cost: null,
    completeness,
  };
}

describe('computeReward', () => {
  it('averages complete trials only', () => {
    const trials = [makeTrial('a', 1.0), makeTrial('b', 0.5), makeTrial('c', 0.0, 'partial')];
    const { mean, complete, total } = computeReward(trials);
    expect(mean).toBeCloseTo(0.75, 5);
    expect(complete).toBe(2);
    expect(total).toBe(3);
  });

  it('returns mean=0 when no complete trials exist', () => {
    const trials = [makeTrial('a', 0.9, 'partial')];
    const { mean, complete } = computeReward(trials);
    expect(mean).toBe(0);
    expect(complete).toBe(0);
  });

  it('returns ci=null when complete_trials < 3', () => {
    const trials = [makeTrial('a', 0.8), makeTrial('b', 0.6)];
    const { ci } = computeReward(trials);
    expect(ci).toBeNull();
  });

  it('returns a CI when complete_trials >= 3, deterministic across runs', () => {
    const trials = [
      makeTrial('a', 0.8),
      makeTrial('b', 0.7),
      makeTrial('c', 0.9),
      makeTrial('d', 0.75),
    ];
    const first = computeReward(trials).ci;
    const second = computeReward(trials).ci;
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    const [lo, hi] = first!;
    expect(lo).toBeLessThanOrEqual(hi);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/aggregate-reward.test.ts`
Expected: FAIL — `computeReward` not exported.

- [ ] **Step 3: Implement reward + bootstrap CI**

Append to `scripts/ingest/aggregate.ts`:

```ts
import seedrandom from 'seedrandom';

export interface RewardStats {
  mean: number;
  ci: [number, number] | null;
  complete: number;
  total: number;
}

const BOOTSTRAP_RESAMPLES = 10_000;

export function computeReward(trials: TrialRecord[]): RewardStats {
  const complete = trials.filter(isComplete);
  const values = complete.map((t) => t.evaluation.reward);
  const mean = values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

  let ci: [number, number] | null = null;
  if (complete.length >= 3) {
    const seed = seedOf(complete.map((t) => t.trial_id));
    const rng = seedrandom(seed);
    const samples = new Array<number>(BOOTSTRAP_RESAMPLES);
    for (let i = 0; i < BOOTSTRAP_RESAMPLES; i++) {
      let sum = 0;
      for (let j = 0; j < values.length; j++) {
        sum += values[Math.floor(rng() * values.length)];
      }
      samples[i] = sum / values.length;
    }
    samples.sort((a, b) => a - b);
    const lo = samples[Math.floor(0.025 * BOOTSTRAP_RESAMPLES)];
    const hi = samples[Math.floor(0.975 * BOOTSTRAP_RESAMPLES)];
    ci = [round2(lo), round2(hi)];
  }

  return { mean: round2(mean), ci, complete: complete.length, total: trials.length };
}

function isComplete(t: TrialRecord): boolean {
  return t.completeness === 'complete' && t.evaluation.validity.verifier_completed;
}

function seedOf(trialIds: string[]): string {
  return [...trialIds].sort().join('|');
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/aggregate-reward.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest/aggregate.ts tests/ingest/aggregate-reward.test.ts
git commit -m "feat(ingest): reward mean + deterministic bootstrap CI"
```

---

## Task 10: Aggregation — per-discipline breakdown

**Files:**
- Modify: `scripts/ingest/aggregate.ts`
- Create: `tests/ingest/aggregate-discipline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/aggregate-discipline.test.ts
// ABOUTME: Per-discipline reward breakdown via join against the dataset manifest.
// ABOUTME: Missing disciplines (submitter didn't run them) do not appear in the output.
import { describe, it, expect } from 'vitest';
import { computePerDiscipline } from '@/scripts/ingest/aggregate';
import type { DatasetManifest, TrialRecord } from '@/lib/aec-bench/contracts';

const manifest: DatasetManifest = {
  name: 'aec-bench',
  version: '0.4.1',
  content_hash: 'h',
  description: { summary: 's', task_count: 3 },
  tasks: [
    { task_id: 'civil/a', domain: 'civil', difficulty: 'easy', tags: [] },
    { task_id: 'electrical/b', domain: 'electrical', difficulty: 'easy', tags: [] },
    { task_id: 'ground/c', domain: 'ground', difficulty: 'easy', tags: [] },
  ],
};

function makeTrial(trial_id: string, task_id: string, reward: number): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: '2026-04-10T12:00:00Z',
    task: { task_id, task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'x',
      adapter_revision: null,
      configuration: {},
    },
    evaluation: {
      reward,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds: 1, agent_seconds: 1 },
    cost: null,
    completeness: 'complete',
  };
}

describe('computePerDiscipline', () => {
  it('returns mean reward per domain for trials that ran', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8),
      makeTrial('b', 'electrical/b', 0.6),
    ];
    const result = computePerDiscipline(trials, manifest);
    expect(result).toEqual({ civil: 0.8, electrical: 0.6 });
    expect(result).not.toHaveProperty('ground');
  });

  it('averages multiple trials within the same domain', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8),
      makeTrial('b', 'civil/a', 0.4),
    ];
    const result = computePerDiscipline(trials, manifest);
    expect(result.civil).toBeCloseTo(0.6, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/aggregate-discipline.test.ts`
Expected: FAIL — function missing.

- [ ] **Step 3: Implement per-discipline breakdown**

Append to `scripts/ingest/aggregate.ts`:

```ts
import type { DatasetManifest, Domain } from '@/lib/aec-bench/contracts';

export type PerDiscipline = Partial<Record<Domain, number>>;

export function computePerDiscipline(trials: TrialRecord[], manifest: DatasetManifest): PerDiscipline {
  const taskDomain = new Map(manifest.tasks.map((t) => [t.task_id, t.domain]));
  const buckets = new Map<Domain, number[]>();
  for (const trial of trials.filter(isComplete)) {
    const domain = taskDomain.get(trial.task.task_id);
    if (!domain) continue;
    const arr = buckets.get(domain) ?? [];
    arr.push(trial.evaluation.reward);
    buckets.set(domain, arr);
  }
  const out: PerDiscipline = {};
  for (const [domain, values] of buckets) {
    out[domain] = round2(values.reduce((a, b) => a + b, 0) / values.length);
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/aggregate-discipline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest/aggregate.ts tests/ingest/aggregate-discipline.test.ts
git commit -m "feat(ingest): per-discipline reward breakdown"
```

---

## Task 11: Aggregation — cost, tokens, duration rollup

**Files:**
- Modify: `scripts/ingest/aggregate.ts`
- Create: `tests/ingest/aggregate-cost.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/aggregate-cost.test.ts
// ABOUTME: Cost/tokens/duration rollup — null trials contribute to reward but not cost.
// ABOUTME: If all trials have null cost, mean_cost_usd and mean_tokens are null (prevents fake-cheap ranks).
import { describe, it, expect } from 'vitest';
import { computeCostAndTiming } from '@/scripts/ingest/aggregate';
import type { TrialRecord } from '@/lib/aec-bench/contracts';

function makeTrial(
  trial_id: string,
  cost: TrialRecord['cost'],
  total_seconds = 10,
): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: '2026-04-10T12:00:00Z',
    task: { task_id: 't', task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'x',
      adapter_revision: null,
      configuration: {},
    },
    evaluation: {
      reward: 0.5,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds, agent_seconds: total_seconds * 0.8 },
    cost,
    completeness: 'complete',
  };
}

const fullCost = (usd: number, inTokens = 50000, outTokens = 10000) => ({
  tokens_in: inTokens,
  tokens_out: outTokens,
  cache_read_tokens: null,
  cache_write_tokens: null,
  estimated_cost_usd: usd,
});

describe('computeCostAndTiming', () => {
  it('averages cost per task across all trials that have cost data', () => {
    const trials = [makeTrial('a', fullCost(0.3)), makeTrial('b', fullCost(0.4))];
    const { mean_cost_usd, total_cost_usd } = computeCostAndTiming(trials);
    expect(mean_cost_usd).toBeCloseTo(0.35, 5);
    expect(total_cost_usd).toBeCloseTo(0.7, 5);
  });

  it('ignores null-cost trials when averaging', () => {
    const trials = [makeTrial('a', fullCost(0.3)), makeTrial('b', null)];
    const { mean_cost_usd } = computeCostAndTiming(trials);
    expect(mean_cost_usd).toBeCloseTo(0.3, 5);
  });

  it('returns null for cost when no trial has cost data', () => {
    const trials = [makeTrial('a', null), makeTrial('b', null)];
    const { mean_cost_usd, total_cost_usd, mean_tokens } = computeCostAndTiming(trials);
    expect(mean_cost_usd).toBeNull();
    expect(total_cost_usd).toBeNull();
    expect(mean_tokens).toBeNull();
  });

  it('averages tokens_in + tokens_out per trial', () => {
    const trials = [makeTrial('a', fullCost(0.3, 40000, 8000))];
    const { mean_tokens } = computeCostAndTiming(trials);
    expect(mean_tokens).toBe(48000);
  });

  it('averages total_seconds across all trials (including null cost)', () => {
    const trials = [makeTrial('a', null, 10), makeTrial('b', null, 20)];
    const { mean_duration_seconds } = computeCostAndTiming(trials);
    expect(mean_duration_seconds).toBe(15);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/aggregate-cost.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement rollup**

Append to `scripts/ingest/aggregate.ts`:

```ts
export interface CostTiming {
  mean_cost_usd: number | null;
  total_cost_usd: number | null;
  mean_tokens: number | null;
  mean_duration_seconds: number | null;
}

export function computeCostAndTiming(trials: TrialRecord[]): CostTiming {
  const withCost = trials.filter((t) => t.cost !== null) as Array<
    TrialRecord & { cost: NonNullable<TrialRecord['cost']> }
  >;

  const costs = withCost
    .map((t) => t.cost.estimated_cost_usd)
    .filter((v): v is number => v !== null);
  const tokens = withCost
    .map((t) => {
      const tin = t.cost.tokens_in ?? 0;
      const tout = t.cost.tokens_out ?? 0;
      return t.cost.tokens_in === null && t.cost.tokens_out === null ? null : tin + tout;
    })
    .filter((v): v is number => v !== null);

  const mean = (xs: number[]): number | null =>
    xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
  const total = (xs: number[]): number | null =>
    xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0);

  return {
    mean_cost_usd: mean(costs) !== null ? round4(mean(costs)!) : null,
    total_cost_usd: total(costs) !== null ? round4(total(costs)!) : null,
    mean_tokens: mean(tokens) !== null ? Math.round(mean(tokens)!) : null,
    mean_duration_seconds:
      trials.length === 0
        ? null
        : round2(trials.reduce((a, b) => a + b.timing.total_seconds, 0) / trials.length),
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/aggregate-cost.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest/aggregate.ts tests/ingest/aggregate-cost.test.ts
git commit -m "feat(ingest): cost, tokens, and duration rollup"
```

---

## Task 12: Aggregation — ranking and delta

**Files:**
- Modify: `scripts/ingest/aggregate.ts`
- Create: `tests/ingest/aggregate-rank.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/aggregate-rank.test.ts
// ABOUTME: Ranking by reward desc, cost asc tiebreak, complete_trials desc second tiebreak.
// ABOUTME: Delta is computed against a previous snapshot; new rows produce delta=null.
import { describe, it, expect } from 'vitest';
import { rankEntries, applyDelta } from '@/scripts/ingest/aggregate';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';

function makeEntry(over: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    rank: 0,
    model_key: 'm/tool_loop',
    model_display: 'M',
    provider: 'anthropic',
    adapter: 'tool_loop',
    reward: 0.5,
    reward_ci: null,
    per_discipline: {},
    trials: 1,
    complete_trials: 1,
    repetitions: 1,
    mean_cost_usd: null,
    total_cost_usd: null,
    mean_tokens: null,
    mean_duration_seconds: null,
    dataset: 'aec-bench@0.4.1',
    last_submission: '2026-04-10T12:00:00Z',
    submission_count: 1,
    delta_vs_previous: null,
    ...over,
  };
}

describe('rankEntries', () => {
  it('sorts by reward desc primary', () => {
    const input = [
      makeEntry({ model_key: 'a/t', reward: 0.5 }),
      makeEntry({ model_key: 'b/t', reward: 0.7 }),
      makeEntry({ model_key: 'c/t', reward: 0.6 }),
    ];
    const ranked = rankEntries(input);
    expect(ranked.map((e) => e.model_key)).toEqual(['b/t', 'c/t', 'a/t']);
    expect(ranked.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it('tiebreaks by mean_cost_usd asc, nulls last', () => {
    const input = [
      makeEntry({ model_key: 'a/t', reward: 0.7, mean_cost_usd: 0.5 }),
      makeEntry({ model_key: 'b/t', reward: 0.7, mean_cost_usd: 0.3 }),
      makeEntry({ model_key: 'c/t', reward: 0.7, mean_cost_usd: null }),
    ];
    const ranked = rankEntries(input);
    expect(ranked.map((e) => e.model_key)).toEqual(['b/t', 'a/t', 'c/t']);
  });

  it('tiebreaks second on complete_trials desc', () => {
    const input = [
      makeEntry({ model_key: 'a/t', reward: 0.7, mean_cost_usd: 0.3, complete_trials: 2 }),
      makeEntry({ model_key: 'b/t', reward: 0.7, mean_cost_usd: 0.3, complete_trials: 5 }),
    ];
    const ranked = rankEntries(input);
    expect(ranked[0].model_key).toBe('b/t');
  });
});

describe('applyDelta', () => {
  it('sets delta_vs_previous to the difference for matched rows', () => {
    const current = [makeEntry({ model_key: 'a/t', reward: 0.7 })];
    const previous = [{ model_key: 'a/t', reward: 0.65 }];
    const out = applyDelta(current, previous);
    expect(out[0].delta_vs_previous).toBeCloseTo(0.05, 5);
  });

  it('sets delta=null for new rows not present previously', () => {
    const current = [makeEntry({ model_key: 'a/t', reward: 0.7 })];
    const previous: Array<{ model_key: string; reward: number }> = [];
    const out = applyDelta(current, previous);
    expect(out[0].delta_vs_previous).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/aggregate-rank.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement ranking and delta**

Append to `scripts/ingest/aggregate.ts`:

```ts
export function rankEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.reward !== a.reward) return b.reward - a.reward;
    const aCost = a.mean_cost_usd ?? Number.POSITIVE_INFINITY;
    const bCost = b.mean_cost_usd ?? Number.POSITIVE_INFINITY;
    if (aCost !== bCost) return aCost - bCost;
    return b.complete_trials - a.complete_trials;
  });
  return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
}

export interface PreviousRow {
  model_key: string;
  reward: number;
}

export function applyDelta(
  current: LeaderboardEntry[],
  previous: PreviousRow[],
): LeaderboardEntry[] {
  const prev = new Map(previous.map((p) => [p.model_key, p.reward]));
  return current.map((e) => {
    const prior = prev.get(e.model_key);
    if (prior === undefined) {
      return { ...e, delta_vs_previous: null };
    }
    return { ...e, delta_vs_previous: round2(e.reward - prior) };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/aggregate-rank.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest/aggregate.ts tests/ingest/aggregate-rank.test.ts
git commit -m "feat(ingest): rank entries with tiebreakers and compute delta"
```

---

## Task 13: Aggregation — assemble full LeaderboardEntry

**Files:**
- Modify: `scripts/ingest/aggregate.ts`
- Create: `tests/ingest/aggregate-entry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/aggregate-entry.test.ts
// ABOUTME: End-to-end assembly of a single LeaderboardEntry from a TrialGroup + context.
// ABOUTME: Exercises the full join of reward, discipline, cost, and metadata.
import { describe, it, expect } from 'vitest';
import { buildEntry } from '@/scripts/ingest/aggregate';
import type { DatasetManifest, ModelEntry, TrialRecord } from '@/lib/aec-bench/contracts';

const entry: ModelEntry = {
  match: 'claude-sonnet-4',
  display: 'Claude Sonnet 4',
  provider: 'anthropic',
  family: 'Claude 4',
};
const manifest: DatasetManifest = {
  name: 'aec-bench',
  version: '0.4.1',
  content_hash: 'h',
  description: { summary: 's', task_count: 2 },
  tasks: [
    { task_id: 'civil/a', domain: 'civil', difficulty: 'easy', tags: [] },
    { task_id: 'electrical/b', domain: 'electrical', difficulty: 'easy', tags: [] },
  ],
};

function makeTrial(trial_id: string, task_id: string, reward: number, ts: string): TrialRecord {
  return {
    trial_id,
    experiment_id: 'e',
    dataset_id: 'aec-bench@0.4.1',
    timestamp: ts,
    task: { task_id, task_revision: 'r' },
    agent: {
      adapter: 'tool_loop',
      model: 'claude-sonnet-4-6',
      adapter_revision: '1.0.0',
      configuration: {},
    },
    evaluation: {
      reward,
      validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
    },
    timing: { total_seconds: 10, agent_seconds: 8 },
    cost: {
      tokens_in: 50000,
      tokens_out: 10000,
      cache_read_tokens: null,
      cache_write_tokens: null,
      estimated_cost_usd: 0.3,
    },
    completeness: 'complete',
  };
}

describe('buildEntry', () => {
  it('assembles a LeaderboardEntry from trials + context', () => {
    const trials = [
      makeTrial('a', 'civil/a', 0.8, '2026-04-10T12:00:00Z'),
      makeTrial('b', 'electrical/b', 0.6, '2026-04-11T12:00:00Z'),
    ];
    const result = buildEntry({
      group: { key: 'claude-sonnet-4/tool_loop', entry, adapter: 'tool_loop', trials },
      manifest,
      activeKey: 'aec-bench@0.4.1',
      submissionCount: 1,
    });

    expect(result.model_key).toBe('claude-sonnet-4/tool_loop');
    expect(result.model_display).toBe('Claude Sonnet 4');
    expect(result.provider).toBe('anthropic');
    expect(result.adapter).toBe('tool_loop');
    expect(result.reward).toBeCloseTo(0.7, 5);
    expect(result.per_discipline).toEqual({ civil: 0.8, electrical: 0.6 });
    expect(result.trials).toBe(2);
    expect(result.complete_trials).toBe(2);
    expect(result.mean_cost_usd).toBeCloseTo(0.3, 5);
    expect(result.dataset).toBe('aec-bench@0.4.1');
    expect(result.last_submission).toBe('2026-04-11T12:00:00Z');
    expect(result.submission_count).toBe(1);
    expect(result.rank).toBe(0); // rank assigned later by rankEntries
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/aggregate-entry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the assembly function**

Append to `scripts/ingest/aggregate.ts`:

```ts
export interface BuildEntryContext {
  group: TrialGroup;
  manifest: DatasetManifest;
  activeKey: string;
  submissionCount: number;
}

export function buildEntry(ctx: BuildEntryContext): LeaderboardEntry {
  const { group, manifest, activeKey, submissionCount } = ctx;
  const reward = computeReward(group.trials);
  const perDiscipline = computePerDiscipline(group.trials, manifest);
  const costTiming = computeCostAndTiming(group.trials);

  const lastSubmission = group.trials
    .map((t) => t.timestamp)
    .sort()
    .at(-1)!;

  const uniqueTasks = new Set(group.trials.map((t) => t.task.task_id));
  const repetitions =
    uniqueTasks.size === 0 ? 0 : Math.floor(reward.complete / uniqueTasks.size);

  return {
    rank: 0,
    model_key: group.key,
    model_display: group.entry.display,
    provider: group.entry.provider,
    adapter: group.adapter,
    reward: reward.mean,
    reward_ci: reward.ci,
    per_discipline: perDiscipline,
    trials: reward.total,
    complete_trials: reward.complete,
    repetitions,
    mean_cost_usd: costTiming.mean_cost_usd,
    total_cost_usd: costTiming.total_cost_usd,
    mean_tokens: costTiming.mean_tokens,
    mean_duration_seconds: costTiming.mean_duration_seconds,
    dataset: activeKey,
    last_submission: lastSubmission,
    submission_count: submissionCount,
    delta_vs_previous: null,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/aggregate-entry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest/aggregate.ts tests/ingest/aggregate-entry.test.ts
git commit -m "feat(ingest): assemble LeaderboardEntry from TrialGroup + context"
```

---

## Task 14: Snapshot loading for delta

**Files:**
- Create: `scripts/ingest/snapshot.ts`
- Create: `tests/ingest/snapshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/snapshot.test.ts
// ABOUTME: Loads the most-recent committed leaderboard snapshot for delta computation.
// ABOUTME: Absence is not an error — returns an empty previous set.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { loadPreviousSnapshot } from '@/scripts/ingest/snapshot';

const WITH_ROOT = resolve(__dirname, 'fixtures/snapshot/with');
const WITHOUT_ROOT = resolve(__dirname, 'fixtures/snapshot/without');

describe('loadPreviousSnapshot', () => {
  it('returns the most-recent snapshot when multiple exist', async () => {
    const rows = await loadPreviousSnapshot(WITH_ROOT);
    expect(rows).toContainEqual({ model_key: 'claude-sonnet-4/tool_loop', reward: 0.7 });
  });

  it('returns [] when no snapshots are committed', async () => {
    const rows = await loadPreviousSnapshot(WITHOUT_ROOT);
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Create fixtures**

```json
// tests/ingest/fixtures/snapshot/with/results/snapshots/leaderboard-2026-04-10.json
{
  "generated_at": "2026-04-10T12:00:00Z",
  "entries": [
    { "model_key": "claude-sonnet-4/tool_loop", "reward": 0.7 },
    { "model_key": "gpt-4.1/tool_loop", "reward": 0.6 }
  ]
}
```

```json
// tests/ingest/fixtures/snapshot/with/results/snapshots/leaderboard-2026-04-12.json
{
  "generated_at": "2026-04-12T12:00:00Z",
  "entries": [
    { "model_key": "claude-sonnet-4/tool_loop", "reward": 0.7 }
  ]
}
```

Create an empty `tests/ingest/fixtures/snapshot/without/results/` directory (no snapshots subdir).

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test tests/ingest/snapshot.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement snapshot loader**

```ts
// scripts/ingest/snapshot.ts
// ABOUTME: Loads the most-recent committed leaderboard snapshot for delta computation.
// ABOUTME: Only the (model_key, reward) pairs are needed; the rest of the artefact is ignored.
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { PreviousRow } from '@/scripts/ingest/aggregate';

export async function loadPreviousSnapshot(projectRoot: string): Promise<PreviousRow[]> {
  const dir = resolve(projectRoot, 'results/snapshots');
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const snapshots = files.filter((f) => f.startsWith('leaderboard-') && f.endsWith('.json')).sort();
  if (snapshots.length === 0) return [];
  const latest = snapshots[snapshots.length - 1];
  const raw = await readFile(join(dir, latest), 'utf-8');
  const parsed = JSON.parse(raw) as { entries: Array<{ model_key: string; reward: number }> };
  return parsed.entries.map(({ model_key, reward }) => ({ model_key, reward }));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/snapshot.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest/snapshot.ts tests/ingest/snapshot.test.ts tests/ingest/fixtures/snapshot/
git commit -m "feat(ingest): load previous leaderboard snapshot for delta"
```

---

## Task 15: Emit artefacts to public/data/

**Files:**
- Create: `scripts/ingest/emit.ts`
- Create: `tests/ingest/emit.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Update .gitignore**

Append to `.gitignore`:

```
# ingest build output
/public/data/
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/ingest/emit.test.ts
// ABOUTME: Writes leaderboard.json, per-discipline slices, and per-model stubs to public/data.
// ABOUTME: Output directory is created fresh on each build; old files are removed.
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emitArtefacts } from '@/scripts/ingest/emit';
import type { LeaderboardArtefact } from '@/lib/aec-bench/contracts';

let tempRoot: string;

beforeEach(async () => {
  tempRoot = await mkdtemp(join(tmpdir(), 'ingest-emit-'));
});

function makeArtefact(): LeaderboardArtefact {
  return {
    generated_at: '2026-04-18T12:00:00Z',
    dataset: {
      name: 'aec-bench',
      version: '0.4.1',
      content_hash: 'h',
      description: { summary: 's', task_count: 1 },
      tasks: [{ task_id: 'civil/a', domain: 'civil', difficulty: 'easy', tags: [] }],
    },
    entries: [
      {
        rank: 1,
        model_key: 'claude-sonnet-4/tool_loop',
        model_display: 'Claude Sonnet 4',
        provider: 'anthropic',
        adapter: 'tool_loop',
        reward: 0.8,
        reward_ci: null,
        per_discipline: { civil: 0.8 },
        trials: 1,
        complete_trials: 1,
        repetitions: 1,
        mean_cost_usd: 0.3,
        total_cost_usd: 0.3,
        mean_tokens: 60000,
        mean_duration_seconds: 10,
        dataset: 'aec-bench@0.4.1',
        last_submission: '2026-04-10T12:00:00Z',
        submission_count: 1,
        delta_vs_previous: null,
      },
    ],
    is_mock: true,
    run_status: {
      tasks: 1,
      models: 1,
      adapters: 1,
      disciplines: 1,
      last_submission: '2026-04-10T12:00:00Z',
      generated_at: '2026-04-18T12:00:00Z',
    },
  };
}

describe('emitArtefacts', () => {
  it('writes leaderboard.json with the full artefact', async () => {
    await emitArtefacts(tempRoot, makeArtefact());
    const raw = await readFile(join(tempRoot, 'public/data/leaderboard.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.is_mock).toBe(true);
  });

  it('writes a per-discipline slice for each domain present', async () => {
    await emitArtefacts(tempRoot, makeArtefact());
    const raw = await readFile(join(tempRoot, 'public/data/disciplines/civil.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].model_key).toBe('claude-sonnet-4/tool_loop');
  });

  it('writes a per-model stub for each entry', async () => {
    await emitArtefacts(tempRoot, makeArtefact());
    const raw = await readFile(
      join(tempRoot, 'public/data/models/claude-sonnet-4-tool_loop.json'),
      'utf-8',
    );
    const parsed = JSON.parse(raw);
    expect(parsed.model_display).toBe('Claude Sonnet 4');
  });

  it('clears stale public/data/ contents before writing', async () => {
    const stalePath = join(tempRoot, 'public/data/stale.json');
    await mkdir(join(tempRoot, 'public/data'), { recursive: true });
    await (await import('node:fs/promises')).writeFile(stalePath, '{}');
    await emitArtefacts(tempRoot, makeArtefact());
    await expect(readFile(stalePath)).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test tests/ingest/emit.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement the emit layer**

```ts
// scripts/ingest/emit.ts
// ABOUTME: Writes leaderboard.json, per-discipline slices, and per-model stubs to public/data.
// ABOUTME: Slices re-rank entries within the discipline; stubs are one LeaderboardEntry per file.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  DOMAINS,
  type Domain,
  type LeaderboardArtefact,
  type LeaderboardEntry,
} from '@/lib/aec-bench/contracts';
import { rankEntries } from '@/scripts/ingest/aggregate';

export async function emitArtefacts(projectRoot: string, artefact: LeaderboardArtefact): Promise<void> {
  const outDir = resolve(projectRoot, 'public/data');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await writeFile(join(outDir, 'leaderboard.json'), JSON.stringify(artefact, null, 2));

  await mkdir(join(outDir, 'disciplines'), { recursive: true });
  for (const domain of DOMAINS) {
    const slice = buildSlice(artefact, domain);
    if (slice.entries.length === 0) continue;
    await writeFile(join(outDir, 'disciplines', `${domain}.json`), JSON.stringify(slice, null, 2));
  }

  await mkdir(join(outDir, 'models'), { recursive: true });
  for (const entry of artefact.entries) {
    const fileKey = entry.model_key.replace('/', '-');
    await writeFile(
      join(outDir, 'models', `${fileKey}.json`),
      JSON.stringify(entry, null, 2),
    );
  }
}

function buildSlice(artefact: LeaderboardArtefact, domain: Domain): LeaderboardArtefact {
  const filtered: LeaderboardEntry[] = artefact.entries
    .filter((e) => e.per_discipline[domain] !== undefined)
    .map((e) => ({
      ...e,
      reward: e.per_discipline[domain] ?? e.reward,
    }));
  return {
    ...artefact,
    entries: rankEntries(filtered),
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/emit.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest/emit.ts tests/ingest/emit.test.ts .gitignore
git commit -m "feat(ingest): emit leaderboard.json + discipline + model artefacts"
```

---

## Task 16: Orchestrator

**Files:**
- Create: `scripts/ingest/index.ts`
- Create: `tests/ingest/orchestrator.test.ts`
- Create: Fixture tree under `tests/ingest/fixtures/e2e/`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/orchestrator.test.ts
// ABOUTME: End-to-end ingest from a committed fixture tree to emitted artefacts.
// ABOUTME: Exercises discovery, validation, aggregation, ranking, delta, emit in one pass.
import { describe, it, expect, beforeEach } from 'vitest';
import { cp, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runIngest } from '@/scripts/ingest/index';

const FIXTURE_SRC = resolve(__dirname, 'fixtures/e2e');
let tempRoot: string;

beforeEach(async () => {
  tempRoot = await mkdtemp(join(tmpdir(), 'ingest-e2e-'));
  await cp(FIXTURE_SRC, tempRoot, { recursive: true });
});

describe('runIngest', () => {
  it('produces a leaderboard.json matching the expected snapshot', async () => {
    await runIngest({ projectRoot: tempRoot });
    const raw = await readFile(join(tempRoot, 'public/data/leaderboard.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.is_mock).toBe(false);
    expect(parsed.entries[0].rank).toBe(1);
    expect(parsed.entries[1].rank).toBe(2);
    expect(parsed.run_status.models).toBe(2);
  });

  it('sets is_mock=true when any experiment flags mock', async () => {
    // Patch one submission to mock: true
    const subPath = join(tempRoot, 'results/experiments/exp-a/submission.yml');
    const raw = await readFile(subPath, 'utf-8');
    await (await import('node:fs/promises')).writeFile(subPath, raw + '\nmock: true\n');
    await runIngest({ projectRoot: tempRoot });
    const parsed = JSON.parse(
      await readFile(join(tempRoot, 'public/data/leaderboard.json'), 'utf-8'),
    );
    expect(parsed.is_mock).toBe(true);
  });
});
```

- [ ] **Step 2: Create the e2e fixture**

Build under `tests/ingest/fixtures/e2e/`:

```json
// tests/ingest/fixtures/e2e/results/active.json
{ "benchmark": "aec-bench", "version": "0.4.1" }
```

```json
// tests/ingest/fixtures/e2e/results/datasets/aec-bench@0.4.1/manifest.json
{
  "name": "aec-bench",
  "version": "0.4.1",
  "content_hash": "h",
  "description": { "summary": "s", "task_count": 2 },
  "tasks": [
    { "task_id": "civil/a", "domain": "civil", "difficulty": "easy", "tags": [] },
    { "task_id": "electrical/b", "domain": "electrical", "difficulty": "easy", "tags": [] }
  ]
}
```

```yaml
# tests/ingest/fixtures/e2e/results/experiments/exp-a/submission.yml
experiment_id: exp-a
dataset: aec-bench@0.4.1
submitter:
  github: tester
model_claim:
  library_model: claude-sonnet-4-6
submitted_at: 2026-04-10T12:00:00Z
```

```json
// tests/ingest/fixtures/e2e/results/experiments/exp-a/trials/t1.json
{
  "trial_id": "t1",
  "experiment_id": "exp-a",
  "dataset_id": "aec-bench@0.4.1",
  "timestamp": "2026-04-10T12:00:00Z",
  "task": { "task_id": "civil/a", "task_revision": "r" },
  "agent": {
    "adapter": "tool_loop",
    "model": "claude-sonnet-4-6",
    "adapter_revision": "1.0.0",
    "configuration": {}
  },
  "evaluation": {
    "reward": 0.8,
    "validity": { "output_parseable": true, "schema_valid": true, "verifier_completed": true }
  },
  "timing": { "total_seconds": 10, "agent_seconds": 8 },
  "cost": {
    "tokens_in": 50000, "tokens_out": 10000,
    "cache_read_tokens": null, "cache_write_tokens": null,
    "estimated_cost_usd": 0.3
  },
  "completeness": "complete"
}
```

Create a sibling `exp-b/` with matching `submission.yml` (library_model: `gpt-4.1`) and a trial at `electrical/b` with reward 0.6.

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test tests/ingest/orchestrator.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement the orchestrator**

```ts
// scripts/ingest/index.ts
// ABOUTME: Orchestrates the full ingest pipeline end-to-end.
// ABOUTME: Called from prebuild; any failure fails the build with a pointed error.
import { discoverExperiments } from '@/scripts/ingest/discover';
import { validateExperiment, type ValidatedExperiment } from '@/scripts/ingest/validate';
import { loadActive } from '@/scripts/ingest/active';
import { loadRegistry } from '@/scripts/ingest/registry';
import { loadSnapshot, checkParity } from '@/scripts/ingest/pricing-parity';
import { loadPreviousSnapshot } from '@/scripts/ingest/snapshot';
import { applyDelta, buildEntry, groupTrials, rankEntries } from '@/scripts/ingest/aggregate';
import { emitArtefacts } from '@/scripts/ingest/emit';
import { DOMAINS, type LeaderboardArtefact, type TrialRecord } from '@/lib/aec-bench/contracts';

export interface RunOptions {
  projectRoot: string;
}

export async function runIngest(opts: RunOptions): Promise<LeaderboardArtefact> {
  const { projectRoot } = opts;

  // Load active context + registry + parity check
  const { manifest, activeKey } = await loadActive(projectRoot);
  const registry = await loadRegistry();
  const snapshot = await loadSnapshot();
  checkParity(snapshot, registry);

  // Discover + validate experiments
  const discovered = await discoverExperiments(projectRoot);
  const validated: ValidatedExperiment[] = [];
  for (const exp of discovered) {
    validated.push(await validateExperiment(exp, manifest, activeKey));
  }

  // Gather trials, count submissions per (model, adapter)
  const allTrials: TrialRecord[] = validated.flatMap((v) => v.trials);
  const submissionCounts = new Map<string, number>();
  for (const v of validated) {
    for (const trial of v.trials) {
      const entry = registry.find((r) => trial.agent.model.toLowerCase().includes(r.match.toLowerCase()));
      if (!entry) continue;
      const key = `${entry.display}/${trial.agent.adapter}`;
      submissionCounts.set(key, (submissionCounts.get(key) ?? 0) + 1);
    }
  }

  // Group + build entries
  const groups = groupTrials(allTrials, registry);
  const entries = [...groups.values()].map((group) =>
    buildEntry({
      group,
      manifest,
      activeKey,
      submissionCount: submissionCounts.get(`${group.entry.display}/${group.adapter}`) ?? 1,
    }),
  );

  // Rank + delta
  const ranked = rankEntries(entries);
  const previous = await loadPreviousSnapshot(projectRoot);
  const withDelta = applyDelta(ranked, previous);

  // Assemble artefact
  const isMock = validated.some((v) => v.submission.mock === true);
  const generatedAt = new Date().toISOString();
  const lastSubmission =
    allTrials.length === 0
      ? generatedAt
      : allTrials.map((t) => t.timestamp).sort().at(-1)!;

  const artefact: LeaderboardArtefact = {
    generated_at: generatedAt,
    dataset: manifest,
    entries: withDelta,
    is_mock: isMock,
    run_status: {
      tasks: new Set(allTrials.map((t) => t.task.task_id)).size,
      models: new Set(withDelta.map((e) => e.model_display)).size,
      adapters: new Set(withDelta.map((e) => e.adapter)).size,
      disciplines: DOMAINS.length,
      last_submission: lastSubmission,
      generated_at: generatedAt,
    },
  };

  await emitArtefacts(projectRoot, artefact);
  return artefact;
}
```

Then create the CLI entry point:

```ts
// scripts/ingest/cli.ts
// ABOUTME: Thin CLI wrapper — keeps runIngest importable without side effects.
import { runIngest } from '@/scripts/ingest/index';

runIngest({ projectRoot: process.cwd() }).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/ingest/orchestrator.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest/index.ts scripts/ingest/cli.ts tests/ingest/orchestrator.test.ts tests/ingest/fixtures/e2e/
git commit -m "feat(ingest): orchestrator runs discovery→emit end-to-end"
```

---

## Task 17: Mock generator — deterministic synthetic data

**Files:**
- Create: `scripts/mock/generate.ts`
- Create: `tests/ingest/mock-generate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ingest/mock-generate.test.ts
// ABOUTME: Deterministic mock generator produces valid TrialRecords + submission + manifest.
// ABOUTME: Same seed → identical output; generator outputs pass the full ingest validation.
import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateMocks } from '@/scripts/mock/generate';
import { runIngest } from '@/scripts/ingest/index';

describe('generateMocks', () => {
  it('produces a valid results/ tree that passes ingest validation', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'mock-gen-'));
    await generateMocks({ projectRoot: tempRoot, seed: 'test-seed-1' });
    const artefact = await runIngest({ projectRoot: tempRoot });
    expect(artefact.is_mock).toBe(true);
    expect(artefact.entries.length).toBeGreaterThanOrEqual(4);
  });

  it('is deterministic — same seed produces identical trial rewards', async () => {
    const a = await mkdtemp(join(tmpdir(), 'mock-gen-a-'));
    const b = await mkdtemp(join(tmpdir(), 'mock-gen-b-'));
    await generateMocks({ projectRoot: a, seed: 'same-seed' });
    await generateMocks({ projectRoot: b, seed: 'same-seed' });

    const trialsA = await readFile(
      join(a, 'results/experiments/_mock-claude-sonnet-4-tool_loop/trials/trial-0.json'),
      'utf-8',
    );
    const trialsB = await readFile(
      join(b, 'results/experiments/_mock-claude-sonnet-4-tool_loop/trials/trial-0.json'),
      'utf-8',
    );
    expect(JSON.parse(trialsA).evaluation.reward).toEqual(JSON.parse(trialsB).evaluation.reward);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/ingest/mock-generate.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the generator**

```ts
// scripts/mock/generate.ts
// ABOUTME: Deterministic mock generator — produces a full results/ tree for the active dataset.
// ABOUTME: Rewards drawn from per-model beta distributions; costs derived from pricing table.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import seedrandom from 'seedrandom';
import { dump } from 'js-yaml';

export interface GenerateOptions {
  projectRoot: string;
  seed: string;
}

interface MockModel {
  library: string;          // goes into agent.model
  display: string;          // drives the mock folder slug
  adapter: string;
  alpha: number;            // beta distribution shape
  beta: number;
  pricePerMtokIn: number;
  pricePerMtokOut: number;
}

const MOCK_MODELS: MockModel[] = [
  { library: 'claude-sonnet-4-6', display: 'claude-sonnet-4', adapter: 'tool_loop', alpha: 7, beta: 3, pricePerMtokIn: 3, pricePerMtokOut: 15 },
  { library: 'claude-sonnet-4-6', display: 'claude-sonnet-4', adapter: 'rlm', alpha: 6, beta: 4, pricePerMtokIn: 3, pricePerMtokOut: 15 },
  { library: 'gpt-4.1', display: 'gpt-4.1', adapter: 'tool_loop', alpha: 6, beta: 4, pricePerMtokIn: 2, pricePerMtokOut: 8 },
  { library: 'gemini-2.5-pro', display: 'gemini-2.5-pro', adapter: 'tool_loop', alpha: 5, beta: 5, pricePerMtokIn: 1.25, pricePerMtokOut: 5 },
  { library: 'llama-4-maverick', display: 'llama-4-maverick', adapter: 'direct', alpha: 4, beta: 6, pricePerMtokIn: 0.3, pricePerMtokOut: 0.6 },
  { library: 'gpt-4.1-mini', display: 'gpt-4.1-mini', adapter: 'tool_loop', alpha: 4, beta: 6, pricePerMtokIn: 0.4, pricePerMtokOut: 1.6 },
];

const TASK_SEED_IDS = [
  { task_id: 'civil/bearing-capacity', domain: 'civil' },
  { task_id: 'civil/retaining-wall', domain: 'civil' },
  { task_id: 'electrical/pf-droop', domain: 'electrical' },
  { task_id: 'electrical/cable-ampacity', domain: 'electrical' },
  { task_id: 'ground/terzaghi', domain: 'ground' },
  { task_id: 'ground/infinite-slope', domain: 'ground' },
  { task_id: 'mechanical/heat-load', domain: 'mechanical' },
  { task_id: 'mechanical/piping', domain: 'mechanical' },
  { task_id: 'structural/beam-sizing', domain: 'structural' },
  { task_id: 'structural/connections', domain: 'structural' },
] as const;

const REPETITIONS_PER_TASK = 3;

export async function generateMocks(opts: GenerateOptions): Promise<void> {
  const rng = seedrandom(opts.seed);

  // 1. Emit active.json
  await writeJson(
    join(opts.projectRoot, 'results/active.json'),
    { benchmark: 'aec-bench', version: '0.4.1' },
  );

  // 2. Emit dataset manifest
  await writeJson(
    join(opts.projectRoot, 'results/datasets/aec-bench@0.4.1/manifest.json'),
    {
      name: 'aec-bench',
      version: '0.4.1',
      content_hash: 'mock-' + 'a'.repeat(56),
      description: { summary: 'Mock aec-bench dataset (synthetic)', task_count: TASK_SEED_IDS.length },
      tasks: TASK_SEED_IDS.map((t) => ({
        task_id: t.task_id,
        domain: t.domain,
        difficulty: 'medium',
        tags: ['mock'],
      })),
    },
  );

  // 3. Emit one mock experiment per MockModel
  for (const model of MOCK_MODELS) {
    const expId = `_mock-${model.display}-${model.adapter}`;
    const expDir = join(opts.projectRoot, 'results/experiments', expId);

    const submission = {
      experiment_id: expId,
      dataset: 'aec-bench@0.4.1',
      submitter: { github: 'aec-bench-bot' },
      model_claim: { library_model: model.library },
      submitted_at: '2026-04-10T12:00:00Z',
      mock: true,
      mock_notes: `Synthetic data; generated with seed "${opts.seed}"`,
    };
    await writeYaml(join(expDir, 'submission.yml'), submission);

    let trialIdx = 0;
    for (const task of TASK_SEED_IDS) {
      for (let rep = 0; rep < REPETITIONS_PER_TASK; rep++) {
        const reward = roundTo(sampleBeta(rng, model.alpha, model.beta), 2);
        const tokensIn = Math.round(sampleLogNormal(rng, 50000, 0.25));
        const tokensOut = Math.round(sampleLogNormal(rng, 10000, 0.25));
        const costUsd = roundTo(
          (tokensIn * model.pricePerMtokIn + tokensOut * model.pricePerMtokOut) / 1_000_000,
          4,
        );
        const trial = {
          trial_id: `trial-${trialIdx}`,
          experiment_id: expId,
          dataset_id: 'aec-bench@0.4.1',
          timestamp: offsetIso('2026-04-10T12:00:00Z', trialIdx * 60),
          task: { task_id: task.task_id, task_revision: 'mock-rev' },
          agent: {
            adapter: model.adapter,
            model: model.library,
            adapter_revision: '1.0.0',
            configuration: {},
          },
          evaluation: {
            reward,
            validity: { output_parseable: true, schema_valid: true, verifier_completed: true },
          },
          timing: {
            total_seconds: roundTo(sampleLogNormal(rng, 30, 0.3), 2),
            agent_seconds: roundTo(sampleLogNormal(rng, 20, 0.3), 2),
          },
          cost: {
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            cache_read_tokens: null,
            cache_write_tokens: null,
            estimated_cost_usd: costUsd,
          },
          completeness: 'complete' as const,
        };
        await writeJson(join(expDir, 'trials', `trial-${trialIdx}.json`), trial);
        trialIdx++;
      }
    }
  }
}

function sampleBeta(rng: seedrandom.PRNG, alpha: number, beta: number): number {
  // Johnk's algorithm for small alpha/beta — good enough for mock rewards.
  let u: number, v: number, x: number, y: number;
  do {
    u = rng();
    v = rng();
    x = Math.pow(u, 1 / alpha);
    y = Math.pow(v, 1 / beta);
  } while (x + y > 1 || x + y === 0);
  return x / (x + y);
}

function sampleLogNormal(rng: seedrandom.PRNG, mean: number, sigma: number): number {
  // Box-Muller
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean * Math.exp(sigma * z - (sigma * sigma) / 2);
}

function offsetIso(baseIso: string, addSeconds: number): string {
  return new Date(new Date(baseIso).getTime() + addSeconds * 1000).toISOString();
}

function roundTo(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

async function writeJson(path: string, content: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(content, null, 2));
}

async function writeYaml(path: string, content: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, dump(content));
}
```

Then create the CLI entry point:

```ts
// scripts/mock/cli.ts
// ABOUTME: Thin CLI wrapper around generateMocks so the generator stays side-effect-free.
import { resolve } from 'node:path';
import { generateMocks } from '@/scripts/mock/generate';

const seed = process.env.MOCK_SEED ?? 'aecbench-seed-2026-04-18';
generateMocks({ projectRoot: resolve(process.cwd()), seed })
  .then(() => console.log(`Mock data generated with seed "${seed}"`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/ingest/mock-generate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/mock/generate.ts scripts/mock/cli.ts tests/ingest/mock-generate.test.ts
git commit -m "feat(mock): deterministic synthetic data generator"
```

---

## Task 18: Commit initial mock data into results/

**Files:**
- Create: `results/active.json`
- Create: `results/datasets/aec-bench@0.4.1/manifest.json`
- Create: `results/experiments/_mock-*/...` (generated by Task 17's script)
- Modify: `package.json` (add `mock:generate` script)

- [ ] **Step 1: Add script hook**

Add to `package.json` `scripts`:

```json
"mock:generate": "tsx scripts/mock/cli.ts",
"ingest": "tsx scripts/ingest/cli.ts"
```

Add to devDependencies:

```bash
pnpm add -D tsx@^4.19.2
```

- [ ] **Step 2: Run the generator with the canonical seed**

Run: `MOCK_SEED=aecbench-seed-2026-04-18 pnpm mock:generate`
Expected: `Mock data generated with seed "aecbench-seed-2026-04-18"`. Creates:
- `results/active.json`
- `results/datasets/aec-bench@0.4.1/manifest.json`
- 6 × `results/experiments/_mock-*/` folders with `submission.yml` + 30 trials each

- [ ] **Step 3: Verify ingest succeeds against the committed tree**

Run: `pnpm ingest`
Expected: Script exits 0. `public/data/leaderboard.json` exists with 6 entries, `is_mock: true`.

- [ ] **Step 4: Commit the generated tree**

```bash
git add package.json pnpm-lock.yaml results/
git commit -m "feat(results): seed mock experiments and active dataset manifest"
```

---

## Task 19: Read layer for pages

**Files:**
- Create: `lib/aec-bench/read.ts`
- Create: `tests/components/read-layer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/components/read-layer.test.ts
// ABOUTME: Exercises the page-side helpers over the emitted leaderboard artefact.
// ABOUTME: Assumes Task 18 has been run so public/data/leaderboard.json exists.
import { describe, it, expect } from 'vitest';
import { getTopN, getRunStatus, isMock } from '@/lib/aec-bench/read';

describe('read layer', () => {
  it('returns the top N entries sorted by rank', () => {
    const top = getTopN(3);
    expect(top).toHaveLength(3);
    expect(top[0].rank).toBe(1);
    expect(top[2].rank).toBe(3);
  });

  it('exposes run_status for the status bar', () => {
    const status = getRunStatus();
    expect(status.tasks).toBeGreaterThan(0);
    expect(status.models).toBeGreaterThan(0);
    expect(status.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('reports is_mock correctly from the committed artefact', () => {
    expect(isMock()).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/components/read-layer.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the read helpers**

```ts
// lib/aec-bench/read.ts
// ABOUTME: Thin read-side helpers over the build-emitted leaderboard artefact.
// ABOUTME: Pages import from here instead of reading results/ directly.
import artefact from '@/public/data/leaderboard.json';
import type { LeaderboardArtefact, LeaderboardEntry } from '@/lib/aec-bench/contracts';

const leaderboard = artefact as LeaderboardArtefact;

export function getTopN(n: number): LeaderboardEntry[] {
  return leaderboard.entries.slice(0, n);
}

export function getAllEntries(): LeaderboardEntry[] {
  return leaderboard.entries;
}

export async function getByDiscipline(domain: string): Promise<LeaderboardArtefact> {
  const mod = await import(`@/public/data/disciplines/${domain}.json`);
  return mod.default as LeaderboardArtefact;
}

export function getRunStatus() {
  return leaderboard.run_status;
}

export function getDataset() {
  return leaderboard.dataset;
}

export function isMock(): boolean {
  return leaderboard.is_mock;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/read-layer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/aec-bench/read.ts tests/components/read-layer.test.ts
git commit -m "feat(read): page-side helpers over emitted leaderboard artefact"
```

---

## Task 20: PreviewBanner component

**Files:**
- Create: `components/landing/preview-banner.tsx`
- Create: `tests/components/preview-banner.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/preview-banner.test.tsx
// ABOUTME: Banner renders only when is_mock=true; text is explicit about synthetic data.
// ABOUTME: Static import of the read layer — the mocked data path has is_mock=true.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PreviewBanner } from '@/components/landing/preview-banner';

describe('PreviewBanner', () => {
  it('renders the synthetic-data notice', () => {
    render(<PreviewBanner show />);
    expect(screen.getByRole('alert')).toHaveTextContent(/synthetic preview data/i);
  });

  it('renders nothing when show=false', () => {
    const { container } = render(<PreviewBanner show={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/components/preview-banner.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the banner**

```tsx
// components/landing/preview-banner.tsx
// ABOUTME: Thin banner shown above the nav when the leaderboard is rendering synthetic data.
// ABOUTME: Hidden when real submissions have replaced the mocks.
export function PreviewBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-40 border-b border-landing-border bg-[#1a1205] px-4 py-1.5 text-center font-mono text-[0.68rem] tracking-wide text-accent-amber"
    >
      <span aria-hidden="true" className="mr-1.5">●</span>
      PREVIEW · synthetic preview data — real results land as aec-bench ships
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/preview-banner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/landing/preview-banner.tsx tests/components/preview-banner.test.tsx
git commit -m "feat(landing): PreviewBanner for synthetic-data notice"
```

---

## Task 21: Rewire data.ts to the read layer

**Files:**
- Modify: `components/landing/data.ts`
- Modify: `tests/components/landing-data.test.tsx`

- [ ] **Step 1: Update the test to assert shape rather than hard-coded values**

Replace `tests/components/landing-data.test.tsx` content:

```tsx
// tests/components/landing-data.test.tsx
// ABOUTME: Validates the shape of previewModels as adapted from the live leaderboard artefact.
// ABOUTME: We assert field types, not specific values — real rewards change over time.
import { describe, it, expect } from 'vitest';
import { previewModels } from '@/components/landing/data';

describe('previewModels', () => {
  it('produces 4 adapted preview rows', () => {
    expect(previewModels).toHaveLength(4);
  });

  it('every row carries extended shape fields with the right types', () => {
    for (const m of previewModels) {
      expect(typeof m.rank).toBe('number');
      expect(typeof m.model).toBe('string');
      expect(m.provider).toMatch(/^(anthropic|openai|google|meta|other)$/);
      expect(typeof m.overallScore).toBe('number');
      expect(typeof m.tokensMillions).toBe('number');
      expect(typeof m.costUsd).toBe('number');
      expect(typeof m.deltaLastRun).toBe('number');
      expect(typeof m.costPerTask).toBe('number');
      expect(m.disciplines).toHaveProperty('civil');
      expect(m.disciplines).toHaveProperty('electrical');
    }
  });

  it('is sorted by rank ascending', () => {
    const ranks = previewModels.map((m) => m.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
```

- [ ] **Step 2: Run the updated test to verify it fails**

Run: `pnpm test tests/components/landing-data.test.tsx`
Expected: FAIL — the new test expects real data shapes but the stub hasn't been rewired yet.

- [ ] **Step 3: Rewire data.ts**

```ts
// components/landing/data.ts
// ABOUTME: Adapts the build-emitted leaderboard artefact into the PreviewModel shape.
// ABOUTME: Existing landing components read PreviewModel without knowing the source changed.
import { getTopN } from '@/lib/aec-bench/read';
import type { LeaderboardEntry } from '@/lib/aec-bench/contracts';

export type Provider = 'anthropic' | 'openai' | 'google' | 'meta' | 'other';

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

function adapt(entry: LeaderboardEntry): PreviewModel {
  return {
    rank: entry.rank,
    model: entry.model_display,
    provider: entry.provider,
    overallScore: entry.reward,
    disciplines: {
      civil: entry.per_discipline.civil ?? 0,
      electrical: entry.per_discipline.electrical ?? 0,
      ground: entry.per_discipline.ground ?? 0,
      mechanical: entry.per_discipline.mechanical ?? 0,
      structural: entry.per_discipline.structural ?? 0,
    },
    tokensMillions:
      entry.mean_tokens === null ? 0 : Math.round((entry.mean_tokens * entry.trials) / 1e4) / 100,
    costUsd: entry.total_cost_usd ?? 0,
    deltaLastRun: entry.delta_vs_previous ?? 0,
    costPerTask: entry.mean_cost_usd ?? 0,
  };
}

export const previewModels: PreviewModel[] = getTopN(4).map(adapt);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/landing-data.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/landing/data.ts tests/components/landing-data.test.tsx
git commit -m "refactor(landing): data.ts reads from live leaderboard artefact"
```

---

## Task 22: Rewire run-status.ts to the read layer

**Files:**
- Modify: `components/landing/run-status.ts`

- [ ] **Step 1: Rewrite the module**

```ts
// components/landing/run-status.ts
// ABOUTME: Run-status values read from the build-emitted artefact.
// ABOUTME: Field names align with the new LeaderboardArtefact.run_status shape.
import { getRunStatus, getDataset } from '@/lib/aec-bench/read';

export interface RunStatus {
  tasks: number;
  models: number;
  adapters: number;
  disciplines: number;
  lastSubmissionIso: string;
  generatedAtIso: string;
  datasetVersion: string;
}

const raw = getRunStatus();
const dataset = getDataset();

export const runStatus: RunStatus = {
  tasks: raw.tasks,
  models: raw.models,
  adapters: raw.adapters,
  disciplines: raw.disciplines,
  lastSubmissionIso: raw.last_submission,
  generatedAtIso: raw.generated_at,
  datasetVersion: `v${dataset.version}`,
};
```

- [ ] **Step 2: Commit**

No new tests — the existing `status-bar.test.tsx` is updated next task. The component tests referencing old fields will fail temporarily.

```bash
git add components/landing/run-status.ts
git commit -m "refactor(landing): run-status reads from live artefact with new shape"
```

---

## Task 23: Update StatusBar to new fields and labels

**Files:**
- Modify: `components/landing/status-bar.tsx`
- Modify: `tests/components/status-bar.test.tsx`

- [ ] **Step 1: Rewrite the test to assert the new labels**

```tsx
// tests/components/status-bar.test.tsx
// ABOUTME: Status bar renders honest labels — no fake run_id, relative times from real timestamps.
// ABOUTME: Covers LIVE vs PREVIEW states via the is_mock flag.
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusBar } from '@/components/landing/status-bar';

vi.mock('@/lib/aec-bench/read', () => ({
  getRunStatus: () => ({
    tasks: 30,
    models: 5,
    adapters: 3,
    disciplines: 5,
    last_submission: '2026-04-18T10:00:00Z',
    generated_at: '2026-04-18T12:00:00Z',
  }),
  getDataset: () => ({
    name: 'aec-bench',
    version: '0.4.1',
    content_hash: 'h',
    description: { summary: 's', task_count: 30 },
    tasks: [],
  }),
  isMock: () => true,
}));

describe('StatusBar', () => {
  it('shows PREVIEW mode when is_mock is true', () => {
    render(<StatusBar />);
    expect(screen.getByText(/PREVIEW/)).toBeInTheDocument();
    expect(screen.queryByText(/LIVE/)).not.toBeInTheDocument();
  });

  it('renders tasks, models, disciplines counts', () => {
    render(<StatusBar />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('5', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows last_submission and built-at relative times', () => {
    render(<StatusBar />);
    expect(screen.getByText(/last submission/i)).toBeInTheDocument();
    expect(screen.getByText(/built/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/components/status-bar.test.tsx`
Expected: FAIL — component still reads old fields.

- [ ] **Step 3: Rewrite the component**

```tsx
// components/landing/status-bar.tsx
// ABOUTME: Persistent mono status bar with honest timestamps and a PREVIEW mode for mock data.
// ABOUTME: Pulsing dot is disabled under prefers-reduced-motion.
'use client';

import { useReducedMotion } from 'framer-motion';
import { runStatus } from './run-status';
import { isMock } from '@/lib/aec-bench/read';

function relativeFromIso(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const secs = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function StatusBar() {
  const reduced = useReducedMotion();
  const mock = isMock();
  const label = mock ? 'PREVIEW' : 'LIVE';
  const dotClass = `inline-block h-1.5 w-1.5 rounded-full bg-accent-amber ${
    reduced ? '' : 'animate-pulse'
  }`;
  return (
    <div
      className="sticky top-14 z-30 border-b border-landing-border bg-[#050505] font-mono text-[0.68rem] tracking-wide text-landing-muted"
      role="status"
      aria-label="aec-bench run status"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={dotClass}
            style={{ boxShadow: '0 0 6px rgba(232,168,56,0.6)' }}
          />
          <span className="text-accent-amber">{label}</span>
        </span>
        <span>dataset <span className="text-landing-text">{runStatus.datasetVersion}</span></span>
        <span>tasks <span className="text-landing-text">{runStatus.tasks}</span></span>
        <span>models <span className="text-landing-text">{runStatus.models}</span></span>
        <span className="hidden sm:inline">
          disciplines <span className="text-landing-text">{runStatus.disciplines}</span>
        </span>
        <span className="ml-auto text-accent-teal">
          last submission {relativeFromIso(runStatus.lastSubmissionIso)} · built{' '}
          {relativeFromIso(runStatus.generatedAtIso)}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/status-bar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/landing/status-bar.tsx tests/components/status-bar.test.tsx
git commit -m "refactor(landing): StatusBar uses honest timestamps and PREVIEW mode"
```

---

## Task 24: Mount PreviewBanner in home layout

**Files:**
- Modify: `app/(home)/layout.tsx`
- Create: `tests/e2e/preview-banner.spec.ts`

- [ ] **Step 1: Write the failing E2E test**

```ts
// tests/e2e/preview-banner.spec.ts
// ABOUTME: Verifies the synthetic-data preview banner renders while mocks are in play.
// ABOUTME: Relies on the canonical seed producing is_mock=true in the committed artefact.
import { test, expect } from '@playwright/test';

test('preview banner renders on landing when mocks are active', async ({ page }) => {
  await page.goto('/');
  const banner = page.getByRole('alert').filter({ hasText: /synthetic preview data/i });
  await expect(banner).toBeVisible();
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `pnpm test:e2e --grep "preview banner"`
Expected: FAIL — no banner mounted yet.

- [ ] **Step 3: Mount the banner in the home layout**

```tsx
// app/(home)/layout.tsx
// ABOUTME: Layout for non-docs pages — mounts the PreviewBanner (when is_mock), StatusBar, and Fumadocs HomeLayout.
// ABOUTME: PreviewBanner sits above the nav so users see the synthetic notice before any content.
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { StatusBar } from '@/components/landing/status-bar';
import { PreviewBanner } from '@/components/landing/preview-banner';
import { isMock } from '@/lib/aec-bench/read';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreviewBanner show={isMock()} />
      <HomeLayout {...baseOptions()}>
        <StatusBar />
        {children}
      </HomeLayout>
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:e2e --grep "preview banner"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/\(home\)/layout.tsx tests/e2e/preview-banner.spec.ts
git commit -m "feat(landing): mount PreviewBanner above nav when mocks are active"
```

---

## Task 25: Update LeaderboardPreview to drop run_id

**Files:**
- Modify: `components/landing/leaderboard-preview.tsx`
- Modify: `tests/components/leaderboard-preview.test.tsx`

- [ ] **Step 1: Inspect existing references to run_id**

Run: `grep -n "runId\|run_id" components/landing/leaderboard-preview.tsx`
Expected: one reference showing `run <span…>{runStatus.runId}</span>` — needs removal.

- [ ] **Step 2: Update the test**

Locate the assertion in `tests/components/leaderboard-preview.test.tsx` that expects `0412-a7` (or any `runId` value) and either remove it or replace with a dataset-version assertion. If the test file does not currently assert on run_id, skip this step.

```tsx
// Example replacement if the existing test asserts on run_id:
// BEFORE: expect(screen.getByText(/run 0412-a7/)).toBeInTheDocument();
// AFTER:  expect(screen.getByText(/dataset v0\.4\.1/i)).toBeInTheDocument();
```

- [ ] **Step 3: Run tests to see what's broken**

Run: `pnpm test tests/components/leaderboard-preview.test.tsx`
Expected: Failures pointing at `runStatus.runId` — the field no longer exists on the new shape.

- [ ] **Step 4: Patch the component**

In `components/landing/leaderboard-preview.tsx`, find the metadata line that reads `runStatus.runId` and remove that span, keeping the dataset + tasks + disciplines + last_submission references. Example diff:

```tsx
// Before
<p className="mb-6 mt-1 font-mono text-xs text-landing-muted">
  dataset <span className="text-accent-amber">{runStatus.datasetVersion}</span> · run{' '}
  <span className="text-accent-amber">{runStatus.runId}</span> · {runStatus.tasks} tasks ·{' '}
  {runStatus.disciplines} disciplines · last eval {runStatus.lastRunRelative}
</p>

// After
<p className="mb-6 mt-1 font-mono text-xs text-landing-muted">
  dataset <span className="text-accent-amber">{runStatus.datasetVersion}</span> ·{' '}
  {runStatus.tasks} tasks · {runStatus.disciplines} disciplines
</p>
```

Also replace any other `runStatus.lastRunRelative` usage with a call to a shared helper (add to `components/landing/run-status.ts` if needed — `lastSubmissionRelative` derived from `lastSubmissionIso`).

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/components/leaderboard-preview.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/landing/leaderboard-preview.tsx tests/components/leaderboard-preview.test.tsx
git commit -m "refactor(landing): drop run_id from LeaderboardPreview metadata line"
```

---

## Task 26: Wire prebuild script and ingest:snapshot CLI

**Files:**
- Modify: `package.json`
- Create: `scripts/ingest/promote-snapshot.ts`

- [ ] **Step 1: Implement snapshot promotion CLI**

```ts
// scripts/ingest/promote-snapshot.ts
// ABOUTME: Copies the current public/data/leaderboard.json to results/snapshots/ with a date-stamped name.
// ABOUTME: Run manually after a batch of submissions is merged; sets the new baseline for delta.
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function promote(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const src = resolve(process.cwd(), 'public/data/leaderboard.json');
  const dstDir = resolve(process.cwd(), 'results/snapshots');
  const dst = resolve(dstDir, `leaderboard-${today}.json`);
  await mkdir(dstDir, { recursive: true });
  await copyFile(src, dst);
  console.log(`Promoted snapshot to ${dst}`);
}

promote().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Update package.json scripts**

In `package.json`:

```json
"scripts": {
  "dev": "pnpm ingest && next dev --turbopack",
  "build": "pnpm ingest && next build",
  "start": "next start",
  "prebuild": "pnpm ingest",
  "ingest": "tsx scripts/ingest/cli.ts",
  "ingest:snapshot": "tsx scripts/ingest/promote-snapshot.ts",
  "mock:generate": "tsx scripts/mock/cli.ts",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:registry": "tsx -e \"import('./scripts/ingest/pricing-parity.ts').then(async (m) => { import('./scripts/ingest/registry.ts').then(async (r) => { m.checkParity(await m.loadSnapshot(), await r.loadRegistry()); }); });\""
}
```

- [ ] **Step 3: Verify the build pipeline**

Run: `pnpm build`
Expected: ingest runs, `public/data/` populates, Next.js build succeeds.

- [ ] **Step 4: Verify promote CLI works**

Run: `pnpm ingest:snapshot`
Expected: `Promoted snapshot to …/results/snapshots/leaderboard-2026-04-18.json`.

Commit the generated snapshot as part of this task so delta computation has a baseline:

```bash
git add results/snapshots/
```

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/ingest/promote-snapshot.ts results/snapshots/
git commit -m "feat(ingest): prebuild hook, snapshot promotion CLI, test:registry script"
```

---

## Task 27: Extend existing E2E landing tests for new status-bar labels

**Files:**
- Modify: `tests/e2e/landing.spec.ts`

- [ ] **Step 1: Inspect current landing E2E**

Run: `grep -n "last_run\|run_id" tests/e2e/landing.spec.ts`
Expected: hits showing assertions against the old shape.

- [ ] **Step 2: Update the assertions**

Replace any assertion that looks for `last_run Nh ago` with a regex match on `last submission \d+[smhd] ago`. Replace any `run_id` assertion with a `dataset v\d+\.\d+\.\d+` match. Example:

```ts
// Before
await expect(page.getByText(/last_run \d+h ago/)).toBeVisible();

// After
await expect(page.getByText(/last submission \d+[smhd] ago/)).toBeVisible();
await expect(page.getByText(/built \d+[smhd] ago/)).toBeVisible();
```

- [ ] **Step 3: Run E2E suite**

Run: `pnpm test:e2e`
Expected: all landing tests pass, including the new preview-banner spec from Task 24.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/landing.spec.ts
git commit -m "test(e2e): update landing assertions for honest status-bar labels"
```

---

## Task 28: Full-stack verification

**Files:** None — verification only.

- [ ] **Step 1: Clean build from scratch**

Run: `rm -rf public/data && pnpm build`
Expected: prebuild ingest runs, `public/data/leaderboard.json` regenerates with is_mock=true, Next.js build succeeds.

- [ ] **Step 2: Run the full unit + integration suite**

Run: `pnpm test`
Expected: all tests green, including the ingest modules and the updated component tests.

- [ ] **Step 3: Run CI parity check**

Run: `pnpm test:registry`
Expected: exits 0 with no output (parity holds).

- [ ] **Step 4: Run the full E2E suite**

Run: `pnpm test:e2e`
Expected: landing, preview-banner, docs, and any other specs pass.

- [ ] **Step 5: Manual smoke — dev server**

Run: `pnpm dev` and visit `http://localhost:3000`
Expected behaviours:
- Amber `PREVIEW · synthetic preview data …` banner visible at the top of the page.
- Status bar reads `● PREVIEW · dataset v0.4.1 · tasks 30 · models 6 · disciplines 5 · last submission Nh ago · built Nm ago`.
- Leaderboard preview section lists top-4 rows with real mock values (not the old stubs).
- Dataset version appears in the leaderboard preview metadata line.
- All landing sections below still render (no console errors).

- [ ] **Step 6: Nothing to commit — verification only**

If the smoke pass reveals issues, create targeted fix commits referencing the plan task that produced the regression.

---

## Task 29: Update memory with landing changes

**Files:**
- Modify: `/Users/theodoros.galanos/.claude/projects/-Users-theodoros-galanos-LocalProjects-aecbench-site/memory/aecbench-deferred-scope.md`

- [ ] **Step 1: Annotate that the Supabase-wiring bullet is now superseded**

Edit the deferred-scope note to record that item 5 (Supabase wiring) is now replaced by the git-only infrastructure shipped in this plan:

```markdown
5. **Supabase wiring (Phase 4+, superseded for MVP).** Replaced by git-only
   static materialisation — see `docs/specs/2026-04-18-leaderboard-infra-design.md`
   and the storage-scale-migration memory note for triggers to revisit.
```

Also add a new line at the bottom noting what's now LIVE:

```markdown
**Landed 2026-04-18 (leaderboard infra):** git-only ingest pipeline, zod
contracts, model registry, mock data generator, PreviewBanner, StatusBar
with honest timestamps. Landing stubs retired.
```

- [ ] **Step 2: No commit — memory is outside the git tree**

Memory files under `~/.claude/projects/...` are user-local; no git action needed.

---

## Self-Review Checklist

Before handing off:

- **Spec coverage:** Every requirement in §2–§9 of the spec maps to a task — contracts (T2), file layout (T5–T7, T15), ingest pipeline (T5–T16), aggregation rules (T8–T13), read surface (T19, T21), model registry (T3–T4), mock data (T17–T18), status bar realism (T22–T23, T25), testing (unit tests per task + T16 fixture integration + T24+T27 E2E + T26 parity).
- **Placeholder scan:** No "TBD", "implement later", or "add error handling". Every code block is copy-pasteable.
- **Type consistency:** `LeaderboardEntry`, `TrialRecord`, `Submission`, `DatasetManifest`, `ModelEntry`, `ActivePointer`, `LeaderboardArtefact`, `RunStatus` all match between contracts (T2) and downstream consumers (T3–T26). `slugify` + `modelKey` defined in T3 used by T8, T16. `computeReward`, `computePerDiscipline`, `computeCostAndTiming`, `rankEntries`, `applyDelta`, `buildEntry` all exported from `aggregate.ts` and consistently referenced.
- **Non-goals preserved:** No task builds `/leaderboard`, `/leaderboard/[discipline]`, Supabase wiring, `aec-bench submit` CLI, or community-dataset support.
