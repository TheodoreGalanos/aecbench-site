// ABOUTME: Tests DisciplineNav — prev/next hrefs, labels, and wraparound for each of the 5 slugs.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisciplineNav } from '@/components/discipline/discipline-nav';
import type { Domain } from '@/lib/aec-bench/contracts';

describe('DisciplineNav', () => {
  const cases: Array<{ slug: Domain; prev: string; next: string }> = [
    { slug: 'civil',      prev: 'structural', next: 'electrical' },
    { slug: 'electrical', prev: 'civil',      next: 'ground' },
    { slug: 'ground',     prev: 'electrical', next: 'mechanical' },
    { slug: 'mechanical', prev: 'ground',     next: 'structural' },
    { slug: 'structural', prev: 'mechanical', next: 'civil' },
  ];

  it.each(cases)('%s → prev: %s, next: %s', ({ slug, prev, next }) => {
    render(<DisciplineNav slug={slug} />);
    const prevLink = screen.getByRole('link', { name: new RegExp(`prev: ${prev}`, 'i') });
    const nextLink = screen.getByRole('link', { name: new RegExp(`next: ${next}`, 'i') });
    expect(prevLink).toHaveAttribute('href', `/leaderboard/${prev}`);
    expect(nextLink).toHaveAttribute('href', `/leaderboard/${next}`);
  });
});
