// ABOUTME: Loads the active dataset and normalises current or bounded legacy manifests.
// ABOUTME: Derives site domains from semantic task IDs instead of stored legacy domain metadata.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ActivePointerSchema,
  DatasetManifestV2Schema,
  LegacyDatasetManifestSchema,
  type ActivePointer,
  type DatasetSelection,
  DOMAINS,
  type Domain,
} from '@/lib/aec-bench/contracts';

export class ActiveLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActiveLoadError';
  }
}

export interface ActiveContext {
  pointer: ActivePointer;
  manifest: DatasetSelection;
  activeKey: string;
}

export async function loadActive(projectRoot: string): Promise<ActiveContext> {
  const pointerPath = resolve(projectRoot, 'results/active.json');
  let pointerRaw: string;
  try {
    pointerRaw = await readFile(pointerPath, 'utf-8');
  } catch {
    throw new ActiveLoadError(
      `${pointerPath}: file missing — expected { dataset_id, release_label }`,
    );
  }

  let pointer: ActivePointer;
  try {
    pointer = ActivePointerSchema.parse(JSON.parse(pointerRaw));
  } catch (err) {
    throw new ActiveLoadError(`${pointerPath}: ${(err as Error).message}`);
  }

  const activeKey = `${pointer.dataset_id}@${pointer.release_label}`;
  const manifestPath = resolve(projectRoot, `results/datasets/${activeKey}/manifest.json`);

  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, 'utf-8');
  } catch {
    throw new ActiveLoadError(`${manifestPath}: dataset manifest missing for active pointer ${activeKey}`);
  }

  let manifest: DatasetSelection;
  try {
    const raw = JSON.parse(manifestRaw) as { schema_version?: unknown };
    if (raw.schema_version === 2) {
      const current = DatasetManifestV2Schema.parse(raw);
      if (current.dataset_id !== pointer.dataset_id) {
        throw new Error(
          `manifest dataset_id "${current.dataset_id}" does not match active pointer "${pointer.dataset_id}"`,
        );
      }
      manifest = {
        dataset_id: current.dataset_id,
        release_label: pointer.release_label,
        description: current.description,
        tasks: current.tasks.map((task) => ({
          task_id: task.task_id,
          domain: domainFromTaskId(task.task_id),
        })),
      };
    } else {
      const legacy = LegacyDatasetManifestSchema.parse(raw);
      if (legacy.name !== pointer.dataset_id || legacy.version !== pointer.release_label) {
        throw new Error('legacy manifest name and version do not match the active pointer');
      }
      manifest = {
        dataset_id: legacy.name,
        release_label: legacy.version,
        description: legacy.description.summary,
        tasks: legacy.tasks.map((task) => ({ task_id: task.task_id, domain: task.domain })),
      };
    }
  } catch (err) {
    throw new ActiveLoadError(`${manifestPath}: ${(err as Error).message}`);
  }

  return { pointer, manifest, activeKey };
}

function domainFromTaskId(taskId: string): Domain {
  const domain = taskId.split('/', 1)[0];
  if (!(DOMAINS as readonly string[]).includes(domain)) {
    throw new Error(`task_id "${taskId}" does not start with a supported leaderboard domain`);
  }
  return domain as Domain;
}
