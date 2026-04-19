// ABOUTME: Tests CategorySection — collapsed by default, badge arithmetic, card ordering.
// ABOUTME: Native <details>/<summary> element renders without any JS or client components.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategorySection } from '@/components/discipline/category-section';
import { makeCatalogueEntry } from './fixtures/catalogue';

const category = {
  key: 'cable-sizing',
  label: 'Cable Sizing',
  built: [
    makeCatalogueEntry({ task_id: 'b1', task_name: 'Built One', status: 'built' }),
    makeCatalogueEntry({ task_id: 'b2', task_name: 'Built Two', status: 'built' }),
  ],
  proposed: [
    makeCatalogueEntry({
      task_id: 'p1',
      task_name: 'Proposed One',
      status: 'proposed',
      difficulty_tiers: null,
      complexity: 'low',
    }),
  ],
};

describe('CategorySection', () => {
  it('renders the category label and counts', () => {
    render(<CategorySection category={category} />);
    expect(screen.getByText(/Cable Sizing/)).toBeInTheDocument();
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/2 built/)).toBeInTheDocument();
    expect(screen.getByText(/1 proposed/)).toBeInTheDocument();
  });

  it('is collapsed by default (details without open attribute)', () => {
    const { container } = render(<CategorySection category={category} />);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.hasAttribute('open')).toBe(false);
  });

  it('renders all cards inside the details body (present in DOM even when collapsed)', () => {
    render(<CategorySection category={category} />);
    expect(screen.getByText('Built One')).toBeInTheDocument();
    expect(screen.getByText('Built Two')).toBeInTheDocument();
    expect(screen.getByText('Proposed One')).toBeInTheDocument();
  });

  it('renders built cards before proposed cards', () => {
    render(<CategorySection category={category} />);
    const allTitles = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(allTitles.indexOf('Built One')).toBeLessThan(allTitles.indexOf('Proposed One'));
    expect(allTitles.indexOf('Built Two')).toBeLessThan(allTitles.indexOf('Proposed One'));
  });
});
