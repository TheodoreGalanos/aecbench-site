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
