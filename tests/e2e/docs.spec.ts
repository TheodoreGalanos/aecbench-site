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
    await expect(page.getByText('pip install aec-bench')).toBeVisible();
  });

  test('renders installation page with provider table', async ({ page }) => {
    await page.goto('/docs/start/installation');
    await expect(page.getByText('ANTHROPIC_API_KEY')).toBeVisible();
  });
});
