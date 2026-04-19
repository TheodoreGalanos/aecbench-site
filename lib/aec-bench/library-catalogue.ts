// ABOUTME: Zod contract mirroring the aec-bench library-catalogue v1 export shape.
// ABOUTME: Read helpers (getCatalogue, getCatalogueForDiscipline) live alongside in Task 4.
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
  difficulty_tiers: z.array(z.enum(['easy', 'medium', 'hard'])).nullable(),
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
