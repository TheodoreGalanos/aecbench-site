// ABOUTME: Tests DisciplineTrailingSlot composition (summary → categories → nav) + empty-state fallback.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisciplineTrailingSlot } from '@/components/discipline/discipline-trailing-slot';
import { getCatalogueForDiscipline } from '@/lib/aec-bench/library-catalogue';
import { makeCatalogue, makeCatalogueEntry } from './fixtures/catalogue';

const catalogue = makeCatalogue({
  templates: [
    makeCatalogueEntry({ task_id: 't1', discipline: 'electrical', category: 'cable-sizing', category_label: 'Cable Sizing', status: 'built' }),
  ],
  seeds: [],
});
const sliceElectrical = getCatalogueForDiscipline('electrical', catalogue);
const sliceStructural = getCatalogueForDiscipline('structural', catalogue); // empty

const baseMeta = {
  libraryVersion: '0.1.0',
  libraryCommit: '1a2b3c4d5e6f78',
  generatedAt: '2026-04-19T09:00:00Z',
};

describe('DisciplineTrailingSlot', () => {
  it('renders summary, category sections, and nav for a populated slice', () => {
    render(
      <DisciplineTrailingSlot
        slug="electrical"
        slice={sliceElectrical}
        {...baseMeta}
      />,
    );
    expect(screen.getByText(/1 tasks/)).toBeInTheDocument();        // summary totals
    expect(screen.getByText(/Cable Sizing/)).toBeInTheDocument();   // category section
    expect(screen.getByRole('link', { name: /prev: civil/ })).toBeInTheDocument(); // nav
    expect(screen.getByRole('link', { name: /next: ground/ })).toBeInTheDocument();
  });

  it('renders an empty-state message when the slice has no entries', () => {
    render(
      <DisciplineTrailingSlot
        slug="structural"
        slice={sliceStructural}
        {...baseMeta}
      />,
    );
    expect(screen.getByText(/no templates or seeds registered/i)).toBeInTheDocument();
    // Nav still renders on empty state:
    expect(screen.getByRole('link', { name: /prev: mechanical/ })).toBeInTheDocument();
  });
});
