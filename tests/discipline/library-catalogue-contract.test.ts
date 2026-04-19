// ABOUTME: Tests the zod contract for the library catalogue (v1 schema).
// ABOUTME: Round-trips the fixture, exercises schema_version gate, checks required fields.
import { describe, it, expect } from 'vitest';
import {
  LibraryCatalogueSchema,
  LibraryCatalogueEntrySchema,
} from '@/lib/aec-bench/library-catalogue';
import { FIXTURE_CATALOGUE, makeCatalogueEntry, makeCatalogue } from './fixtures/catalogue';

describe('LibraryCatalogueSchema', () => {
  it('accepts the fixture catalogue (v1 round-trip)', () => {
    const parsed = LibraryCatalogueSchema.parse(FIXTURE_CATALOGUE);
    expect(parsed.schema_version).toBe(1);
    expect(parsed.counts.total_templates).toBe(FIXTURE_CATALOGUE.templates.length);
  });

  it('rejects schema_version 2 (v2 not supported)', () => {
    const v2 = { ...FIXTURE_CATALOGUE, schema_version: 2 };
    expect(() => LibraryCatalogueSchema.parse(v2)).toThrow();
  });

  it('requires counts.by_discipline for every domain', () => {
    const missing = makeCatalogue();
    // @ts-expect-error — deliberately malformed for test
    delete missing.counts.by_discipline.structural;
    expect(() => LibraryCatalogueSchema.parse(missing)).toThrow();
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
