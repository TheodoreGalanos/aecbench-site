// ABOUTME: End-to-end tests for the landing page.
// ABOUTME: Verifies page loads, sections visible, and navigation works.
import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders the hero section', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /how capable is ai/i }),
    ).toBeVisible();
  });

  test('renders the leaderboard preview', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Current Standings')).toBeVisible();
    await expect(page.getByText('Claude Sonnet 4')).toBeVisible();
  });

  test('renders the disciplines section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Five Engineering Disciplines')).toBeVisible();
  });

  test('renders the how it works section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('How It Works')).toBeVisible();
  });

  test('Explore Results CTA navigates to leaderboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /explore results/i }).click();
    await expect(page).toHaveURL('/leaderboard');
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
  });

  test('Read the Docs CTA navigates to docs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /read the docs/i }).click();
    await expect(page).toHaveURL(/\/docs/);
  });
});
