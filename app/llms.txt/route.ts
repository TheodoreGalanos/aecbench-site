// ABOUTME: Serves the compact LLM documentation index generated from the Fumadocs page tree.
// ABOUTME: Produces static plain text with links to docs and public benchmark surfaces.
import { getLLMsIndex, LLM_TEXT_HEADERS } from '@/lib/llms';

export const revalidate = false;

export function GET(): Response {
  return new Response(getLLMsIndex(), { headers: LLM_TEXT_HEADERS });
}
