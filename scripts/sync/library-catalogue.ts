// ABOUTME: Dev sync — copies sibling aec-bench/artefacts/library-catalogue.json into data/.
// ABOUTME: Preserves deterministic catalogue bytes after validating schema 2 or the bounded v1 transition.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { LibraryCatalogueSchema } from '@/lib/aec-bench/library-catalogue';

export interface SyncCatalogueOptions {
  aecBenchRoot: string;
  target: string;
}

export function syncCatalogue(opts: SyncCatalogueOptions): void {
  const source = resolve(opts.aecBenchRoot, 'artefacts', 'library-catalogue.json');

  if (!existsSync(source)) {
    throw new Error(
      `Library catalogue not found at: ${source}\n\n` +
        `Resolve by either:\n` +
        `  1. Running 'aec-bench library export' in the sibling repo, OR\n` +
        `  2. Setting AEC_BENCH_ROOT to the library checkout path`,
    );
  }

  const raw = readFileSync(source, 'utf-8');
  const data = JSON.parse(raw);
  const parsed = LibraryCatalogueSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Library catalogue at ${source} failed schema validation:\n${parsed.error.message}`,
    );
  }

  const target = resolve(opts.target);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, raw.endsWith('\n') ? raw : `${raw}\n`);

  // eslint-disable-next-line no-console
  console.log(
    `[sync:catalogue] ${source} → ${target}\n` +
      `              schema ${parsed.data.schema_version} · ${parsed.data.counts.total_templates} templates · ` +
      `${parsed.data.counts.total_seeds} seeds`,
  );
}

// CLI entry — only runs when invoked directly via tsx.
const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('library-catalogue.ts');
if (isMain) {
  const aecBenchRoot = process.env.AEC_BENCH_ROOT ?? join(process.cwd(), '..', 'aec-bench');
  const target = join(process.cwd(), 'data', 'library-catalogue.json');
  try {
    syncCatalogue({ aecBenchRoot, target });
  } catch (e) {
    console.error(`\n${(e as Error).message}`);
    process.exit(1);
  }
}
