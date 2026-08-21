// ABOUTME: Reads bounded per-task source artefacts generated from a pinned aec-bench commit.
// ABOUTME: Keeps instruction and contract access at build time for fully static task pages.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const MAX_FILE_CHARACTERS = 64_000;

const ManifestSchema = z.object({
  schema_version: z.literal(1),
  source_commit: z.string().regex(/^[0-9a-f]{40}$/),
  template_count: z.number().int().nonnegative(),
  files: z.record(z.string(), z.string()),
});

const TemplateArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  sourceCommit: z.string().regex(/^[0-9a-f]{40}$/),
  sourcePath: z.string(),
  instructionPath: z.string(),
  paramsPath: z.string(),
  instruction: z.string().max(MAX_FILE_CHARACTERS),
  paramsToml: z.string().max(MAX_FILE_CHARACTERS),
});

export type TemplateArtifact = z.infer<typeof TemplateArtifactSchema>;

const root = join(process.cwd(), 'data/template-artifacts');
let manifest: z.infer<typeof ManifestSchema> | null = null;

function readManifest() {
  if (!manifest) {
    manifest = ManifestSchema.parse(JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')));
    if (Object.keys(manifest.files).length !== manifest.template_count) {
      throw new Error('Template artefact manifest count does not match its file map');
    }
  }
  return manifest;
}

export function getTemplateArtifactCommit() {
  return readManifest().source_commit;
}

export function getTemplateArtifact(discipline: string, taskId: string): TemplateArtifact {
  const currentManifest = readManifest();
  const key = `${discipline}/${taskId}`;
  const path = currentManifest.files[key];
  if (!path) throw new Error(`No template artefact for ${key}`);
  const artefact = TemplateArtifactSchema.parse(JSON.parse(readFileSync(join(root, path), 'utf8')));
  if (artefact.sourceCommit !== currentManifest.source_commit) {
    throw new Error(`${key}: source commit does not match template artefact manifest`);
  }
  return artefact;
}
