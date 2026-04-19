// tests/discipline/library-catalogue-read.test.ts
// ABOUTME: Tests the getCatalogueForDiscipline grouping + totals arithmetic.
// ABOUTME: Uses the fixture builder so assertions are independent of real data.
import { describe, it, expect } from 'vitest';
import { getCatalogueForDiscipline } from '@/lib/aec-bench/library-catalogue';
import { makeCatalogue, makeCatalogueEntry } from './fixtures/catalogue';

describe('getCatalogueForDiscipline', () => {
  const catalogue = makeCatalogue({
    templates: [
      makeCatalogueEntry({ task_id: 't1', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'built' }),
      makeCatalogueEntry({ task_id: 't2', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'built' }),
      makeCatalogueEntry({ task_id: 't3', discipline: 'electrical', category: 'fault-current', category_label: 'Fault Current', status: 'built' }),
      makeCatalogueEntry({ task_id: 't4', discipline: 'civil', category: 'armor-stability', category_label: 'Armor Stability', status: 'built' }),
    ],
    seeds: [
      makeCatalogueEntry({ task_id: 's1', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'proposed', difficulty_tiers: null, complexity: 'low' }),
      makeCatalogueEntry({ task_id: 's2', discipline: 'electrical', category: 'lighting', category_label: null, status: 'proposed', difficulty_tiers: null, complexity: 'medium' }),
    ],
  });

  it('filters templates and seeds to the given discipline', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    expect(slice.templates.map((t) => t.task_id).sort()).toEqual(['t1', 't2', 't3']);
    expect(slice.seeds.map((s) => s.task_id).sort()).toEqual(['s1', 's2']);
  });

  it('groups by category with counts and status split', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    const cableSizing = slice.categories.find((c) => c.key === 'cable-sizing');
    expect(cableSizing?.label).toBe('Cable Sizing');
    expect(cableSizing?.built.map((e) => e.task_id).sort()).toEqual(['t1', 't2']);
    expect(cableSizing?.proposed.map((e) => e.task_id)).toEqual(['s1']);
  });

  it('uses category slug (prettified) when category_label is null', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    const lighting = slice.categories.find((c) => c.key === 'lighting');
    expect(lighting?.label).toBe('Lighting'); // prettified from 'lighting'
  });

  it('orders categories alphabetically by label', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    const labels = slice.categories.map((c) => c.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it('computes totals consistent with per-entry counts', () => {
    const slice = getCatalogueForDiscipline('electrical', catalogue);
    expect(slice.totals.tasks).toBe(5);
    expect(slice.totals.built).toBe(3);
    expect(slice.totals.proposed).toBe(2);
    expect(slice.totals.categories).toBe(3); // cable-sizing, fault-current, lighting
    expect(slice.totals.standards).toBeGreaterThan(0);
  });

  it('returns empty categories array for a discipline with no entries', () => {
    const slice = getCatalogueForDiscipline('structural', catalogue);
    expect(slice.templates).toEqual([]);
    expect(slice.seeds).toEqual([]);
    expect(slice.categories).toEqual([]);
    expect(slice.totals).toEqual({ tasks: 0, built: 0, proposed: 0, categories: 0, standards: 0 });
  });
});
