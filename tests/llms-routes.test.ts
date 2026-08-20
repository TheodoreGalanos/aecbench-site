// ABOUTME: Tests the static LLM documentation routes generated from the Fumadocs source.
// ABOUTME: Protects content type, public discovery links, and full Markdown coverage.
import { describe, expect, it } from 'vitest';
import {
  GET as getLLMsIndex,
  revalidate as indexRevalidate,
} from '@/app/llms.txt/route';
import {
  GET as getLLMsFull,
  revalidate as fullRevalidate,
} from '@/app/llms-full.txt/route';
import { source } from '@/lib/source';

describe('LLM documentation routes', () => {
  it('serves a static llms.txt index with the main documentation and public surfaces', async () => {
    const response = await getLLMsIndex();
    const body = await response.text();

    expect(indexRevalidate).toBe(false);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(body).toMatch(/^# aec-bench\n\n> /);
    expect(body).toContain('[Quickstart](/docs/start/quickstart)');
    expect(body).toContain('[Full documentation](/llms-full.txt)');
    expect(body).toContain('[Task library](/tasks)');
    expect(body).toContain('[Leaderboard](/leaderboard)');
    expect(body).toContain('[Source repository](https://github.com/TheodoreGalanos/aec-bench)');
  });

  it('serves all processed documentation as static plain text', async () => {
    const response = await getLLMsFull();
    const body = await response.text();

    expect(fullRevalidate).toBe(false);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(body).toContain('# aec-bench Documentation (/docs)');
    expect(body).toContain('# Contracts (/docs/core/contracts)');
    expect(body).toContain('RunManifest');
    expect(body).toContain('# CLI (/docs/reference/cli)');
    expect(body).not.toContain('---\ntitle:');
    expect(body).not.toContain('creating, versioning');
    expect(body.match(/^# .+ \(\/docs(?:\/[^)]+)?\)$/gm)).toHaveLength(
      source.getPages().length,
    );
  });
});
