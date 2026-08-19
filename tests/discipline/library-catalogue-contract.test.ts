// ABOUTME: Tests the transitional reader for deterministic v2 and retained v1 catalogues.
// ABOUTME: Confirms counts are derived and all public catalogue disciplines are accepted.
import { describe, it, expect } from 'vitest';
import {
  LibraryCatalogueSchema,
  LibraryCatalogueEntrySchema,
  parseLibraryCatalogue,
} from '@/lib/aec-bench/library-catalogue';
import { FIXTURE_CATALOGUE, makeCatalogueEntry } from './fixtures/catalogue';

describe('LibraryCatalogueSchema', () => {
  it('accepts the current fixture catalogue', () => {
    const parsed = LibraryCatalogueSchema.parse(FIXTURE_CATALOGUE);
    expect(parsed.schema_version).toBe(2);
    expect(parsed.counts.total_templates).toBe(FIXTURE_CATALOGUE.templates.length);
  });

  it('accepts schema 2 and derives counts from the entry arrays', () => {
    const maritime = {
      ...makeCatalogueEntry({ task_id: 'rule-length', category: 'ship-geometry' }),
      discipline: 'maritime',
    };
    const v2 = {
      schema_version: 2,
      templates: [...FIXTURE_CATALOGUE.templates, maritime],
      seeds: FIXTURE_CATALOGUE.seeds,
    };

    const parsed = parseLibraryCatalogue(v2);

    expect(parsed.schema_version).toBe(2);
    expect(parsed.counts.total_templates).toBe(v2.templates.length);
    expect(parsed.counts.by_discipline.maritime).toEqual({ templates: 1, seeds: 0 });
  });

  it('keeps schema 1 as a bounded read transition but derives its counts', () => {
    const v1 = {
      schema_version: 1,
      generated_at: '2026-04-19T09:00:00Z',
      library_version: '0.1.0',
      library_commit: null,
      counts: {
        ...FIXTURE_CATALOGUE.counts,
        total_templates: 999,
      },
      templates: FIXTURE_CATALOGUE.templates,
      seeds: FIXTURE_CATALOGUE.seeds,
    };

    const parsed = parseLibraryCatalogue(v1);

    expect(parsed.schema_version).toBe(1);
    expect(parsed.counts.total_templates).toBe(v1.templates.length);
  });

  it('rejects unsupported catalogue schemas', () => {
    expect(() => parseLibraryCatalogue({ schema_version: 99, templates: [], seeds: [] })).toThrow();
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

  it('accepts maritime catalogue entries', () => {
    const entry = { ...makeCatalogueEntry(), discipline: 'maritime' };
    expect(() => LibraryCatalogueEntrySchema.parse(entry)).not.toThrow();
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
