// ABOUTME: End-to-end tests for the documentation pages.
// ABOUTME: Verifies docs load, sidebar navigation works, and content renders.
import { test, expect } from '@playwright/test';

test.describe('Documentation', () => {
  test('renders the docs index page', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'aec-bench Documentation' })).toBeVisible();
  });

  test('navigates to introduction page via sidebar', async ({ page }) => {
    await page.goto('/docs');
    await page.getByRole('link', { name: /introduction/i }).click();
    await expect(page.getByRole('heading', { name: 'Why aec-bench?' })).toBeVisible();
  });

  test('renders quickstart page with code blocks', async ({ page }) => {
    await page.goto('/docs/start/quickstart');
    await expect(
      page.locator('code').filter({ hasText: 'aec-bench generate list-templates --discipline ground' }),
    ).toBeVisible();
  });

  test('renders the meta-harness runtime page', async ({ page }) => {
    await page.goto('/docs/advanced/meta-harness-runtime');
    await expect(page.getByRole('heading', { name: 'Meta-Harness Runtime' })).toBeVisible();
    await expect(page.getByText('pauseable process runner')).toBeVisible();
    await expect(page.getByText('bounded autonomous supervisor')).toBeVisible();
    await expect(page.getByText('uv run aec-bench meta-harness process')).toBeVisible();
    await expect(page.locator('code').filter({ hasText: 'world_generation_request' }).first()).toBeVisible();
  });

  test('renders the public guides migrated from the library', async ({ page }) => {
    const guides = [
      ['/docs/advanced/adaptive-harnesses', 'Adaptive Harnesses'],
      ['/docs/core/contributing', 'Contributing Tasks'],
      ['/docs/core/interactive-worlds', 'Interactive Worlds'],
      ['/docs/core/lifecycles', 'Finite Lifecycles'],
      ['/docs/agents/prime-agent', 'Prime Agent'],
      ['/docs/evaluation/reviewing', 'Review and Reporting'],
    ] as const;

    for (const [path, heading] of guides) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  });

  test('renders installation page with provider table', async ({ page }) => {
    await page.goto('/docs/start/installation');
    await expect(page.getByText('ANTHROPIC_API_KEY')).toBeVisible();
  });

  test('renders the architecture flow diagram', async ({ page }) => {
    await page.goto('/docs/core/architecture');
    await expect(page.getByTestId('benchmark-run-flow')).toBeVisible();
    await expect(page.getByTestId('core-domains')).toBeVisible();
    await expect(
      page.getByRole('img', {
        name: /benchmark run flow from define task through aggregate and report/i,
      }),
    ).toBeVisible();
  });
});
