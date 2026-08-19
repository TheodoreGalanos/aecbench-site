// ABOUTME: Exercises current and bounded legacy active-dataset ingestion.
// ABOUTME: Both source forms normalise to one stable dataset selection for the site.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { loadActive, ActiveLoadError } from '@/scripts/ingest/active';

const ROOT = resolve(__dirname, 'fixtures/active');
const CURRENT_ROOT = resolve(__dirname, 'fixtures/active-current');
const EMPTY = resolve(__dirname, 'fixtures/nonexistent');

describe('loadActive', () => {
  it('normalises the bounded legacy fixture', async () => {
    const { pointer, manifest, activeKey } = await loadActive(ROOT);
    expect(pointer.dataset_id).toBe('aec-bench');
    expect(pointer.release_label).toBe('0.4.1');
    expect(activeKey).toBe('aec-bench@0.4.1');
    expect(manifest.tasks.length).toBeGreaterThan(0);
  });

  it('loads a current schema-2 dataset without identity layers', async () => {
    const { pointer, manifest, activeKey } = await loadActive(CURRENT_ROOT);
    expect(pointer).toEqual({ dataset_id: 'aec-bench', release_label: 'public-2026' });
    expect(activeKey).toBe('aec-bench@public-2026');
    expect(manifest).toMatchObject({
      dataset_id: 'aec-bench',
      release_label: 'public-2026',
      tasks: [{ task_id: 'electrical/pf-droop', domain: 'electrical' }],
    });
  });

  it('throws ActiveLoadError when results/active.json is missing', async () => {
    await expect(loadActive(EMPTY)).rejects.toThrow(ActiveLoadError);
  });
});
