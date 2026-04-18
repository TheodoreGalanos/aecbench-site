// scripts/ingest/cli.ts
// ABOUTME: Thin CLI wrapper — keeps runIngest importable without side effects.
import { runIngest } from '@/scripts/ingest/index';

runIngest({ projectRoot: process.cwd() }).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
