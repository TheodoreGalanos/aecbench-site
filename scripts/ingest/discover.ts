// ABOUTME: Walks results/experiments/ and returns the list of experiment folders to ingest.
// ABOUTME: An experiment is a folder that contains a submission.yml file.
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface DiscoveredExperiment {
  id: string;
  dir: string;
  submissionPath: string;
  trialsDir: string;
}

export async function discoverExperiments(projectRoot: string): Promise<DiscoveredExperiment[]> {
  const root = resolve(projectRoot, 'results/experiments');
  let entries;
  try {
    entries = await readdir(root);
  } catch {
    return [];
  }

  const experiments: DiscoveredExperiment[] = [];
  for (const name of entries) {
    const dir = join(root, name);
    const s = await stat(dir);
    if (!s.isDirectory()) continue;
    const submissionPath = join(dir, 'submission.yml');
    try {
      await stat(submissionPath);
    } catch {
      continue;
    }
    experiments.push({
      id: name,
      dir,
      submissionPath,
      trialsDir: join(dir, 'trials'),
    });
  }
  return experiments;
}
