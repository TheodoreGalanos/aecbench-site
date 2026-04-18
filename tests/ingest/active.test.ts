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
