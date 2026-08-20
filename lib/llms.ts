// ABOUTME: Generates compact and full LLM-readable views from the public Fumadocs source.
// ABOUTME: Keeps the Markdown endpoints derived from the same documentation authority as the site.
import { llms } from 'fumadocs-core/source';
import { source } from '@/lib/source';

export const LLM_TEXT_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
} as const;

const ADDITIONAL_RESOURCES = `## Complete documentation

- [Full documentation](/llms-full.txt): Read all public documentation as one processed Markdown document.

## Public benchmark surfaces

- [Task library](/tasks): Browse built templates and proposed task seeds by engineering discipline.
- [Leaderboard](/leaderboard): View current public benchmark results across the evaluated domains.
- [Source repository](https://github.com/TheodoreGalanos/aec-bench): Read the source, contracts, and contribution guidance.`;

export function getLLMsIndex(): string {
  return `${llms(source).index()}\n\n${ADDITIONAL_RESOURCES}\n`;
}

export async function getLLMsFullText(): Promise<string> {
  const pages = await Promise.all(
    source.getPages().map(async (page) => {
      const markdown = await page.data.getText('processed');
      return `# ${page.data.title} (${page.url})\n\n${markdown.trim()}`;
    }),
  );

  return `${pages.join('\n\n---\n\n')}\n`;
}
