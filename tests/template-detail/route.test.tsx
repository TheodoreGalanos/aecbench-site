// ABOUTME: Tests task-template detail route rendering for real catalogue examples.
// ABOUTME: Covers static params, metadata, duplicate-safe route params, and public preview content.
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  },
}));

import {
  default as TaskTemplatePage,
  generateMetadata,
  generateStaticParams,
} from '@/app/(home)/tasks/[discipline]/[taskId]/page';
import {
  generateStaticParams as generateLeaderboardStaticParams,
} from '@/app/(home)/leaderboard/[discipline]/[taskId]/page';

async function renderAsync(discipline: string, taskId: string) {
  const element = await TaskTemplatePage({
    params: Promise.resolve({ discipline, taskId }) as any,
  });
  return render(element);
}

describe('task-template detail route', () => {
  it('generates static params for catalogue templates using discipline + task id', async () => {
    const params = await generateStaticParams();
    expect(params).toContainEqual({ discipline: 'electrical', taskId: 'voltage-drop' });
    expect(params).toContainEqual({ discipline: 'civil', taskId: 'lateral-earth-pressure' });
    expect(params).toContainEqual({ discipline: 'ground', taskId: 'lateral-earth-pressure' });
  });

  it('keeps Maritime out of the five-domain leaderboard route', async () => {
    const params = await generateLeaderboardStaticParams();
    expect(params.some((param) => param.discipline === 'maritime')).toBe(false);
    expect(params).toContainEqual({ discipline: 'electrical', taskId: 'voltage-drop' });
  });

  it('generates metadata from the catalogue entry', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ discipline: 'electrical', taskId: 'voltage-drop' }) as any,
    });
    expect(meta.title).toMatch(/Voltage Drop/);
    expect(meta.description).toMatch(/Cable voltage drop/);
  });

  it('renders the readable voltage-drop contract without verifier answer values', async () => {
    await renderAsync('electrical', 'voltage-drop');

    expect(screen.getByRole('heading', { level: 1, name: /Voltage Drop/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Parameters' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Difficulty' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Example task' })).toBeInTheDocument();
    expect(screen.getAllByText('conductor_material').length).toBeGreaterThan(0);
    expect(screen.getByText(/sydney-cbd-commercial-submain-preview/)).toBeInTheDocument();
    expect(screen.getAllByText('vc_mv_per_a_m').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/scores if within ±3% of the reference value/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/all_given/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tol 0\.03/i)).not.toBeInTheDocument();
    expect(screen.queryByText('1.71')).not.toBeInTheDocument();
  });

  it('humanises and groups task inputs while preserving their identifiers', async () => {
    await renderAsync('civil', 'rational-method');

    expect(screen.getByRole('heading', { name: 'How this task is generated' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inputs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Scored outputs' })).toBeInTheDocument();
    expect(screen.getByText('Rainfall intensity')).toBeInTheDocument();
    expect(screen.getAllByText('rainfall_intensity_mm_hr').length).toBeGreaterThan(0);
    expect(screen.getByText('10 – 300 mm/hr')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Derived from scenario' })).toBeInTheDocument();
    expect(screen.getAllByText(/The catchment is.*archetype\.description/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'ARR' })).toHaveAttribute(
      'href',
      '/tasks?standard=ARR',
    );
    expect(screen.getByRole('heading', { name: 'Task bundle' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Instruction template' })).toBeInTheDocument();
    expect(screen.getByText(/Calculate the peak stormwater runoff/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Scoring' }));
    expect(screen.getByRole('link', { name: /reference implementation/i })).toHaveAttribute(
      'href',
      expect.stringContaining('4bb4073db1bc364bd7c4219c0abec4e903c5e9db'),
    );
  });

  it('collapses all-given difficulty tiers into one range-based explanation', async () => {
    await renderAsync('mechanical', 'pump-head-calculation');

    expect(screen.getByText(/All inputs remain visible at every tier/i)).toBeInTheDocument();
    expect(screen.getByText(/difficulty scales through parameter and scenario ranges/i)).toBeInTheDocument();
    expect(screen.getByText(/Easy:/i)).toBeInTheDocument();
    expect(screen.queryByText(/all_given/i)).not.toBeInTheDocument();
  });

  it('keeps duplicate task ids separated by discipline', async () => {
    await renderAsync('civil', 'lateral-earth-pressure');
    expect(screen.getByText('slope-stability')).toBeInTheDocument();
    expect(screen.getByText(/Water table present/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ground variant/i })).toBeInTheDocument();
  });

  it('calls notFound for invalid discipline/task pairs', async () => {
    await expect(
      TaskTemplatePage({
        params: Promise.resolve({ discipline: 'electrical', taskId: 'not-real' }) as any,
      }),
    ).rejects.toThrow(/404/);
  });
});
