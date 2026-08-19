// ABOUTME: Typed reader for generated task-template detail supplements.
// ABOUTME: Supplies rich params/archetype/difficulty metadata to server-rendered task pages.
import { z } from 'zod';
import type { CatalogueDiscipline } from '@/lib/aec-bench/contracts';
import artefact from '@/data/template-detail-supplements.json';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface TemplateParameterDetail {
  name: string;
  type: 'float' | 'int' | 'enum';
  description: string;
  unit?: string;
  range?: { min: number; max: number };
  values?: string[];
  defaultValue?: string;
  optional?: boolean;
  derivableFrom?: string;
}

export interface TemplateArchetypeDetail {
  name: string;
  description: string;
  siteContexts: string[];
  fields: Array<{
    name: string;
    range?: { min: number; max: number };
    values?: string[];
  }>;
}

export interface TemplateDifficultyDetail {
  level: DifficultyLevel;
  description: string;
  visibility: 'all_given' | 'partial' | 'scenario_only';
  archetypes: string[];
  hiddenParams: string[];
  replacementText?: string;
  lockedValues?: Array<{ name: string; values: string[] }>;
}

export interface TemplateSampleInstance {
  name: string;
  difficulty: DifficultyLevel;
  visibility: 'all_given' | 'partial' | 'scenario_only';
  archetype: string;
  siteContext: string;
  toolScripts: string[];
  visibleInputs: Array<{ name: string; value: string; unit?: string }>;
  hiddenInputs: string[];
  withheldOutputs: string[];
  promptExcerpt: string;
}

export interface TemplateDetailSupplement {
  key: string;
  sourcePath: string;
  parameters: TemplateParameterDetail[];
  outputs: Array<{ name: string; description: string; unit?: string; tolerance?: number }>;
  archetypes: TemplateArchetypeDetail[];
  difficulty: TemplateDifficultyDetail[];
  sampleInstance?: TemplateSampleInstance;
}

const RangeSchema = z.object({ min: z.number(), max: z.number() });

const ParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['float', 'int', 'enum']),
  description: z.string(),
  unit: z.string().optional(),
  range: RangeSchema.optional(),
  values: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
  optional: z.boolean().optional(),
  derivableFrom: z.string().optional(),
});

const ArchetypeSchema = z.object({
  name: z.string(),
  description: z.string(),
  siteContexts: z.array(z.string()),
  fields: z.array(
    z.object({
      name: z.string(),
      range: RangeSchema.optional(),
      values: z.array(z.string()).optional(),
    }),
  ),
});

const DifficultySchema = z.object({
  level: z.enum(['easy', 'medium', 'hard']),
  description: z.string(),
  visibility: z.enum(['all_given', 'partial', 'scenario_only']),
  archetypes: z.array(z.string()),
  hiddenParams: z.array(z.string()),
  replacementText: z.string().optional(),
  lockedValues: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).optional(),
});

const SampleSchema = z.object({
  name: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  visibility: z.enum(['all_given', 'partial', 'scenario_only']),
  archetype: z.string(),
  siteContext: z.string(),
  toolScripts: z.array(z.string()),
  visibleInputs: z.array(z.object({ name: z.string(), value: z.string(), unit: z.string().optional() })),
  hiddenInputs: z.array(z.string()),
  withheldOutputs: z.array(z.string()),
  promptExcerpt: z.string(),
});

const DetailSchema = z.object({
  key: z.string(),
  sourcePath: z.string(),
  parameters: z.array(ParameterSchema),
  outputs: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      unit: z.string().optional(),
      tolerance: z.number().optional(),
    }),
  ),
  archetypes: z.array(ArchetypeSchema),
  difficulty: z.array(DifficultySchema),
  sampleInstance: SampleSchema.optional(),
});

const ArtefactSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string(),
  source_commit: z.string().nullable(),
  template_count: z.number().int().nonnegative(),
  templates: z.record(z.string(), DetailSchema),
});

export type TemplateDetailArtefact = z.infer<typeof ArtefactSchema>;

let cached: TemplateDetailArtefact | null = null;

export function templateDetailKey(discipline: CatalogueDiscipline, taskId: string): string {
  return `${discipline}/${taskId}`;
}

export function getTemplateDetailArtefact(): TemplateDetailArtefact {
  if (cached) return cached;
  const parsed = ArtefactSchema.safeParse(artefact as unknown);
  if (!parsed.success) {
    throw new Error(`Template detail supplements failed validation: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return cached;
}

export function getTemplateDetailSupplement(
  discipline: CatalogueDiscipline,
  taskId: string,
): TemplateDetailSupplement | null {
  return getTemplateDetailArtefact().templates[templateDetailKey(discipline, taskId)] ?? null;
}
