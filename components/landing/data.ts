// ABOUTME: Static placeholder data for the landing page leaderboard preview.
// ABOUTME: Replaced by live Supabase queries in Phase 3.

export interface PreviewModel {
  rank: number;
  model: string;
  provider: string;
  overallScore: number;
  disciplines: {
    civil: number;
    electrical: number;
    ground: number;
    mechanical: number;
    structural: number;
  };
}

export const previewModels: PreviewModel[] = [
  {
    rank: 1,
    model: 'Claude Sonnet 4',
    provider: 'Anthropic',
    overallScore: 0.72,
    disciplines: { civil: 0.75, electrical: 0.68, ground: 0.71, mechanical: 0.74, structural: 0.72 },
  },
  {
    rank: 2,
    model: 'GPT-4.1',
    provider: 'OpenAI',
    overallScore: 0.68,
    disciplines: { civil: 0.70, electrical: 0.65, ground: 0.66, mechanical: 0.71, structural: 0.68 },
  },
  {
    rank: 3,
    model: 'Gemini 2.5 Pro',
    provider: 'Google',
    overallScore: 0.65,
    disciplines: { civil: 0.67, electrical: 0.62, ground: 0.64, mechanical: 0.68, structural: 0.64 },
  },
  {
    rank: 4,
    model: 'Llama 4 Maverick',
    provider: 'Meta',
    overallScore: 0.58,
    disciplines: { civil: 0.60, electrical: 0.55, ground: 0.57, mechanical: 0.61, structural: 0.57 },
  },
];
