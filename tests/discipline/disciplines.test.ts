// ABOUTME: Tests for the discipline metadata registry + neighbours helper.
// ABOUTME: Asserts the 5-slug order and wraparound behaviour used by /leaderboard/[discipline].
import { describe, it, expect } from 'vitest';
import {
  CATALOGUE_DISCIPLINE_ORDER,
  DISCIPLINE_META,
  DISCIPLINE_ORDER,
  neighbours,
} from '@/lib/disciplines';

describe('DISCIPLINE_ORDER', () => {
  it('contains exactly the five slugs in fixed order', () => {
    expect(DISCIPLINE_ORDER).toEqual([
      'civil', 'electrical', 'ground', 'mechanical', 'structural',
    ]);
  });
});

describe('CATALOGUE_DISCIPLINE_ORDER', () => {
  it('adds Maritime to the public task catalogue without changing leaderboard scope', () => {
    expect(CATALOGUE_DISCIPLINE_ORDER).toEqual([
      'civil', 'electrical', 'ground', 'mechanical', 'structural', 'maritime',
    ]);
  });
});

describe('DISCIPLINE_META', () => {
  it.each([
    ['civil',      'CIV·01', 'Civil'],
    ['electrical', 'ELE·02', 'Electrical'],
    ['ground',     'GND·03', 'Ground'],
    ['mechanical', 'MEC·04', 'Mechanical'],
    ['structural', 'STR·05', 'Structural'],
    ['maritime',   'MAR·06', 'Maritime'],
  ] as const)('%s has expected code and name', (slug, code, name) => {
    expect(DISCIPLINE_META[slug].code).toBe(code);
    expect(DISCIPLINE_META[slug].name).toBe(name);
    expect(DISCIPLINE_META[slug].description.length).toBeGreaterThan(10);
  });
});

describe('neighbours', () => {
  it('returns neighbours for middle slug', () => {
    expect(neighbours('ground')).toEqual({ prev: 'electrical', next: 'mechanical' });
  });

  it('wraps at the first slug', () => {
    expect(neighbours('civil')).toEqual({ prev: 'structural', next: 'electrical' });
  });

  it('wraps at the last slug', () => {
    expect(neighbours('structural')).toEqual({ prev: 'mechanical', next: 'civil' });
  });
});
