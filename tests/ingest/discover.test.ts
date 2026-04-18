// ABOUTME: Walks results/experiments/ and lists experiment folders containing a submission.yml.
// ABOUTME: Missing submission.yml is an error that names the offending folder.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { discoverExperiments } from '@/scripts/ingest/discover';

const FIXTURE_ROOT = resolve(__dirname, 'fixtures/discover');

describe('discoverExperiments', () => {
  it('returns every folder under results/experiments that has a submission.yml', async () => {
    const experiments = await discoverExperiments(FIXTURE_ROOT);
    const ids = experiments.map((e) => e.id).sort();
    expect(ids).toEqual(['alpha', 'beta']);
  });

  it('resolves full paths for submission.yml and trials/', async () => {
    const [alpha] = (await discoverExperiments(FIXTURE_ROOT)).filter((e) => e.id === 'alpha');
    expect(alpha.submissionPath).toMatch(/fixtures\/discover\/results\/experiments\/alpha\/submission\.yml$/);
    expect(alpha.trialsDir).toMatch(/fixtures\/discover\/results\/experiments\/alpha\/trials$/);
  });
});
