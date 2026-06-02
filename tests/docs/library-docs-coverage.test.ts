// ABOUTME: Static coverage checks for public docs that mirror the sibling aec-bench library.
// ABOUTME: Keeps command references, catalogue counts, and public-scope language from drifting.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function readDoc(path: string): string {
  return readFileSync(join(ROOT, 'content', 'docs', path), 'utf-8');
}

describe('library documentation coverage', () => {
  it('documents current public-library integrations in navigation', () => {
    const advancedMeta = readDoc('advanced/meta.json');
    const referenceMeta = readDoc('reference/meta.json');

    expect(advancedMeta).toContain('"prime-lab"');
    expect(advancedMeta).toContain('"swarm"');
    expect(referenceMeta).toContain('"library-catalogue"');
  });

  it('uses current CLI command names instead of stale command references', () => {
    const quickstart = readDoc('start/quickstart.mdx');
    const cli = readDoc('reference/cli.mdx');

    expect(quickstart).toContain('aec-bench evaluate');
    expect(quickstart).not.toContain('aec-bench results --latest');
    expect(quickstart).not.toContain('aec-bench doctor');

    expect(cli).toContain('aec-bench generate list-templates');
    expect(cli).toContain('aec-bench library export');
    expect(cli).toContain('aec-bench prime eval');
    expect(cli).toContain('aec-bench prime train-config');
    expect(cli).toContain('aec-bench swarm status');
  });

  it('reflects the refreshed built-in template catalogue', () => {
    const catalogue = JSON.parse(readFileSync(join(ROOT, 'data', 'library-catalogue.json'), 'utf-8'));
    const templates = readDoc('core/templates.mdx');
    const libraryCatalogue = readDoc('reference/library-catalogue.mdx');

    expect(catalogue.counts.total_templates).toBe(184);
    expect(catalogue.counts.total_seeds).toBe(284);
    expect(catalogue.library_commit).toMatch(/^[0-9a-f]{7,40}$/);
    expect(catalogue.counts.by_discipline.electrical.templates).toBe(52);
    expect(catalogue.counts.by_discipline.mechanical.templates).toBe(50);
    expect(catalogue.counts.by_discipline.structural.templates).toBe(15);
    expect(templates).toContain('184 built templates');
    expect(libraryCatalogue).toContain(`"library_commit": "${catalogue.library_commit}"`);
    expect(templates).toContain('Mechanical');
    expect(templates).toContain('Structural');
  });

  it('keeps installation docs on source-checkout setup until a package is published', () => {
    const docs = [
      readDoc('start/installation.mdx'),
      readDoc('start/quickstart.mdx'),
      readDoc('reference/cli.mdx'),
    ].join('\n');

    expect(docs).toContain('git clone https://github.com/aurecon/aec-bench.git');
    expect(docs).not.toContain('pip install aec-bench');
    expect(docs).not.toContain('aec-bench[webui]');
    expect(docs).not.toContain('published package');
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
    expect(docs.toLowerCase()).not.toContain('aurecon-specific');
  });
});
