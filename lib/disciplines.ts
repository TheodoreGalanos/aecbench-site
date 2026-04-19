// ABOUTME: Single source of truth for per-discipline metadata (code, name, description).
// ABOUTME: Consumed by the landing Disciplines component and /leaderboard/[discipline] routes.
import type { Domain } from '@/lib/aec-bench/contracts';

export interface DisciplineMeta {
  code: string;
  name: string;
  description: string;
}

export const DISCIPLINE_META: Record<Domain, DisciplineMeta> = {
  civil:      { code: 'CIV·01', name: 'Civil',      description: 'Roads, drainage, hydraulics, earthworks.' },
  electrical: { code: 'ELE·02', name: 'Electrical', description: 'Cable sizing, fault current, lighting, power.' },
  ground:     { code: 'GND·03', name: 'Ground',     description: 'Foundations, slopes, retaining walls.' },
  mechanical: { code: 'MEC·04', name: 'Mechanical', description: 'HVAC, fire protection, piping, acoustics.' },
  structural: { code: 'STR·05', name: 'Structural', description: 'Steel/concrete design, seismic, connections.' },
};

export const DISCIPLINE_ORDER: readonly Domain[] = [
  'civil', 'electrical', 'ground', 'mechanical', 'structural',
];

export function neighbours(slug: Domain): { prev: Domain; next: Domain } {
  const i = DISCIPLINE_ORDER.indexOf(slug);
  const n = DISCIPLINE_ORDER.length;
  return {
    prev: DISCIPLINE_ORDER[(i - 1 + n) % n],
    next: DISCIPLINE_ORDER[(i + 1) % n],
  };
}
