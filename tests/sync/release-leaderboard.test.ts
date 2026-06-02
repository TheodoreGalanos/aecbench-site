// ABOUTME: Exercises the release-eval leaderboard sync script against tiny CSV fixtures.
// ABOUTME: Verifies the emitted public/data artefacts match the site leaderboard contract.
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { LeaderboardArtefactSchema } from '@/lib/aec-bench/contracts';

const execFileAsync = promisify(execFile);

function csv(rows: string[][]): string {
  return rows.map((row) => row.join(',')).join('\n') + '\n';
}

describe('release leaderboard sync', () => {
  it('emits real leaderboard, discipline slices, and model stubs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'release-leaderboard-'));
    const analysis = join(root, 'analysis');
    const output = join(root, 'public-data');
    await mkdir(analysis, { recursive: true });

    await writeFile(
      join(root, 'dataset.json'),
      JSON.stringify({
        name: 'release-foundry-full-suite',
        seed: 1,
        created: '2026-05-24T04:14:51.551746Z',
        framework_version: '0.1.0',
        config: 'foundry-full-suite.toml',
        summary: {
          total_instances: 2,
          by_discipline: { civil: 1, electrical: 1 },
          by_difficulty: { easy: 1, hard: 1 },
          by_visibility: { all_given: 1, partial: 1 },
          by_tool_mode: { 'with-tool': 2 },
        },
        instances: [
          {
            path: 'civil/family/template/site-00',
            template: 'template',
            difficulty: 'easy',
            archetype: 'a',
            site_context: 'site',
            visibility: 'all_given',
            tool_mode: 'with-tool',
          },
          {
            path: 'electrical/family/template/site-01',
            template: 'template',
            difficulty: 'hard',
            archetype: 'b',
            site_context: 'site',
            visibility: 'partial',
            tool_mode: 'with-tool',
          },
        ],
      }),
    );

    await writeFile(
      join(analysis, 'model_summary_rectified.csv'),
      csv([
        [
          'mean_failed_fields',
          'mean_input_tokens',
          'mean_output_bytes',
          'mean_output_tokens',
          'mean_rectified_changed_fields',
          'mean_reward',
          'median_reward',
          'model_name',
          'model_slug',
          'n_completed',
          'n_failed',
          'n_trials',
          'partial_credit_rate',
          'perfect_reward_rate',
          'reward_stddev',
          'suite_done',
          'zero_reward_rate',
        ],
        ['0.1', '100', '10', '50', '0', '0.8', '1', 'gpt-5.2', 'gpt-5-2', '2', '0', '2', '0.1', '0.7', '0.05', 'True', '0.2'],
        ['0.2', '120', '12', '80', '0', '0.6', '0.5', 'grok-4.3', 'grok-4-3', '1', '1', '2', '0.2', '0.4', '0.1', 'False', '0.4'],
      ]),
    );

    await writeFile(
      join(analysis, 'cost_speed_quality_frontier_finished.csv'),
      csv([
        [
          'model_slug',
          'model_name',
          'family',
          'mean_reward',
          'reliability_adjusted_reward',
          'repeatability_stddev',
          'failed_rate',
          'zero_reward_rate',
          'partial_credit_rate',
          'n_completed',
          'n_failed',
          'n_trials',
          'completion_rate',
          'median_seconds',
          'p75_seconds',
          'p95_seconds',
          'mean_output_tokens',
          'mean_input_tokens',
          'is_frontier',
        ],
        ['gpt-5-2', 'gpt-5.2', 'OpenAI', '0.8', '0.75', '0.05', '0', '0.2', '0.1', '2', '0', '2', '1', '12.5', '15', '20', '50', '100', 'True'],
        ['grok-4-3', 'grok-4.3', 'Grok', '0.6', '0.5', '0.1', '0.5', '0.4', '0.2', '1', '1', '2', '0.5', '30', '40', '60', '80', '120', 'False'],
      ]),
    );

    await writeFile(
      join(analysis, 'release_trials_rectified.csv'),
      csv([
        ['model_slug', 'discipline', 'status', 'reward'],
        ['gpt-5-2', 'civil', 'completed', '1'],
        ['gpt-5-2', 'electrical', 'completed', '0.6'],
        ['grok-4-3', 'civil', 'completed', '0.6'],
        ['grok-4-3', 'electrical', 'failed', '0'],
      ]),
    );

    await execFileAsync('python3', [
      resolve(__dirname, '../../scripts/sync/release-leaderboard.py'),
      '--analysis-dir',
      analysis,
      '--dataset',
      join(root, 'dataset.json'),
      '--output-dir',
      output,
    ]);

    const artefact = LeaderboardArtefactSchema.parse(
      JSON.parse(await readFile(join(output, 'leaderboard.json'), 'utf-8')),
    );
    expect(artefact.is_mock).toBe(false);
    expect(artefact.dataset.version).toBe('release');
    expect(artefact.entries).toHaveLength(2);
    expect(artefact.entries[0].model_key).toBe('gpt-5-2/tool_loop');
    expect(artefact.entries[0].dataset).toBe('aec-bench@release');
    expect(artefact.entries[0].per_discipline.civil).toBe(1);
    expect(artefact.entries[0].expected_trials).toBe(6);
    expect(artefact.entries[0].completion_rate).toBe(0.3333);

    const civil = LeaderboardArtefactSchema.parse(
      JSON.parse(await readFile(join(output, 'disciplines/civil.json'), 'utf-8')),
    );
    expect(civil.entries[0].reward).toBe(1);

    const model = JSON.parse(await readFile(join(output, 'models/gpt-5-2-tool_loop.json'), 'utf-8'));
    expect(model.suite_done).toBe(true);
  });
});
