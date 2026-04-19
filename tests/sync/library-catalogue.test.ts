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
    const target = join(tmp, 'site', 'data', 'library-catalogue.json');
    mkdirSync(join(tmp, 'aec-bench', 'artefacts'), { recursive: true });
    writeFileSync(source, JSON.stringify(makeCatalogue(), null, 2));

    syncCatalogue({ aecBenchRoot: join(tmp, 'aec-bench'), target });

    expect(existsSync(target)).toBe(true);
    const written = JSON.parse(readFileSync(target, 'utf-8'));
    expect(written.schema_version).toBe(1);
  });

  it('throws an actionable error when source is missing', () => {
    const missing = join(tmp, 'nonexistent');
    const target = join(tmp, 'data', 'library-catalogue.json');
    expect(() => syncCatalogue({ aecBenchRoot: missing, target })).toThrow(
      /Library catalogue not found/,
    );
  });

  it('throws when source exists but fails schema validation', () => {
    const source = join(tmp, 'aec-bench', 'artefacts', 'library-catalogue.json');
    const target = join(tmp, 'site', 'data', 'library-catalogue.json');
    mkdirSync(join(tmp, 'aec-bench', 'artefacts'), { recursive: true });
    writeFileSync(source, JSON.stringify({ schema_version: 99 }));

    expect(() => syncCatalogue({ aecBenchRoot: join(tmp, 'aec-bench'), target })).toThrow(
      /validation|schema_version/i,
    );
  });

  it('creates the target directory if missing', () => {
    const source = join(tmp, 'aec-bench', 'artefacts', 'library-catalogue.json');
    const target = join(tmp, 'site', 'data', 'library-catalogue.json');
    mkdirSync(join(tmp, 'aec-bench', 'artefacts'), { recursive: true });
    writeFileSync(source, JSON.stringify(makeCatalogue(), null, 2));

    syncCatalogue({ aecBenchRoot: join(tmp, 'aec-bench'), target });

    expect(existsSync(target)).toBe(true);
  });
});
