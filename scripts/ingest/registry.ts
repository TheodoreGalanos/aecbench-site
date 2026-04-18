// scripts/ingest/registry.ts
// ABOUTME: Loads data/models.yml and resolves raw library model strings to canonical entries.
// ABOUTME: Substring match, case-insensitive, first-match-wins — mirrors aec-bench pricing.py.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { z } from 'zod';
import { ModelEntrySchema, type ModelEntry } from '@/lib/aec-bench/contracts';

export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

const REGISTRY_PATH = resolve(process.cwd(), 'data/models.yml');
const RegistryFileSchema = z.array(ModelEntrySchema);

export async function loadRegistry(path: string = REGISTRY_PATH): Promise<ModelEntry[]> {
  const raw = await readFile(path, 'utf-8');
  const parsed = load(raw);
  return RegistryFileSchema.parse(parsed);
}

export function resolveModel(libraryModel: string, registry: ModelEntry[]): ModelEntry {
  const needle = libraryModel.toLowerCase();
  for (const entry of registry) {
    if (needle.includes(entry.match.toLowerCase())) {
      return entry;
    }
  }
  throw new RegistryError(
    `Unknown model string: "${libraryModel}". Add an entry to data/models.yml under the relevant provider.`,
  );
}

export function slugify(display: string): string {
  return display
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function modelKey(entry: ModelEntry, adapter: string): string {
  return `${slugify(entry.display)}/${adapter}`;
}
