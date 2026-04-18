// ABOUTME: Smoke test that new landing design tokens are declared in globals.css.
// ABOUTME: We read the file as text; we don't attempt to evaluate CSS variables.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const css = readFileSync(resolve(__dirname, '../../app/globals.css'), 'utf8');

describe('globals.css landing tokens', () => {
  it('declares the blueprint grid tokens', () => {
    expect(css).toMatch(/--color-bg-grid:\s*rgba\(56,\s*178,\s*172,\s*0\.06\)/);
    expect(css).toMatch(/--color-bg-grid-major:\s*rgba\(56,\s*178,\s*172,\s*0\.14\)/);
  });

  it('declares terminal/cursor/delta/provider tokens', () => {
    expect(css).toMatch(/--color-terminal-bg:\s*#050505/);
    expect(css).toMatch(/--color-cursor:\s*#e8a838/);
    expect(css).toMatch(/--color-delta-up:\s*#6fd08a/);
    expect(css).toMatch(/--color-delta-down:\s*#e07b7b/);
    expect(css).toMatch(/--color-provider-anthropic:\s*#e8a838/);
    expect(css).toMatch(/--color-provider-openai:\s*#38b2ac/);
    expect(css).toMatch(/--color-provider-google:\s*#c792ea/);
    expect(css).toMatch(/--color-provider-meta:\s*#6fd08a/);
  });

  it('defines .anno utility', () => {
    expect(css).toMatch(/\.anno\s*\{/);
  });
});
