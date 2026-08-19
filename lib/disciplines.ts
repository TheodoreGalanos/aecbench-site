// ABOUTME: Single source of truth for public catalogue and leaderboard discipline metadata.
// ABOUTME: Keeps the six-discipline task catalogue separate from the five-domain leaderboard.
import type { CatalogueDiscipline, Domain } from '@/lib/aec-bench/contracts';

export interface DisciplineMeta {
  code: string;
  name: string;
  description: string;
}

export const DISCIPLINE_META: Record<CatalogueDiscipline, DisciplineMeta> = {
  civil:      { code: 'CIV·01', name: 'Civil',      description: 'Roads, drainage, hydraulics, earthworks.' },
  electrical: { code: 'ELE·02', name: 'Electrical', description: 'Cable sizing, fault current, lighting, power.' },
  ground:     { code: 'GND·03', name: 'Ground',     description: 'Foundations, slopes, retaining walls.' },
  mechanical: { code: 'MEC·04', name: 'Mechanical', description: 'HVAC, fire protection, piping, acoustics.' },
  structural: { code: 'STR·05', name: 'Structural', description: 'Steel/concrete design, seismic, connections.' },
  maritime:   { code: 'MAR·06', name: 'Maritime',   description: 'Ship geometry, freeboard, and class-rule calculations.' },
};

export const DISCIPLINE_ORDER: readonly Domain[] = [
  'civil', 'electrical', 'ground', 'mechanical', 'structural',
];

export const CATALOGUE_DISCIPLINE_ORDER: readonly CatalogueDiscipline[] = [
  ...DISCIPLINE_ORDER,
  'maritime',
];

export function neighbours(slug: Domain): { prev: Domain; next: Domain } {
  const i = DISCIPLINE_ORDER.indexOf(slug);
  const n = DISCIPLINE_ORDER.length;
  return {
    prev: DISCIPLINE_ORDER[(i - 1 + n) % n],
    next: DISCIPLINE_ORDER[(i + 1) % n],
  };
}
