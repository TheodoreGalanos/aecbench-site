// ABOUTME: Synthetic LibraryCatalogue fixtures for unit tests.
// ABOUTME: Use makeCatalogueEntry({...overrides}) + makeCatalogue({...overrides}); FIXTURE_CATALOGUE is a varied default.
import type {
  LibraryCatalogue,
  LibraryCatalogueEntry,
} from '@/lib/aec-bench/library-catalogue';

const BASE_ENTRY: LibraryCatalogueEntry = {
  task_id: 'voltage-drop',
  discipline: 'electrical',
  category: 'cable-sizing',
  category_label: 'Cable Sizing',
  task_name: 'Voltage Drop Calculation',
  description: 'Cable voltage drop calculation per AS/NZS 3008.1.1.',
  long_description: 'Calculates voltage drop along a cable run using tabulated mV/A/m values.',
  standards: ['AS/NZS 3008.1.1', 'AS/NZS 3000:2018', 'IEC 60364-5-52'],
  tags: ['electrical', 'cable-sizing', 'voltage-drop'],
  inputs: [
    { name: 'cable_size_mm2', description: 'Cable size', unit: 'mm²', type: 'enum' },
    { name: 'length_m', description: 'Route length', unit: 'm', type: 'float' },
  ],
  outputs: [
    { name: 'voltage_drop_v', description: 'Voltage drop', unit: null, tolerance: 0.03 },
  ],
  status: 'built',
  difficulty_tiers: ['easy', 'medium', 'hard'],
  complexity: null,
  tool_mode: 'with-tool',
  archetype_count: 4,
};

export function makeCatalogueEntry(overrides: Partial<LibraryCatalogueEntry> = {}): LibraryCatalogueEntry {
  return { ...BASE_ENTRY, ...overrides };
}

const BUILT_TEMPLATES: LibraryCatalogueEntry[] = [
  makeCatalogueEntry({ task_id: 'voltage-drop', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', task_name: 'Voltage Drop Calculation', status: 'built' }),
  makeCatalogueEntry({ task_id: 'cable-ampacity', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', task_name: 'Cable Ampacity', status: 'built', difficulty_tiers: ['easy', 'medium'] }),
  makeCatalogueEntry({ task_id: 'hudson-armor-sizing', discipline: 'civil', category: 'armor-stability', category_label: 'Armor Stability', task_name: 'Hudson Armor Sizing', status: 'built', archetype_count: 5 }),
  makeCatalogueEntry({ task_id: 'bearing-capacity', discipline: 'ground', category: 'foundations', category_label: 'Foundations', task_name: 'Bearing Capacity', status: 'built', difficulty_tiers: ['medium'] }),
];

const PROPOSED_SEEDS: LibraryCatalogueEntry[] = [
  makeCatalogueEntry({
    task_id: 'gravel-road-thickness',
    discipline: 'civil',
    category: 'access-roads',
    category_label: 'Access Road Design',
    task_name: 'Gravel Road Pavement Thickness',
    description: 'Calculate required pavement thickness for light-duty gravel access road.',
    long_description: undefined,
    tags: undefined,
    inputs: [{ name: 'Subgrade CBR (%)', description: null, unit: null, type: null }],
    outputs: [{ name: 'Thickness (mm)', description: null, unit: null, tolerance: null }],
    status: 'proposed',
    difficulty_tiers: null,
    complexity: 'low',
    tool_mode: null,
    archetype_count: null,
  }),
  makeCatalogueEntry({
    task_id: 'hvac-load',
    discipline: 'mechanical',
    category: 'hvac',
    category_label: 'HVAC',
    task_name: 'HVAC Heating Load',
    description: 'Heating load calculation for a residential zone.',
    long_description: undefined,
    tags: undefined,
    inputs: [{ name: 'Zone volume (m³)', description: null, unit: null, type: null }],
    outputs: [{ name: 'Heating demand (kW)', description: null, unit: null, tolerance: null }],
    status: 'proposed',
    difficulty_tiers: null,
    complexity: 'medium',
    tool_mode: null,
    archetype_count: null,
  }),
  makeCatalogueEntry({
    task_id: 'steel-beam',
    discipline: 'structural',
    category: 'member-design',
    category_label: 'Member Design',
    task_name: 'Steel Beam Sizing',
    description: 'Select a UB section for a simply supported span.',
    long_description: undefined,
    tags: undefined,
    inputs: [{ name: 'Span (m)', description: null, unit: null, type: null }],
    outputs: [{ name: 'Section designation', description: null, unit: null, tolerance: null }],
    status: 'proposed',
    difficulty_tiers: null,
    complexity: 'high',
    tool_mode: null,
    archetype_count: null,
  }),
];

export function makeCatalogue(overrides: Partial<LibraryCatalogue> = {}): LibraryCatalogue {
  const templates = overrides.templates ?? BUILT_TEMPLATES;
  const seeds = overrides.seeds ?? PROPOSED_SEEDS;
  const by_discipline: LibraryCatalogue['counts']['by_discipline'] = {} as LibraryCatalogue['counts']['by_discipline'];
  for (const d of ['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const) {
    by_discipline[d] = {
      templates: templates.filter((t) => t.discipline === d).length,
      seeds: seeds.filter((s) => s.discipline === d).length,
    };
  }
  return {
    schema_version: 1,
    generated_at: '2026-04-19T09:00:00Z',
    library_version: '0.1.0',
    library_commit: '1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    counts: {
      total_templates: templates.length,
      total_seeds: seeds.length,
      by_discipline,
    },
    templates,
    seeds,
    ...overrides,
  };
}

export const FIXTURE_CATALOGUE: LibraryCatalogue = makeCatalogue();
