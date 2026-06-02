// ABOUTME: End-to-end tests for the landing page and nav.
// ABOUTME: Verifies page loads, sections visible, status bar, nav, and deep links.
import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders the hero headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /how capable is ai/i })).toBeVisible();
  });

  test('shows the persistent status bar with honest labels', async ({ page }) => {
    await page.goto('/');
    const bar = page.getByRole('status', { name: /aec-bench run status/i });
    await expect(bar).toBeVisible();
    // New honest labels — no fake run_id.
    await expect(bar.getByText(/dataset release/)).toBeVisible();
    await expect(bar.getByText(/last submission/i)).toBeVisible();
    await expect(bar.getByText(/built/i)).toBeVisible();
    await expect(bar.getByText(/LIVE/)).toBeVisible();
  });

  test('renders the leaderboard preview with model rows', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /current standings/i })).toBeVisible();
    await expect(page.getByText('Grok 4.3').first()).toBeVisible();
  });

  test('renders the reward × latency teaser', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /reward.*latency/i })).toBeVisible();
  });

  test('renders disciplines and how-it-works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /five engineering disciplines/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /define.*run.*score/i })).toBeVisible();
  });

  test('CTA copy button copies source checkout command', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.locator('button', { hasText: /^copy$/i }).first().click();
    await expect(page.locator('button', { hasText: /^copied$/i })).toBeVisible();
  });

  test('explore_results CTA goes to /leaderboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /explore_results/i }).click();
    await expect(page).toHaveURL('/leaderboard');
  });

  test('browse_tasks CTA goes to /tasks', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /browse_tasks/i }).click();
    await expect(page).toHaveURL('/tasks');
  });

  test('discipline cards link into the task library sitemap', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/tasks#electrical-tasks-heading"]').click();
    await expect(page).toHaveURL(/\/tasks#electrical-tasks-heading$/);
  });

  test('nav does not include Blog link', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a');
    const texts = await navLinks.allInnerTexts();
    expect(texts.every((t) => !/^blog$/i.test(t.trim()))).toBe(true);
  });

  test('nav includes The Harness linking to external blog', async ({ page }) => {
    await page.goto('/');
    const harness = page.getByRole('link', { name: /the harness/i }).first();
    await expect(harness).toHaveAttribute('href', 'https://www.theharness.blog');
  });
});
