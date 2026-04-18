// ABOUTME: Maps a harness/adapter string to its canonical SVG shape for the scatter.
// ABOUTME: Known adapters get canonical shapes; unknown ones fall back to diamond.

export type GlyphShape = 'circle' | 'square' | 'triangle' | 'ring' | 'diamond';

export const KNOWN_HARNESSES = ['tool_loop', 'rlm', 'direct', 'lambda-rlm'] as const;

const SHAPE_MAP: Record<string, GlyphShape> = {
  tool_loop: 'circle',
  rlm: 'square',
  direct: 'triangle',
  'lambda-rlm': 'ring',
};

export function harnessGlyph(adapter: string): GlyphShape {
  return SHAPE_MAP[adapter] ?? 'diamond';
}
