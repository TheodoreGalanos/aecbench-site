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
        is_mock: false,
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
