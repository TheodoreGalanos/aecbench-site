---
title: Leaderboard Infrastructure — Design
date: 2026-04-18
status: ready-to-plan
scope: Phase 3 sub-project 1 of 3 — data infrastructure only; /leaderboard and /leaderboard/[discipline] page designs are separate specs
---

# Leaderboard Infrastructure — Design

## Context

The landing page ships with hand-curated stubs in `components/landing/data.ts` and
`components/landing/run-status.ts`. The memory note `aecbench-deferred-scope`
captures the original Phase 3 plan: swap those stubs for Supabase queries, build
`/leaderboard` and the five discipline subroutes.

Revisiting that plan with the `aec-bench` library's actual contracts in hand
(`TrialRecord`, `DatasetManifest`, `ExperimentManifest`, `TaskDefinition`) and
with the decision to keep submissions open but PR-reviewed, the cleaner order is:
**design data infrastructure first, UI second**. This spec covers the
infrastructure; the `/leaderboard` page design is a separate spec that follows.

The chosen submission model is open + community-contributed + PR-reviewed
(not Aurecon-primary, not replay-verified). Storage is git-only with static
materialisation at build time. Supabase is deferred to Phase 4+ with triggers
captured in memory (`aecbench-storage-scale-migration`).

## Goals

1. Mirror the `aec-bench` library's contracts faithfully so `TrialRecord` and
   `DatasetManifest` are the same objects on both sides of the boundary.
2. Accept submissions as PRs containing a single experiment's ledger folder —
   zero bespoke submission infrastructure.
3. Emit compact, typed JSON artefacts at build time that any page can read
   without runtime fetches.
4. Keep the existing landing components working unchanged by preserving the
   `PreviewModel` / `RunStatus` shapes at the read boundary.
5. Ship with realistic mock data that exercises the full pipeline end-to-end,
   behind a clear "preview" banner, until real submissions arrive.

## Non-goals

- Designing or building `/leaderboard`, `/leaderboard/[discipline]`, or
  `/leaderboard/models/[slug]` pages. This spec emits the data they will read.
- Wiring Supabase. See memory `aecbench-storage-scale-migration` for triggers.
- Building an `aec-bench submit` CLI in the library. See memory
  `aecbench-lib-gaps`. MVP ingest is a hand-opened PR against this repo.
- Replay-verifying submissions. The PR review is the integrity layer for now.
- Hosting community-authored datasets. See option Z in memory
  `aecbench-deferred-scope`. MVP is canonical-only.
- Any authentication beyond GitHub-PR identity.

## Architecture

Three layers, one source of truth:

1. **Contracts layer** (`lib/aec-bench/contracts.ts`) — TypeScript mirrors of
   the library's pydantic models plus zod validators. Mirror only the subset
   the site reads.
2. **Ingest + aggregation layer** (`scripts/ingest/`) — Node script run at
   `next build` that walks `results/`, validates, resolves the model registry,
   aggregates, and emits derived artefacts to `public/data/`.
3. **Read layer** (`lib/aec-bench/read.ts` + components) — pages import typed
   artefacts directly. No runtime DB, no API routes, no fetches.

```
Submitter (manual PR for now, --submit CLI later)
        │
        ▼
  results/experiments/<id>/       git = database
        │
        ▼ on merge
  scripts/ingest at next build
  validate → resolve → aggregate → emit
        │
        ▼
  public/data/leaderboard.json + slices
        │
        ▼
  Landing / /leaderboard / discipline routes read these
```

## Data model

### Mirror types (from `aec-bench` pydantic → TypeScript)

Lives in `lib/aec-bench/contracts.ts`. Runtime validation via zod. Only mirror
the subset the site reads — we do not need `EnvironmentSpec` or `ToolSpec` detail.

```ts
export interface TrialRecord {
  trial_id: string;
  experiment_id: string;
  dataset_id: string | null;            // "name@version"
  timestamp: string;                     // ISO 8601
  task: { task_id: string; task_revision: string };
  agent: {
    adapter: string;                     // tool_loop | rlm | direct
    model: string;                       // raw library string
    adapter_revision: string | null;
    configuration: Record<string, unknown>;
  };
  evaluation: {
    reward: number;                      // 0..1
    validity: {
      output_parseable: boolean;
      schema_valid: boolean;
      verifier_completed: boolean;
    };
  };
  timing: { total_seconds: number; agent_seconds: number | null };
  cost: {
    tokens_in: number | null;
    tokens_out: number | null;
    cache_read_tokens: number | null;
    cache_write_tokens: number | null;
    estimated_cost_usd: number | null;
  } | null;
  completeness: 'complete' | 'partial';
}

export interface DatasetTaskEntry {
  task_id: string;
  domain: Domain;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export type Domain = 'civil' | 'electrical' | 'ground' | 'mechanical' | 'structural';

export interface DatasetManifest {
  name: string;
  version: string;
  content_hash: string;
  description: { summary: string; task_count: number };
  tasks: DatasetTaskEntry[];
}
```

### Site-owned types

```ts
// data/models.yml → parsed into this
export interface ModelEntry {
  match: string;                         // substring, case-insensitive
  display: string;                       // "Claude Sonnet 4"
  provider: 'anthropic' | 'openai' | 'google' | 'meta' | 'other';
  family?: string;                       // "Claude 4"
}

// results/experiments/<id>/submission.yml → parsed into this
export interface Submission {
  experiment_id: string;
  dataset: string;                       // "name@version" — must match active
  submitter: { github: string; organisation?: string };
  model_claim: {
    library_model: string;               // raw string from TrialRecords
    display_override?: string;           // else resolved via models.yml
    provider_override?: ModelEntry['provider'];
  };
  notes?: string;
  submitted_at: string;                  // ISO 8601
  mock?: true;                           // mocks set this; real submissions omit
  mock_notes?: string;
}
```

### Derived aggregates (what the build emits)

```ts
// public/data/leaderboard.json
export interface LeaderboardEntry {
  rank: number;
  model_key: string;                     // stable slug: "claude-sonnet-4/tool_loop"
  model_display: string;
  provider: ModelEntry['provider'];
  adapter: string;

  reward: number;                        // mean across complete trials
  reward_ci: [number, number] | null;    // 95% CI if reps ≥ 3, else null
  per_discipline: Partial<Record<Domain, number>>; // domain missing if no trials

  trials: number;
  complete_trials: number;
  repetitions: number;                   // distinct reps per task

  mean_cost_usd: number | null;          // per-task
  total_cost_usd: number | null;
  mean_tokens: number | null;            // in + out per task
  mean_duration_seconds: number | null;

  dataset: string;
  last_submission: string;               // ISO 8601 — newest trial in this row
  submission_count: number;
  delta_vs_previous: number | null;      // null if new row
}

export interface LeaderboardArtefact {
  generated_at: string;                  // build timestamp
  dataset: DatasetManifest;
  entries: LeaderboardEntry[];
  is_mock: boolean;                      // true if any mock experiment contributed
  run_status: {
    tasks: number;
    models: number;
    adapters: number;
    disciplines: number;
    last_submission: string;             // ISO 8601
    generated_at: string;                // same as top-level
  };
}
```

Plus discipline slices at `public/data/disciplines/<slug>.json` (same shape,
filtered + re-ranked) and stubs at `public/data/models/<model_key>.json`
(one entry's detail, for future use by the model detail page).

## File layout

```
aecbench-site/
├── results/                                  # git = database
│   ├── active.json                            # { "benchmark": "aec-bench", "version": "0.4.1" }
│   ├── datasets/
│   │   └── aec-bench@0.4.1/
│   │       └── manifest.json                  # copy of library's DatasetManifest
│   ├── snapshots/
│   │   └── leaderboard-2026-04-12.json        # previous artefact (for Δ)
│   └── experiments/
│       ├── sonnet4-tool-loop-aurecon/
│       │   ├── submission.yml
│       │   ├── experiment-manifest.(yml|json)  # the config the submitter ran against
│       │   └── trials/
│       │       ├── terzaghi-bearing__a1B2c.json
│       │       └── ...
│       └── _mock-sonnet4-tool-loop/           # mocks: leading underscore
│           └── ...
├── data/
│   ├── models.yml                             # site-owned model registry
│   └── pricing-snapshot.json                  # committed mirror of pricing.py patterns
├── public/
│   └── data/                                  # build output, .gitignored
│       ├── leaderboard.json
│       ├── disciplines/{civil,electrical,ground,mechanical,structural}.json
│       └── models/<model_key>.json
├── scripts/
│   ├── ingest/
│   │   ├── index.ts                            # orchestrator
│   │   ├── validate.ts
│   │   ├── registry.ts                         # models.yml resolution + parity check
│   │   ├── aggregate.ts
│   │   ├── emit.ts
│   │   └── types.ts
│   └── mock/
│       └── generate.ts                         # deterministic mock generator
└── lib/aec-bench/
    ├── contracts.ts                            # zod schemas + TS types
    └── read.ts                                 # page-side helpers
```

Key choices:

- `results/` is committed. `public/data/` is `.gitignore`'d — it's a deterministic
  build output.
- `results/snapshots/` holds a single most-recent leaderboard JSON for the Δ
  computation. Promoted manually by reviewers, not bumped every merge — otherwise
  Δ becomes noise.
- Library JSONs go in as-is, not reshaped. One trial = one file, matching
  `aec_bench/ledger/writer.py`.
- `experiment-manifest.(yml|json)` is the submitter's config as they ran it —
  either the YAML they passed to `aec-bench run --config`, or a JSON derived
  from `ExperimentManifest.model_dump_json()`. The library does not currently
  persist this alongside the ledger output; see `aecbench-lib-gaps` memory for
  the follow-up library request. The site does not aggregate from this file —
  it is included for reviewer context and provenance.
- Mocks live alongside real experiments under `results/experiments/_mock-*/`,
  distinguished only by their `submission.yml` `mock: true` flag.

## Ingest pipeline

Orchestrated by `scripts/ingest/index.ts`, wired as a `prebuild` step in
`package.json`:

```
1. discover    walk results/experiments/, find submission.yml files
2. validate    for each experiment:
               - parse submission.yml (zod)
               - load experiment-manifest.json (zod)
               - load every trials/*.json (zod)
               - enforce: dataset matches results/active.json
               - enforce: every trial's task_id exists in active DatasetManifest
               - enforce: trial_ids unique within experiment
               - enforce: submission.yml experiment_id matches folder name
3. resolve     for each trial, resolve agent.model → ModelEntry via data/models.yml
               If no match, fail build with "add entry to data/models.yml: <string>"
4. aggregate   group by (model_key, adapter), apply rules in next section
5. diff        load results/snapshots/<most-recent>.json, compute delta_vs_previous
6. emit        write public/data/leaderboard.json + discipline slices + model stubs
               Set is_mock = true iff any contributing experiment had mock: true
7. snapshot    NOT automatic. A reviewer runs `pnpm ingest:snapshot` to copy the
               current leaderboard.json to results/snapshots/ and commit it as
               the new baseline. Typical cadence: after a batch of merges.
```

**Failure policy.** Any validation error fails the build. No silent skipping.
Error messages point at the offending file and field. This is what keeps the
leaderboard trustworthy — garbage cannot land accidentally.

**Performance.** At MVP scale (50 models × 500 tasks × 3 reps = 75k files),
cold ingest runs in under 10s on a laptop. Single-pass, no watch mode needed.

**Why manual snapshot promotion.** If every merge bumps the baseline, every
PR shifts deltas for unrelated rows and the Δ column becomes noise. Reviewers
promote a snapshot after a batch lands, matching the "weekly leaderboard update"
cadence the landing status bar implies.

## Aggregation rules

Implemented in `scripts/ingest/aggregate.ts`.

**Grouping.** Trials grouped by `(model_key, adapter)` where
`model_key = slug(model_display) + '/' + adapter` and `slug(s)` lowercases and
replaces any run of non-alphanumeric characters with a single hyphen, trimming
leading/trailing hyphens (so `"Claude Sonnet 4"` → `"claude-sonnet-4"`,
`model_key` → `"claude-sonnet-4/tool_loop"`). All trials in a group must share
the same `dataset_id` — enforced at validation.

**Reward.** Mean across *complete* trials only
(`completeness === 'complete'` and `validity.verifier_completed === true`).
Partial trials count toward `trials` but not `complete_trials`, and are excluded
from the mean. Invalid/unparseable trials contribute `reward = 0` via the
library's own `validate_parseability_reward` constraint.

**Confidence interval.** When `complete_trials >= 3`, compute 95% CI using
bootstrap (10k resamples). Seed the PRNG with a deterministic hash of the
sorted `trial_id`s in the group — same trials always yield the same CI across
machines and builds. Below 3 reps, `reward_ci = null`. Bootstrap is chosen
over normal-approximation because rewards are bounded `[0,1]` and often
skewed — normal CIs misbehave at the edges.

**Per-discipline score.** Group by `domain` (joined via the active
`DatasetManifest`), mean per domain. Missing disciplines (submitter did not run
that domain) → entry omitted from `per_discipline`. UI renders missing as "—",
not zero — zero would incorrectly imply "tried and failed".

**Ranking.** Primary sort = `reward` desc. Tiebreak 1 = `mean_cost_usd` asc
(cheaper wins ties; null sorts last). Tiebreak 2 = `complete_trials` desc
(more reps = more confidence). Per-discipline slices re-rank using that
discipline's score as primary.

**Cost & tokens.** Computed from `cost` on each trial. If `cost === null`, that
trial contributes to reward mean but not to cost aggregates. If no trial in the
group has cost data, `mean_cost_usd = null`. Prevents fake-cheap rankings.

**Delta.** For each row, look up `model_key` in the most recent snapshot;
`delta_vs_previous = reward_now - reward_then`, rounded to 2dp. New rows →
`null`, rendered as "NEW".

## Read surface

Pages never touch `results/` directly. `lib/aec-bench/read.ts`:

```ts
import leaderboardArtefact from '@/public/data/leaderboard.json';
import type { LeaderboardArtefact, LeaderboardEntry } from '@/lib/aec-bench/contracts';

export const leaderboard = leaderboardArtefact as LeaderboardArtefact;

export function getTopN(n: number): LeaderboardEntry[] {
  return leaderboard.entries.slice(0, n);
}

export async function getByDiscipline(domain: string): Promise<LeaderboardArtefact> {
  return (await import(`@/public/data/disciplines/${domain}.json`)).default;
}

export function getRunStatus() {
  return leaderboard.run_status;
}

export function isMock() {
  return leaderboard.is_mock;
}
```

The build-time zod validation is the authoritative check; the `as` cast at the
read boundary is safe because every field was verified before `public/data/`
was written.

### Landing rewire

- `components/landing/data.ts` becomes a thin adapter that maps the first 4
  `LeaderboardEntry`s to the existing `PreviewModel` shape. No landing component
  changes.
- `components/landing/run-status.ts` becomes `export const runStatus = getRunStatus()`.
- The `is_mock` flag drives a new `components/landing/preview-banner.tsx` strip
  (amber, small, sticky) rendered above the nav when mocks are in play:
  *"Synthetic preview data — real results land as aec-bench ships."*

## Model registry

`data/models.yml` shape is defined in *Site-owned types*. Matching rules:

- Substring match, case-insensitive, **first-match-wins**. Order entries
  most-specific first (same convention as `pricing.py`).
- Unknown models fail the build with: *"Unknown model string: `<agent.model>`.
  Add an entry to `data/models.yml` under the relevant provider."*
- Submitters are expected to include the registry update in their submission PR.

**CI parity check** (`pnpm test:registry`): every substring pattern present in
the library's `pricing.py` must also appear in `models.yml`. The check reads
the patterns from a committed snapshot (`data/pricing-snapshot.json`). When the
library updates pricing, a reviewer regenerates the snapshot and the CI check
pulls any new entries into the site. Drift = CI failure with a pointer to the
missing entries.

## Mock data strategy

**Mock experiments live in `results/` alongside real ones**, marked by
`mock: true` in their `submission.yml`. Same ingest pipeline, zero special-casing —
this property is load-bearing: whatever works for mocks works for real data.

**Generator** (`scripts/mock/generate.ts`):

- Deterministic — seeded with `MOCK_SEED=42`. Same seed → same data across
  machines and CI.
- Realistic rewards — drawn from a beta distribution scaled per-model
  (Claude Sonnet 4 → Beta(7, 3), smaller/cheaper models → lower betas), with
  per-discipline variance baked in so the landing's discipline bars differ.
- Plausible costs — derived from `pricing.py` patterns × realistic per-task
  token counts (50k in / 10k out with lognormal spread).
- 4–6 mock models × 2–3 adapters each = 8–14 mock rows, matching the landing's
  current "14 rows · streaming" copy.
- Generates a mock `DatasetManifest` at `results/datasets/aec-bench@0.4.1/manifest.json`
  when no real manifest is present.

**Visual signal.** `leaderboard.is_mock` drives a `PreviewBanner` on every page
that reads the artefact. Status bar dot goes amber and reads
`● PREVIEW · synthetic data`.

**Teardown.** When the first real submission merges, reviewers delete the
`_mock-*` folders in the same PR. Zero migration; the ingest pipeline does not
care.

## Status bar realism

The current landing reads `last_run 2h ago` — fiction under git-static. Replace
with honest timestamps, all derived from real sources:

| Landing label | Source | Example |
|---|---|---|
| `last_submission` | Newest `timestamp` across committed TrialRecords | "3h ago" |
| `last_build` | `generated_at` on the artefact (Vercel build time) | "12m ago" |
| `dataset` | `results/active.json` + manifest | `v0.4.1` |
| `run_id` | Removed — implies a live run, which we do not have |  — |

The `● LIVE` pulse stays but its label changes to
`● LIVE · last submission 3h ago · built 12m ago`. When mocks are in play it
reads `● PREVIEW · synthetic data` in amber.

## Testing

Three tiers, matching the existing `vitest` + `playwright` setup.

**Unit** (`tests/ingest/`):

- zod schemas reject malformed `TrialRecord`, `DatasetManifest`, `submission.yml`
  with specific error messages that identify the bad field.
- aggregation: reward mean ignores partial trials; CI null when reps < 3; CI
  tight when reps = 1000 synthetic identical; ranking tiebreakers in documented
  order; null cost never drags a row up the table.
- registry: first-match-wins, case-insensitive; unknown-model error message
  includes the offending string.
- delta: new rows → null; rows removed from the new build don't crash the
  diff step.

**Integration** (`tests/ingest/fixtures/`):

- Committed fixture trees under `tests/ingest/fixtures/<case>/results/` with a
  matching expected `leaderboard.json` snapshot. Cases: single-experiment,
  multi-experiment-same-model, partial-domain-coverage, all-partial-trials,
  mock-mixed-with-real.
- Run the real ingest script against each fixture, snapshot-compare output.

**E2E** (Playwright, extend existing):

- Landing's rendered row count equals `leaderboard.entries.length`.
- `PreviewBanner` present iff `leaderboard.is_mock === true`.
- Status bar text contains `built Nm ago` and `last submission Nh ago`; numbers
  resolve to non-negative integers.
- Existing landing tests (delta sign, copy-box a11y, sticky status bar) keep
  passing unchanged — rewiring `data.ts` doesn't alter rendered output.

**CI parity** (`pnpm test:registry`): every `pricing.py` pattern covered in
`models.yml`. Runs on every PR.

## What this spec does and does not deliver

Delivers: `results/` layout + ingest pipeline + contracts + model registry +
mock data generator + emitted artefacts + landing rewire + status-bar realism
+ tests + CI parity check.

Does not deliver: any new page. `/leaderboard` still 404s after this lands;
the landing just reads live (mock-for-now) data instead of hand-curated
`data.ts`. The `/leaderboard` page design comes in a separate spec, which can
be written against real shapes once this is merged.

## Open items

None. All decisions resolved during brainstorming:

- Submission model: open + PR-reviewed.
- Storage: git-only static materialisation (A). Supabase sync (B) deferred
  with triggers captured in memory.
- Leaderboard row identity: `(model, adapter)`, repetitions folded into mean
  ± CI.
- Versioning: single active canonical dataset; community datasets deferred.
- Submission atom: one experiment per PR; `results/` in this repo.
- Model registry: site-owned `data/models.yml` with CI parity check against
  `pricing.py`.
- Mock data: lives alongside real data with `mock: true` flag and a visible
  banner.
- Status bar: honest timestamps, no fake `run_id`.
