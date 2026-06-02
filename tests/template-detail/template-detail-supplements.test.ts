// ABOUTME: Tests rich template-detail supplements sourced from real aec-bench template metadata.
// ABOUTME: Guards duplicate-safe keys, hidden-parameter rules, and sample preview boundaries.
import { describe, expect, it } from 'vitest';
import {
  getTemplateDetailArtefact,
  getTemplateDetailSupplement,
  templateDetailKey,
} from '@/lib/aec-bench/template-detail-supplements';
import { getCatalogue } from '@/lib/aec-bench/library-catalogue';

describe('template detail supplements', () => {
  it('uses discipline plus task id as the stable lookup key', () => {
    expect(templateDetailKey('civil', 'lateral-earth-pressure')).toBe(
      'civil/lateral-earth-pressure',
    );
    expect(templateDetailKey('ground', 'lateral-earth-pressure')).toBe(
      'ground/lateral-earth-pressure',
    );
  });

  it('captures the voltage-drop hard-mode hidden conductor field', () => {
    const detail = getTemplateDetailSupplement('electrical', 'voltage-drop');
    expect(detail?.parameters.some((p) => p.name === 'conductor_material')).toBe(true);
    expect(detail?.difficulty.find((d) => d.level === 'hard')?.hiddenParams).toEqual([
      'conductor_material',
    ]);
    expect(detail?.sampleInstance?.name).toBe('sydney-cbd-commercial-submain-preview');
  });

  it('contains generated detail data for every built catalogue template', () => {
    const artefact = getTemplateDetailArtefact();
    const catalogue = getCatalogue();
    expect(artefact.template_count).toBe(catalogue.templates.length);
    expect(Object.keys(artefact.templates)).toHaveLength(catalogue.templates.length);
  });

  it('keeps generated-instance previews from exposing verifier answers', () => {
    const detail = getTemplateDetailSupplement('civil', 'lateral-earth-pressure');
    expect(detail?.sampleInstance?.withheldOutputs).toContain('active_force_kn_per_m');
    expect(JSON.stringify(detail)).not.toContain('280.64');
    expect(JSON.stringify(detail)).not.toContain('1485.85');
  });
});
