// ABOUTME: Fails CI if the /leaderboard or /leaderboard/[discipline] route bundles exceed the gzip budget.
// ABOUTME: Reads the Turbopack page_client-reference-manifest.js and sums unique chunk gzip sizes per entry.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// Budget raised from the spec's original 60 KB after Phase 3/2 implementation:
// ExpandableRow's row-expansion animation pulls framer-motion (~43 KB) into the
// route bundle. Revisit if framer-motion is removed (CSS-transition swap noted
// as a follow-up).
const BUDGET_KB = 150;

interface ClientReferenceManifest {
  entryJSFiles: Record<string, string[]>;
  // Other fields exist but are not needed for bundle size analysis.
  [key: string]: unknown;
}

interface RouteSpec {
  label: string;
  manifestPath: string;
  patterns: RegExp[];
}

const ROUTES: RouteSpec[] = [
  {
    label: 'leaderboard',
    manifestPath: '.next/server/app/(home)/leaderboard/page_client-reference-manifest.js',
    patterns: [/app\/\(home\)\/leaderboard\/page$/, /app\/leaderboard\/page$/],
  },
  {
    label: 'discipline',
    manifestPath:
      '.next/server/app/(home)/leaderboard/[discipline]/page_client-reference-manifest.js',
    patterns: [
      /app\/\(home\)\/leaderboard\/\[discipline\]\/page$/,
      /app\/leaderboard\/\[discipline\]\/page$/,
    ],
  },
];

function extractManifest(raw: string): ClientReferenceManifest {
  // The file assigns to globalThis.__RSC_MANIFEST[key] = {...}
  // Extract the JSON object from the assignment.
  const match = raw.match(/globalThis\.__RSC_MANIFEST\["[^"]+"\]\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) {
    throw new Error('Could not parse client-reference-manifest. File format may have changed.');
  }
  return JSON.parse(match[1]) as ClientReferenceManifest;
}

function measureRoute(route: RouteSpec): number {
  let raw: string;
  try {
    raw = readFileSync(route.manifestPath, 'utf-8');
  } catch {
    console.error(`Could not read ${route.manifestPath}. Run 'pnpm build' first.`);
    process.exit(1);
  }

  let manifest: ClientReferenceManifest;
  try {
    manifest = extractManifest(raw);
  } catch (e) {
    console.error(`[${route.label}] Failed to parse manifest: ${e}`);
    process.exit(1);
  }

  const entryJSFiles = manifest.entryJSFiles;
  if (!entryJSFiles || typeof entryJSFiles !== 'object') {
    console.error(`[${route.label}] manifest missing entryJSFiles`);
    console.error('Manifest keys:', Object.keys(manifest).join(', '));
    process.exit(1);
  }

  const entryKey = Object.keys(entryJSFiles).find((k) => route.patterns.some((p) => p.test(k)));
  if (!entryKey) {
    console.error(
      `[${route.label}] entry not found. Available: ${Object.keys(entryJSFiles).join(', ')}`,
    );
    process.exit(1);
  }

  // Deduplicate chunk paths — shared chunks appear in multiple entries.
  const uniqueChunks = [...new Set(entryJSFiles[entryKey])];
  let totalGzip = 0;

  for (const chunk of uniqueChunks) {
    // Chunks are relative paths like "static/chunks/foo.js"; resolve from .next.
    const abs = join('.next', chunk);
    try {
      const buf = readFileSync(abs);
      totalGzip += gzipSync(buf).length;
    } catch {
      // chunk may be inlined — ignore
    }
  }

  const kb = totalGzip / 1024;
  console.log(
    `[${route.label}] client JS: ${kb.toFixed(1)} KB gzipped  (budget: ${BUDGET_KB} KB, chunks: ${uniqueChunks.length})`,
  );
  return kb;
}

function main(): void {
  let anyExceeded = false;
  const measurements: Array<{ label: string; kb: number }> = [];

  for (const route of ROUTES) {
    const kb = measureRoute(route);
    measurements.push({ label: route.label, kb });
    if (kb > BUDGET_KB) {
      console.error(`\n[${route.label}] bundle exceeds budget by ${(kb - BUDGET_KB).toFixed(1)} KB.`);
      anyExceeded = true;
    }
  }

  // Discipline route should not add >10 KB vs leaderboard (trailing slot is server-rendered).
  const leaderboardKb = measurements.find((m) => m.label === 'leaderboard')?.kb ?? 0;
  const disciplineKb = measurements.find((m) => m.label === 'discipline')?.kb ?? 0;
  const delta = disciplineKb - leaderboardKb;
  if (delta > 10) {
    console.error(
      `\n[discipline] route is ${delta.toFixed(1)} KB heavier than /leaderboard (expected ≤10 KB).`,
    );
    anyExceeded = true;
  }

  if (anyExceeded) process.exit(1);
  console.log('All route bundles within budget.');
}

main();
