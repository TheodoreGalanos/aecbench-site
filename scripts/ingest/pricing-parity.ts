// scripts/ingest/pricing-parity.ts
// ABOUTME: Checks data/models.yml covers every substring pattern in the pricing snapshot.
// ABOUTME: Snapshot is refreshed from aec-bench pricing.py whenever the library bumps.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { ModelEntry } from '@/lib/aec-bench/contracts';

export class ParityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParityError';
  }
}

const SnapshotSchema = z.object({
  source: z.string(),
  captured_at: z.string(),
  patterns: z.array(z.string().min(1)),
});
export type PricingSnapshot = z.infer<typeof SnapshotSchema>;

const SNAPSHOT_PATH = resolve(process.cwd(), 'data/pricing-snapshot.json');

export async function loadSnapshot(path: string = SNAPSHOT_PATH): Promise<PricingSnapshot> {
  const raw = await readFile(path, 'utf-8');
  return SnapshotSchema.parse(JSON.parse(raw));
}

export function checkParity(snapshot: PricingSnapshot, registry: ModelEntry[]): void {
  const registered = new Set(registry.map((e) => e.match.toLowerCase()));
  const missing = snapshot.patterns.filter((p) => !registered.has(p.toLowerCase()));
  if (missing.length > 0) {
    throw new ParityError(
      `data/models.yml missing patterns present in pricing snapshot: ${missing.join(', ')}. ` +
        `Add entries for each, or regenerate the snapshot if the library dropped them.`,
    );
  }
}
