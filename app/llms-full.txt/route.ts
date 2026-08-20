// ABOUTME: Serves all public documentation as processed Markdown for LLM consumers.
// ABOUTME: Generates static plain text from compiled content instead of runtime filesystem reads.
import { getLLMsFullText, LLM_TEXT_HEADERS } from '@/lib/llms';

export const revalidate = false;

export async function GET(): Promise<Response> {
  return new Response(await getLLMsFullText(), { headers: LLM_TEXT_HEADERS });
}
