// ABOUTME: Tests the discipline dynamic route — generateStaticParams, metadata, valid/invalid slug behaviour.
// ABOUTME: Renders the async RSC by awaiting DisciplinePage and passing the result to render().
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// LeaderboardSurface uses useRouter/usePathname/useSearchParams — mock next/navigation for jsdom.
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/leaderboard/electrical',
  useSearchParams: () => new URLSearchParams(''),
  notFound: () => { throw new Error('NEXT_HTTP_ERROR_FALLBACK;404'); },
}));
import {
  default as DisciplinePage,
  generateStaticParams,
  generateMetadata,
} from '@/app/(home)/leaderboard/[discipline]/page';

// Jest-DOM + render-async helpers: Next's RSC page is async, so we await it.
async function renderAsync(slug: string) {
  const element = await DisciplinePage({ params: Promise.resolve({ discipline: slug }) as any });
  return render(element);
}

describe('generateStaticParams', () => {
  it('returns the five discipline slugs', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([
      { discipline: 'civil' },
      { discipline: 'electrical' },
      { discipline: 'ground' },
      { discipline: 'mechanical' },
      { discipline: 'structural' },
    ]);
  });
});

describe('generateMetadata', () => {
  it('produces title + description for a valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ discipline: 'civil' }) as any });
    expect(meta.title).toMatch(/Civil/);
    expect(meta.description).toMatch(/civil/i);
  });
});

describe('DisciplinePage — valid slug', () => {
  it('renders the LeaderboardSurface heading with the discipline name', async () => {
    await renderAsync('electrical');
    expect(screen.getByRole('heading', { level: 1, name: /Electrical/i })).toBeInTheDocument();
  });

  it('renders the trailing slot (catalogue summary)', async () => {
    await renderAsync('electrical');
    // CatalogueSummary renders a totals paragraph whose combined textContent includes
    // "tasks · N built · N proposed". The text is split across a <span> and the surrounding <p>,
    // so we find the <p> element directly via its class and check textContent.
    const totalsPara = document.querySelector('p.font-mono.text-xs.text-landing-text');
    expect(totalsPara).not.toBeNull();
    expect(totalsPara?.textContent).toMatch(/tasks/);
    expect(totalsPara?.textContent).toMatch(/built/);
    expect(totalsPara?.textContent).toMatch(/proposed/);
  });

  it('renders prev/next nav chips', async () => {
    await renderAsync('electrical');
    expect(screen.getByRole('link', { name: /prev: civil/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /next: ground/i })).toBeInTheDocument();
  });
});

describe('DisciplinePage — invalid slug', () => {
  it('calls notFound() which throws NEXT_HTTP_ERROR_FALLBACK;404', async () => {
    await expect(
      DisciplinePage({ params: Promise.resolve({ discipline: 'quantum' }) as any }),
    ).rejects.toThrow(/NEXT_NOT_FOUND|NOT_FOUND|404/);
  });
});
