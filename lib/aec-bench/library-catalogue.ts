// ABOUTME: Zod contract + read helpers for the aec-bench library-catalogue v1 export.
// ABOUTME: Static import from data/library-catalogue.json; schema_version mismatch fails the build.
import { z } from 'zod';
import { DOMAINS } from '@/lib/aec-bench/contracts';

export const CatalogueIOSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  type: z.string().nullable().optional(),
  tolerance: z.number().nullable().optional(),
});
export type CatalogueIO = z.infer<typeof CatalogueIOSchema>;

export const LibraryCatalogueEntrySchema = z.object({
  task_id: z.string().min(1),
  discipline: z.enum(DOMAINS),
  category: z.string().min(1),
  category_label: z.string().nullable(),
  task_name: z.string().min(1),
  description: z.string(),
  long_description: z.string().optional(),
  standards: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  inputs: z.array(CatalogueIOSchema),
  outputs: z.array(CatalogueIOSchema),
  status: z.enum(['built', 'proposed']),
  difficulty_tiers: z.array(z.enum(['easy', 'medium', 'hard'])).nullable().optional(),
  complexity: z.enum(['low', 'medium', 'high']).nullable().optional(),
  tool_mode: z.string().nullable().optional(),
  archetype_count: z.number().int().nullable().optional(),
});
export type LibraryCatalogueEntry = z.infer<typeof LibraryCatalogueEntrySchema>;

const DisciplineCountsSchema = z.object({
  templates: z.number().int().nonnegative(),
  seeds: z.number().int().nonnegative(),
});

const ByDisciplineSchema = z.object({
  civil: DisciplineCountsSchema,
  electrical: DisciplineCountsSchema,
  ground: DisciplineCountsSchema,
  mechanical: DisciplineCountsSchema,
  structural: DisciplineCountsSchema,
});

export const LibraryCatalogueSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string().min(1),
  library_version: z.string().min(1),
  library_commit: z.string().min(1),
  counts: z.object({
    total_templates: z.number().int().nonnegative(),
    total_seeds: z.number().int().nonnegative(),
    by_discipline: ByDisciplineSchema,
  }),
  templates: z.array(LibraryCatalogueEntrySchema),
  seeds: z.array(LibraryCatalogueEntrySchema),
});
export type LibraryCatalogue = z.infer<typeof LibraryCatalogueSchema>;

import artefact from '@/data/library-catalogue.json';
import type { Domain } from '@/lib/aec-bench/contracts';

let cached: LibraryCatalogue | null = null;

function prettifyCategory(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getCatalogue(): LibraryCatalogue {
  if (cached) return cached;
  const parsed = LibraryCatalogueSchema.safeParse(artefact as unknown);
  if (!parsed.success) {
    const raw = artefact as { schema_version?: unknown };
    const msg =
      typeof raw.schema_version === 'number' && raw.schema_version !== 1
        ? `Library catalogue schema_version ${raw.schema_version} unsupported (site supports v1). Re-run 'pnpm sync:catalogue' or upgrade the site.`
        : `Library catalogue failed validation: ${parsed.error.message}`;
    throw new Error(msg);
  }
  cached = parsed.data;
  return cached;
}

export interface DisciplineCatalogueSlice {
  templates: LibraryCatalogueEntry[];
  seeds: LibraryCatalogueEntry[];
  categories: Array<{
    key: string;
    label: string;
    built: LibraryCatalogueEntry[];
    proposed: LibraryCatalogueEntry[];
  }>;
  totals: {
    tasks: number;
    built: number;
    proposed: number;
    categories: number;
    standards: number;
  };
}

export function getCatalogueForDiscipline(
  domain: Domain,
  catalogue: LibraryCatalogue = getCatalogue(),
): DisciplineCatalogueSlice {
  const templates = catalogue.templates.filter((t) => t.discipline === domain);
  const seeds = catalogue.seeds.filter((s) => s.discipline === domain);

  const byCategory = new Map<string, { label: string; built: LibraryCatalogueEntry[]; proposed: LibraryCatalogueEntry[] }>();
  for (const entry of [...templates, ...seeds]) {
    const key = entry.category;
    if (!byCategory.has(key)) {
      byCategory.set(key, {
        label: entry.category_label ?? prettifyCategory(key),
        built: [],
        proposed: [],
      });
    }
    const bucket = byCategory.get(key)!;
    if (entry.status === 'built') bucket.built.push(entry);
    else bucket.proposed.push(entry);
  }

  const categories = Array.from(byCategory.entries())
    .map(([key, v]) => ({ key, label: v.label, built: v.built, proposed: v.proposed }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const standards = new Set<string>();
  for (const e of [...templates, ...seeds]) for (const s of e.standards) standards.add(s);

  return {
    templates,
    seeds,
    categories,
    totals: {
      tasks: templates.length + seeds.length,
      built: templates.length,
      proposed: seeds.length,
      categories: categories.length,
      standards: standards.size,
    },
  };
}
