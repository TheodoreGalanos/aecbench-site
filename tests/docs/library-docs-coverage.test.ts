// ABOUTME: Static coverage checks for public docs that mirror the sibling aec-bench library.
// ABOUTME: Protects current commands, execution boundaries, catalogue facts, and public scope.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function readDoc(path: string): string {
  return readFileSync(join(ROOT, 'content', 'docs', path), 'utf-8');
}

describe('library documentation coverage', () => {
  it('includes current public capabilities in navigation', () => {
    const advancedMeta = readDoc('advanced/meta.json');
    const agentsMeta = readDoc('agents/meta.json');
    const coreMeta = readDoc('core/meta.json');
    const evaluationMeta = readDoc('evaluation/meta.json');
    const referenceMeta = readDoc('reference/meta.json');

    expect(advancedMeta).toContain('"meta-harness-runtime"');
    expect(advancedMeta).toContain('"adaptive-harnesses"');
    expect(advancedMeta).toContain('"prime-lab"');
    expect(advancedMeta).toContain('"swarm"');
    expect(agentsMeta).toContain('"prime-agent"');
    expect(coreMeta).toContain('"lifecycles"');
    expect(coreMeta).toContain('"interactive-worlds"');
    expect(coreMeta).toContain('"contributing"');
    expect(evaluationMeta).toContain('"reviewing"');
    expect(referenceMeta).toContain('"library-catalogue"');
  });

  it('keeps the contribution, review, and adaptive-harness guides public and focused', () => {
    const contributing = readDoc('core/contributing.mdx');
    const reviewing = readDoc('evaluation/reviewing.mdx');
    const adaptiveHarnesses = readDoc('advanced/adaptive-harnesses.mdx');

    expect(contributing).toContain('Source authority');
    expect(contributing).toContain('IACS Common Structural Rules');
    expect(contributing).toContain('--template path/to/template');
    expect(reviewing).toContain('Structured review');
    expect(reviewing).toContain('automated reward');
    expect(reviewing).toContain('holdout-sensitive');
    expect(adaptiveHarnesses).toContain('Fixed kernel');
    expect(adaptiveHarnesses).toContain('Harness specification and instance');
    expect(adaptiveHarnesses).toContain('Execution program');
    expect(adaptiveHarnesses).not.toContain('Phase 9');
  });

  it('documents all three execution families and their separate coordination models', () => {
    const architecture = readDoc('core/architecture.mdx');
    const worlds = readDoc('core/interactive-worlds.mdx');
    const lifecycles = readDoc('core/lifecycles.mdx');

    expect(architecture).toContain('three execution families');
    expect(architecture).toContain('Artefact and workspace tasks');
    expect(architecture).toContain('Finite lifecycles');
    expect(architecture).toContain('Interactive Worlds');
    expect(architecture).not.toContain('seven domains');
    expect(worlds).toContain('rejection that leaves state unchanged');
    expect(worlds).toContain('Domain termination and host truncation are separate');
    expect(worlds).toContain('from aec_bench import worlds');
    expect(worlds).toContain('WorldTask');
    expect(worlds).toContain('world.toml');
    expect(worlds).toContain('plan_trials');
    expect(worlds).toContain('run_world_experiment');
    expect(worlds).toContain('A world action is not a trial');
    expect(worlds).toContain('aec-bench task world pump-station');
    expect(worlds).not.toContain('aec-bench task pump-station-world');
    expect(lifecycles).toContain('One stage is active at a time');
    expect(lifecycles).toContain('task lifecycle run-smoke');
    expect(lifecycles).toContain('branch_lifecycle()');
    expect(lifecycles).toContain('run_lifecycle_trial()');
    expect(lifecycles).toContain('LifecycleTrial');
  });

  it('documents current execution integrations without removed extension APIs', () => {
    const configuration = readDoc('agents/configuration.mdx');
    const backends = readDoc('advanced/backends.mdx');
    const tasks = readDoc('core/tasks.mdx');
    const scoring = readDoc('evaluation/scoring.mdx');

    expect(configuration).toContain('review.trigger');
    expect(configuration).toContain('fixed builder set');
    expect(configuration).not.toContain('from aec_bench.adapters.local_registry import LocalAdapterRegistry');
    expect(backends).toContain('Morph Cloud through Harbor');
    expect(backends).toContain('aec-bench[execution,morph]');
    expect(backends).not.toContain('class ComputeBackend');
    expect(tasks).toContain('Container extensions');
    expect(tasks).toContain('returns_image = true');
    expect(scoring).toContain('Conditional evidence');
    expect(scoring).toContain('experimental');
  });

  it('documents the functional meta-harness ownership and specialist process', () => {
    const runtime = readDoc('advanced/meta-harness-runtime.mdx');
    const cli = readDoc('reference/cli.mdx');

    expect(runtime).toContain('aec_bench.experimentation.meta_harness');
    expect(runtime).toContain('run_harness_study()');
    expect(runtime).toContain('run_meta_harness()');
    expect(runtime).toContain('study = await run_harness_study(');
    expect(runtime).toContain('result = await run_meta_harness(');
    expect(runtime).toContain('await run_world_experiment(');
    expect(runtime).toContain('max_rounds=3');
    expect(runtime).toContain('Failed and invalid trials remain evidence');
    expect(runtime).toContain('not a universal runtime');
    expect(runtime).toContain('operation loop');
    expect(runtime).toContain('governance loop');
    expect(runtime).toContain('world_generation_request');
    expect(runtime).not.toContain('aec_bench.meta_harness');
    expect(runtime).not.toContain('build_aecbench_harbor_task_run_resolver');
    expect(runtime).toContain('evaluate_lifecycle_candidate');
    expect(runtime).toContain('aec-bench task lifecycle');
    expect(cli).toContain('aec-bench meta-harness recipe');
    expect(cli).toContain('aec-bench meta-harness process');
    expect(cli).toContain('aec-bench task lifecycle study ablation');

    for (const retiredRoute of [
      'meta-harness lifecycle-start',
      'meta-harness lifecycle-submit',
      'meta-harness lifecycle-status',
      'meta-harness lifecycle-revisit',
      'meta-harness lifecycle-branch',
      'meta-harness lifecycle-run-local',
      'meta-harness lifecycle-ablation',
      'meta-harness lifecycle-calibration-freeze',
    ]) {
      expect(runtime).not.toContain(retiredRoute);
      expect(cli).not.toContain(retiredRoute);
    }
  });

  it('uses the current CLI commands and removes retired flags', () => {
    const quickstart = readDoc('start/quickstart.mdx');
    const cli = readDoc('reference/cli.mdx');
    const swarm = readDoc('advanced/swarm.mdx');

    expect(quickstart).toContain('aec-bench evaluate');
    expect(quickstart).toContain('aec-bench generate task terzaghi-bearing-capacity');
    expect(cli).toContain('aec-bench init --update-skills');
    expect(cli).toContain('aec-bench generate dockerfiles');
    expect(cli).toContain('aec-bench task world list');
    expect(cli).toContain('aec-bench task world run');
    expect(cli).toContain('aec-bench task world pump-station branch');
    expect(cli).not.toContain('aec-bench task pump-station-world');
    for (const lifecycleRoute of [
      'aec-bench task lifecycle start',
      'aec-bench task lifecycle submit',
      'aec-bench task lifecycle status',
      'aec-bench task lifecycle revisit',
      'aec-bench task lifecycle branch',
      'aec-bench task lifecycle run',
      'aec-bench task lifecycle study ablation',
      'aec-bench task lifecycle study calibration-freeze',
    ]) {
      expect(cli).toContain(lifecycleRoute);
    }
    expect(cli).toContain('aec-bench prime export-lifecycle');
    expect(cli).not.toContain('--legacy-script');
    expect(cli).not.toContain('generate dataset');
    expect(swarm).toContain('as informational commands');
    expect(swarm).toContain('`stop` prints a message');
  });

  it('documents the provider-free package and current optional extras', () => {
    const installation = readDoc('start/installation.mdx');

    expect(installation).toContain('pip install aec-bench');
    for (const install of [
      'aec-bench[execution]',
      'aec-bench[execution,morph]',
      'aec-bench[local-agents]',
      'aec-bench[prime]',
      'aec-bench[prime-agent]',
      'aec-bench[webui]',
      'aec-bench[tui]',
      'aec-bench[evolution,local-agents]',
    ]) {
      expect(installation).toContain(install);
    }
    expect(installation).not.toContain('aec-bench[pydantic-ai]');
  });

  it('reflects the current deterministic six-discipline catalogue', () => {
    const catalogue = JSON.parse(readFileSync(join(ROOT, 'data', 'library-catalogue.json'), 'utf-8'));
    const templates = readDoc('core/templates.mdx');
    const libraryCatalogue = readDoc('reference/library-catalogue.mdx');

    expect(catalogue.schema_version).toBe(2);
    expect(templates).toContain('352 built templates');
    expect(templates).toContain('284 proposed seed tasks');
    expect(templates).toContain('| Maritime | 3 |');
    expect(libraryCatalogue).toContain('352 built templates');
    expect(libraryCatalogue).toContain('six disciplines');
    expect(libraryCatalogue).toContain('same public library content produces the same export bytes');
    expect(libraryCatalogue).not.toContain('library_commit');
  });

  it('documents stable dataset identity and exact references', () => {
    const datasets = readDoc('advanced/datasets.mdx');

    expect(datasets).toContain('`dataset_id`');
    expect(datasets).toContain('dataset publish electrical-core --label public-2026');
    expect(datasets).toContain('One repository commit and manifest path');
    expect(datasets).toContain('`ArtifactRef`');
    expect(datasets).toContain('task_kind: "world"');
    expect(datasets).toContain('world.toml');
    expect(datasets).toContain('`dataset create` command discovers artefact tasks');
    expect(datasets).not.toContain('content_hash');
  });

  it('documents current run, generation, review, and candidate boundaries', () => {
    const contracts = readDoc('core/contracts.mdx');
    const traces = readDoc('evaluation/traces.mdx');
    const templates = readDoc('core/templates.mdx');
    const reviewing = readDoc('evaluation/reviewing.mdx');
    const evolution = readDoc('advanced/evolution.mdx');

    expect(contracts).toContain('RunManifest');
    expect(contracts).toContain('execution_status');
    expect(contracts).toContain('provider_evidence');
    expect(contracts).toContain('WorldTask');
    expect(contracts).toContain('plan_trials()');
    expect(traces).toContain('evidence_status');
    expect(traces).not.toContain('Completeness');
    expect(templates).toContain('generation-manifest.json');
    expect(reviewing).toContain('TaskSnapshotRef');
    expect(reviewing).toContain('SourceSpan');
    expect(evolution).toContain('parent_candidate_id');
    expect(evolution).toContain('source_revision');
  });

  it('keeps public docs out of internal winning-work scope', () => {
    const docs = [
      readDoc('advanced/prime-lab.mdx'),
      readDoc('advanced/swarm.mdx'),
      readDoc('reference/library-catalogue.mdx'),
      readDoc('core/templates.mdx'),
    ].join('\n');

    expect(docs.toLowerCase()).not.toContain('winning work');
    expect(docs.toLowerCase()).not.toContain('winning-work');
    expect(docs.toLowerCase()).not.toContain('company-specific');
  });
});
