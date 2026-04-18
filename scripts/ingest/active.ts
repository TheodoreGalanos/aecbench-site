// ABOUTME: Loads results/active.json and the referenced DatasetManifest for the active version.
// ABOUTME: Missing files are fatal and name the expected path in the error message.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ActivePointerSchema,
  DatasetManifestSchema,
  type ActivePointer,
  type DatasetManifest,
} from '@/lib/aec-bench/contracts';

export class ActiveLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActiveLoadError';
  }
}

export interface ActiveContext {
  pointer: ActivePointer;
  manifest: DatasetManifest;
  activeKey: string; // "name@version"
}

export async function loadActive(projectRoot: string): Promise<ActiveContext> {
  const pointerPath = resolve(projectRoot, 'results/active.json');
  let pointerRaw: string;
  try {
    pointerRaw = await readFile(pointerPath, 'utf-8');
  } catch {
    throw new ActiveLoadError(`${pointerPath}: file missing — expected { benchmark, version }`);
  }

  let pointer: ActivePointer;
  try {
    pointer = ActivePointerSchema.parse(JSON.parse(pointerRaw));
  } catch (err) {
    throw new ActiveLoadError(`${pointerPath}: ${(err as Error).message}`);
  }

  const activeKey = `${pointer.benchmark}@${pointer.version}`;
  const manifestPath = resolve(projectRoot, `results/datasets/${activeKey}/manifest.json`);

  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, 'utf-8');
  } catch {
    throw new ActiveLoadError(`${manifestPath}: dataset manifest missing for active pointer ${activeKey}`);
  }

  let manifest: DatasetManifest;
  try {
    manifest = DatasetManifestSchema.parse(JSON.parse(manifestRaw));
  } catch (err) {
    throw new ActiveLoadError(`${manifestPath}: ${(err as Error).message}`);
  }

  return { pointer, manifest, activeKey };
}
