// ABOUTME: Sanity test for the synthetic LibraryCatalogue fixture helpers.
// ABOUTME: Guards fixture shape so downstream tests can rely on it.
import { describe, it, expect } from 'vitest';
import { makeCatalogueEntry, makeCatalogue, FIXTURE_CATALOGUE } from './catalogue';
import { LibraryCatalogueSchema, LibraryCatalogueEntrySchema } from '@/lib/aec-bench/library-catalogue';

describe('fixture catalogue', () => {
  it('makeCatalogueEntry produces a schema-valid entry with overridable fields', () => {
    const e = makeCatalogueEntry({ task_name: 'Override Test', discipline: 'electrical' });
    const parsed = LibraryCatalogueEntrySchema.parse(e);
    expect(parsed.task_name).toBe('Override Test');
    expect(parsed.discipline).toBe('electrical');
  });

  it('makeCatalogue wraps entries into a schema-valid catalogue', () => {
    const cat = makeCatalogue({ templates: [makeCatalogueEntry({ status: 'built' })] });
    expect(() => LibraryCatalogueSchema.parse(cat)).not.toThrow();
  });

  it('FIXTURE_CATALOGUE is schema-valid, has both built and proposed entries, and spans ≥3 disciplines', () => {
    expect(() => LibraryCatalogueSchema.parse(FIXTURE_CATALOGUE)).not.toThrow();
    expect(FIXTURE_CATALOGUE.templates.length).toBeGreaterThan(0);
    expect(FIXTURE_CATALOGUE.seeds.length).toBeGreaterThan(0);
    const disciplines = new Set([
      ...FIXTURE_CATALOGUE.templates.map((t) => t.discipline),
      ...FIXTURE_CATALOGUE.seeds.map((s) => s.discipline),
    ]);
    expect(disciplines.size).toBeGreaterThanOrEqual(3);
  });
});
