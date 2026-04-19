// scripts/mock/generate.ts
// ABOUTME: Deterministic mock generator — produces a full results/ tree for the active dataset.
// ABOUTME: Rewards drawn from per-model beta distributions; costs derived from pricing table.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
  { library: 'claude-opus-4-7-lambda', display: 'claude-opus-4-7-lambda', adapter: 'lambda-rlm', alpha: 8, beta: 2, pricePerMtokIn: 15, pricePerMtokOut: 75 },
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
  // Box-Muller transform
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
