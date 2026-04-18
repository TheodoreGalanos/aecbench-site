// tests/ingest/pricing-parity.test.ts
// ABOUTME: Asserts data/models.yml covers every substring pattern in the pricing snapshot.
// ABOUTME: Drift from the library's pricing.py must be detected and fail CI.
import { describe, it, expect } from 'vitest';
import { checkParity, ParityError } from '@/scripts/ingest/pricing-parity';

describe('checkParity', () => {
  it('passes when every snapshot pattern has a matching registry entry', () => {
    const snapshot = { patterns: ['claude-sonnet-4', 'gpt-4.1'] };
    const registry = [
      { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic' as const },
      { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai' as const },
    ];
    expect(() => checkParity(snapshot, registry)).not.toThrow();
  });

  it('throws ParityError naming the missing patterns', () => {
    const snapshot = { patterns: ['claude-sonnet-4', 'gpt-4.1', 'new-model-x'] };
    const registry = [
      { match: 'claude-sonnet-4', display: 'Claude Sonnet 4', provider: 'anthropic' as const },
      { match: 'gpt-4.1', display: 'GPT-4.1', provider: 'openai' as const },
    ];
    expect(() => checkParity(snapshot, registry)).toThrow(ParityError);
    expect(() => checkParity(snapshot, registry)).toThrow(/new-model-x/);
  });
});
