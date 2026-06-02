// ABOUTME: Tests task-template detail route rendering for real catalogue examples.
// ABOUTME: Covers static params, metadata, duplicate-safe route params, and public preview content.
import { render, screen } from '@testing-library/react';
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

  it('generates metadata from the catalogue entry', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ discipline: 'electrical', taskId: 'voltage-drop' }) as any,
    });
    expect(meta.title).toMatch(/Voltage Drop/);
    expect(meta.description).toMatch(/Cable voltage drop/);
  });

  it('renders the rich voltage-drop anatomy without verifier answer values', async () => {
    await renderAsync('electrical', 'voltage-drop');

    expect(screen.getByRole('heading', { level: 1, name: /Voltage Drop/i })).toBeInTheDocument();
    expect(screen.getByText('Parameter Map')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Ladder')).toBeInTheDocument();
    expect(screen.getByText('Generation Preview')).toBeInTheDocument();
    expect(screen.getAllByText('conductor_material').length).toBeGreaterThan(0);
    expect(screen.getByText('sydney-cbd-commercial-submain-preview')).toBeInTheDocument();
    expect(screen.getAllByText('vc_mv_per_a_m').length).toBeGreaterThan(0);
    expect(screen.queryByText('1.71')).not.toBeInTheDocument();
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
