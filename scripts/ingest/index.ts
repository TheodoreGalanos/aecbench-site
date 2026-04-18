// scripts/ingest/index.ts
// ABOUTME: Orchestrates the full ingest pipeline end-to-end.
// ABOUTME: Called from prebuild; any failure fails the build with a pointed error.
import { discoverExperiments } from '@/scripts/ingest/discover';
import { validateExperiment, type ValidatedExperiment } from '@/scripts/ingest/validate';
import { loadActive } from '@/scripts/ingest/active';
import { loadRegistry } from '@/scripts/ingest/registry';
import { loadSnapshot, checkParity } from '@/scripts/ingest/pricing-parity';
import { loadPreviousSnapshot } from '@/scripts/ingest/snapshot';
import { applyDelta, buildEntry, groupTrials, rankEntries } from '@/scripts/ingest/aggregate';
import { emitArtefacts } from '@/scripts/ingest/emit';
import { DOMAINS, type LeaderboardArtefact, type TrialRecord } from '@/lib/aec-bench/contracts';

export interface RunOptions {
  projectRoot: string;
}

export async function runIngest(opts: RunOptions): Promise<LeaderboardArtefact> {
  const { projectRoot } = opts;

  // Load active context + registry + parity check
  const { manifest, activeKey } = await loadActive(projectRoot);
  const registry = await loadRegistry();
  const snapshot = await loadSnapshot();
  checkParity(snapshot, registry);

  // Discover + validate experiments
  const discovered = await discoverExperiments(projectRoot);
  const validated: ValidatedExperiment[] = [];
  for (const exp of discovered) {
    validated.push(await validateExperiment(exp, manifest, activeKey));
  }

  // Gather trials, count submissions per (model, adapter)
  const allTrials: TrialRecord[] = validated.flatMap((v) => v.trials);
  const submissionCounts = new Map<string, number>();
  for (const v of validated) {
    for (const trial of v.trials) {
      const entry = registry.find((r) => trial.agent.model.toLowerCase().includes(r.match.toLowerCase()));
      if (!entry) continue;
      const key = `${entry.display}/${trial.agent.adapter}`;
      submissionCounts.set(key, (submissionCounts.get(key) ?? 0) + 1);
    }
  }

  // Group + build entries
  const groups = groupTrials(allTrials, registry);
  const entries = [...groups.values()].map((group) =>
    buildEntry({
      group,
      manifest,
      activeKey,
      submissionCount: submissionCounts.get(`${group.entry.display}/${group.adapter}`) ?? 1,
    }),
  );

  // Rank + delta
  const ranked = rankEntries(entries);
  const previous = await loadPreviousSnapshot(projectRoot);
  const withDelta = applyDelta(ranked, previous);

  // Assemble artefact
  const isMock = validated.some((v) => v.submission.mock === true);
  const generatedAt = new Date().toISOString();
  const lastSubmission =
    allTrials.length === 0
      ? generatedAt
      : allTrials.map((t) => t.timestamp).sort().at(-1)!;

  const artefact: LeaderboardArtefact = {
    generated_at: generatedAt,
    dataset: manifest,
    entries: withDelta,
    is_mock: isMock,
    run_status: {
      tasks: new Set(allTrials.map((t) => t.task.task_id)).size,
      models: new Set(withDelta.map((e) => e.model_display)).size,
      adapters: new Set(withDelta.map((e) => e.adapter)).size,
      disciplines: DOMAINS.length,
      last_submission: lastSubmission,
      generated_at: generatedAt,
    },
  };

  await emitArtefacts(projectRoot, artefact);
  return artefact;
}
