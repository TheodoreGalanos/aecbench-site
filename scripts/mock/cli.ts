// scripts/mock/cli.ts
// ABOUTME: Thin CLI wrapper around generateMocks so the generator stays side-effect-free.
import { resolve } from 'node:path';
import { generateMocks } from '@/scripts/mock/generate';

const seed = process.env.MOCK_SEED ?? 'aecbench-seed-2026-04-18';
generateMocks({ projectRoot: resolve(process.cwd()), seed })
  .then(() => console.log(`Mock data generated with seed "${seed}"`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
