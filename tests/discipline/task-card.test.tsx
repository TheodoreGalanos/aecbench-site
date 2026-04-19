// ABOUTME: Tests TaskCard — built/proposed variants, difficulty rendering, standards overflow, IO footer.
// ABOUTME: Covers both template and seed entry shapes, chip logic, and archetype count visibility.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/discipline/task-card';
import { makeCatalogueEntry } from './fixtures/catalogue';

describe('TaskCard — built template', () => {
  const builtAllTiers = makeCatalogueEntry({
    status: 'built',
    task_name: 'Voltage Drop',
    description: 'Cable voltage drop calculation.',
    standards: ['AS/NZS 3008.1.1', 'AS/NZS 3000:2018', 'IEC 60364-5-52', 'IEEE 141'],
    difficulty_tiers: ['easy', 'medium', 'hard'],
    complexity: null,
    archetype_count: 4,
    inputs: [
      { name: 'a', description: null, unit: null, type: null },
      { name: 'b', description: null, unit: null, type: null },
    ],
    outputs: [{ name: 'c', description: null, unit: null, tolerance: null }],
  });

  it('renders the BUILT pill', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText('BUILT')).toBeInTheDocument();
  });

  it('renders task_name as title', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText('Voltage Drop')).toBeInTheDocument();
  });

  it('renders difficulty_tiers as min–max range when length > 1', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText(/easy–hard/)).toBeInTheDocument();
  });

  it('renders difficulty_tiers single value when length === 1', () => {
    const single = { ...builtAllTiers, difficulty_tiers: ['medium'] as const };
    render(<TaskCard entry={single} />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders up to 3 standards chips and a +N overflow count', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText('AS/NZS 3008.1.1')).toBeInTheDocument();
    expect(screen.getByText('AS/NZS 3000:2018')).toBeInTheDocument();
    expect(screen.getByText('IEC 60364-5-52')).toBeInTheDocument();
    expect(screen.queryByText('IEEE 141')).not.toBeInTheDocument();
    expect(screen.getByText(/\+1 more/)).toBeInTheDocument();
  });

  it('renders the IO footer with archetype count when present', () => {
    render(<TaskCard entry={builtAllTiers} />);
    expect(screen.getByText(/2 inputs → 1 outputs/)).toBeInTheDocument();
    expect(screen.getByText(/4 archetypes/)).toBeInTheDocument();
  });
});

describe('TaskCard — proposed seed', () => {
  const seed = makeCatalogueEntry({
    status: 'proposed',
    task_name: 'Gravel Road Thickness',
    description: 'Thickness calculation.',
    standards: ['Austroads Guides'],
    difficulty_tiers: null,
    complexity: 'low',
    archetype_count: null,
    tool_mode: null,
    inputs: [{ name: 'a', description: null, unit: null, type: null }],
    outputs: [{ name: 'b', description: null, unit: null, tolerance: null }],
  });

  it('renders the PROPOSED pill', () => {
    render(<TaskCard entry={seed} />);
    expect(screen.getByText('PROPOSED')).toBeInTheDocument();
  });

  it('renders complexity as the chip (not a range)', () => {
    render(<TaskCard entry={seed} />);
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });

  it('omits archetype count when null', () => {
    render(<TaskCard entry={seed} />);
    expect(screen.queryByText(/archetypes/)).not.toBeInTheDocument();
  });
});

describe('TaskCard — no difficulty', () => {
  it('omits the difficulty chip when both tiers and complexity are null', () => {
    const entry = makeCatalogueEntry({
      status: 'proposed',
      difficulty_tiers: null,
      complexity: null,
    });
    render(<TaskCard entry={entry} />);
    for (const s of ['easy', 'medium', 'hard', 'low', 'high']) {
      expect(screen.queryByText(s)).not.toBeInTheDocument();
    }
  });
});
