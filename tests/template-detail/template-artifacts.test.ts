// ABOUTME: Tests build-time task artefacts mirrored from the pinned aec-bench source commit.
// ABOUTME: Guards exact-source transparency without introducing a runtime GitHub dependency.
import { describe, expect, it } from 'vitest';
import { getTemplateArtifact, getTemplateArtifactCommit } from '@/lib/aec-bench/template-artifacts';
import { getTemplateDetailArtefact } from '@/lib/aec-bench/template-detail-supplements';

describe('template artefacts', () => {
  it('reads the instruction and contract from the pinned library commit', () => {
    const artefact = getTemplateArtifact('civil', 'rational-method');

    expect(getTemplateArtifactCommit()).toBe('4bb4073db1bc364bd7c4219c0abec4e903c5e9db');
    expect(artefact.instruction).toContain('Calculate the peak stormwater runoff');
    expect(artefact.instruction).toContain('{% if runoff_coefficient is defined %}');
    expect(artefact.paramsToml).toContain('[params.runoff_coefficient]');
    expect(artefact.sourceCommit).toBe(getTemplateArtifactCommit());
  });

  it('has one bounded artefact for every generated template detail', () => {
    const details = getTemplateDetailArtefact();
    for (const key of Object.keys(details.templates)) {
      const [discipline, taskId] = key.split('/');
      const artefact = getTemplateArtifact(discipline, taskId);
      expect(artefact.instruction.length, key).toBeLessThanOrEqual(64_000);
      expect(artefact.paramsToml.length, key).toBeLessThanOrEqual(64_000);
    }
  });
});
