// tests/ingest/registry.test.ts
// ABOUTME: Exercises the model registry loader and substring matcher.
// ABOUTME: Matching is case-insensitive, first-match-wins, order matters.
import { describe, it, expect } from 'vitest';
import { loadRegistry, resolveModel, RegistryError } from '@/scripts/ingest/registry';
import type { ModelEntry } from '@/lib/aec-bench/contracts';

const fixture: ModelEntry[] = [
  { match: 'claude-opus-4', display: 'Claude Opus 4', provider: 'anthropic', family: 'Claude 4' },
  { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic', family: 'Claude 4' },
  { match: 'gpt-4.1-mini', display: 'GPT-4.1 Mini', provider: 'openai', family: 'GPT-4.1' },
  { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai', family: 'GPT-4.1' },
];

describe('resolveModel', () => {
  it('returns the first-match entry for a simple lib model string', () => {
    const entry = resolveModel('claude-sonnet-4-6', fixture);
    expect(entry.display).toBe('Claude Sonnet 4');
  });

  it('matches case-insensitively against Bedrock-prefixed strings', () => {
    const entry = resolveModel('au.anthropic.claude-sonnet-4-6', fixture);
    expect(entry.display).toBe('Claude Sonnet 4');
  });

  it('honours order — gpt-4.1-mini wins over gpt-4.1 when input contains both', () => {
    const entry = resolveModel('gpt-4.1-mini-preview', fixture);
    expect(entry.display).toBe('GPT-4.1 Mini');
  });

  it('throws RegistryError with the offending string when no match', () => {
    expect(() => resolveModel('mistral-large', fixture)).toThrow(RegistryError);
    expect(() => resolveModel('mistral-large', fixture)).toThrow(/mistral-large/);
  });
});

describe('loadRegistry', () => {
  it('parses the committed data/models.yml into ModelEntry[]', async () => {
    const entries = await loadRegistry();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveProperty('match');
    expect(entries[0]).toHaveProperty('display');
    expect(entries[0]).toHaveProperty('provider');
  });
});
