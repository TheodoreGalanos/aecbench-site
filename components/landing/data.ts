// ABOUTME: Static placeholder data for the landing page leaderboard preview.
// ABOUTME: Replaced by live Supabase queries in Phase 3.

export type Provider = 'anthropic' | 'openai' | 'google' | 'meta';

export interface PreviewModel {
  rank: number;
  model: string;
  provider: Provider;
  overallScore: number;
  disciplines: {
    civil: number;
    electrical: number;
    ground: number;
    mechanical: number;
    structural: number;
  };
  tokensMillions: number;
  costUsd: number;
  deltaLastRun: number;
  costPerTask: number;
}

export const previewModels: PreviewModel[] = [
  {
    rank: 1,
    model: 'Claude Sonnet 4',
    provider: 'anthropic',
    overallScore: 0.72,
    disciplines: { civil: 0.75, electrical: 0.68, ground: 0.71, mechanical: 0.74, structural: 0.72 },
    tokensMillions: 2.14,
    costUsd: 18.4,
    deltaLastRun: 0.04,
    costPerTask: 0.034,
  },
  {
    rank: 2,
    model: 'GPT-4.1',
    provider: 'openai',
    overallScore: 0.68,
    disciplines: { civil: 0.70, electrical: 0.65, ground: 0.66, mechanical: 0.71, structural: 0.68 },
    tokensMillions: 1.98,
    costUsd: 21.6,
    deltaLastRun: 0.02,
    costPerTask: 0.040,
  },
  {
    rank: 3,
    model: 'Gemini 2.5 Pro',
    provider: 'google',
    overallScore: 0.65,
    disciplines: { civil: 0.67, electrical: 0.62, ground: 0.64, mechanical: 0.68, structural: 0.64 },
    tokensMillions: 2.41,
    costUsd: 14.8,
    deltaLastRun: -0.01,
    costPerTask: 0.027,
  },
  {
    rank: 4,
    model: 'Llama 4 Maverick',
    provider: 'meta',
    overallScore: 0.58,
    disciplines: { civil: 0.60, electrical: 0.55, ground: 0.57, mechanical: 0.61, structural: 0.57 },
    tokensMillions: 2.07,
    costUsd: 9.2,
    deltaLastRun: 0.06,
    costPerTask: 0.017,
  },
];
