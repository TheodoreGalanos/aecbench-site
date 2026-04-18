// ABOUTME: Smoke test that new landing design tokens are declared in globals.css.
// ABOUTME: We read the file as text; we don't attempt to evaluate CSS variables.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8');

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

  it('defines .scanlines utility', () => {
    expect(css).toMatch(/\.scanlines\s*\{/);
    expect(css).toMatch(/repeating-linear-gradient/);
  });
});
