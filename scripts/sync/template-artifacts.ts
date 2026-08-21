// ABOUTME: Mirrors public task instructions and contracts from one pinned aec-bench commit.
// ABOUTME: Emits bounded per-task JSON so static pages never depend on GitHub at runtime.
import { execFileSync } from 'node:child_process';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import supplements from '../../data/template-detail-supplements.json';

const GITHUB_REPOSITORY = 'TheodoreGalanos/aec-bench';
const MAX_FILE_BYTES = 64_000;

interface DetailRecord {
  sourcePath: string;
}

interface SupplementArtefact {
  source_commit: string | null;
  templates: Record<string, DetailRecord>;
}

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function git(repo: string, ...args: string[]) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: MAX_FILE_BYTES * 2 });
}

async function resolveCommit(shortCommit: string, repo?: string) {
  if (repo) return git(repo, 'rev-parse', `${shortCommit}^{commit}`).trim();
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/commits/${shortCommit}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`Cannot resolve library commit ${shortCommit}: HTTP ${response.status}`);
  const payload = await response.json() as { sha?: string };
  if (!payload.sha) throw new Error(`GitHub returned no SHA for library commit ${shortCommit}`);
  return payload.sha;
}

async function readSource(commit: string, path: string, repo?: string) {
  const content = repo
    ? git(repo, 'show', `${commit}:${path}`)
    : await (async () => {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${commit}/${path}`);
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
        return response.text();
      })();
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > MAX_FILE_BYTES) throw new Error(`${path}: ${bytes} bytes exceeds ${MAX_FILE_BYTES}`);
  return content;
}

async function main() {
  const source = supplements as SupplementArtefact;
  if (!source.source_commit) throw new Error('template-detail-supplements.json has no source_commit');

  const repo = argument('--repo');
  const commit = await resolveCommit(source.source_commit, repo);
  const outputRoot = resolve(process.cwd(), 'data/template-artifacts');
  const temporaryRoot = resolve(process.cwd(), 'data/.template-artifacts-build');
  const files: Record<string, string> = {};

  await rm(temporaryRoot, { recursive: true, force: true });
  for (const [key, detail] of Object.entries(source.templates).sort(([a], [b]) => a.localeCompare(b))) {
    const templateDir = dirname(detail.sourcePath);
    const instructionPath = join(templateDir, 'instruction.md');
    const paramsPath = detail.sourcePath;
    const [discipline, taskId] = key.split('/');
    const outputPath = join(temporaryRoot, discipline, `${taskId}.json`);
    const artefact = {
      schemaVersion: 1,
      sourceCommit: commit,
      sourcePath: templateDir,
      instructionPath,
      paramsPath,
      instruction: await readSource(commit, instructionPath, repo),
      paramsToml: await readSource(commit, paramsPath, repo),
    };
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(artefact)}\n`);
    files[key] = relative(temporaryRoot, outputPath);
  }

  await writeFile(join(temporaryRoot, 'manifest.json'), `${JSON.stringify({
    schema_version: 1,
    source_commit: commit,
    template_count: Object.keys(files).length,
    files,
  }, null, 2)}\n`);
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(dirname(outputRoot), { recursive: true });
  await rename(temporaryRoot, outputRoot);
  process.stdout.write(`[template-artifacts] ${Object.keys(files).length} templates at ${commit}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
