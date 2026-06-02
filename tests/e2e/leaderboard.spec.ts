// ABOUTME: End-to-end tests for the /leaderboard page covering all interactive flows.
// ABOUTME: Runs against the dev server with the committed release leaderboard artefact.
import { test, expect } from '@playwright/test';

test.describe('/leaderboard', () => {
  test('renders dots and rows that match the artefact', async ({ page }) => {
    await page.goto('/leaderboard');
    const rows = page.getByRole('table').locator('tbody tr[aria-label]');
    const dots = page.locator('svg[role="group"] [data-testid^="dot-"]');
    const rowCount = await rows.count();
    const dotCount = await dots.count();
    expect(rowCount).toBeGreaterThan(0);
    expect(dotCount).toBeGreaterThan(0);
    expect(dotCount).toBeLessThanOrEqual(rowCount);
  });

  test('axis swap updates URL and x-axis label', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.getByRole('button', { name: /--x.*latency/i }).click();
    await page.getByRole('option', { name: /^tokens$/i }).click();
    await expect(page).toHaveURL(/x=tokens/);
    await expect(page.getByText(/tokens \/ task/i)).toBeVisible();
  });

  test('discipline filter reshapes y-axis', async ({ page }) => {
    await page.goto('/leaderboard');
    // The --discipline chip button has aria-label "--discipline all" (no filters active)
    await page.getByRole('button', { name: /--discipline.*all/i }).click();
    // Option accessible name includes a checkbox prefix (e.g. "☐ civil"), so match loosely
    await page.getByRole('option', { name: /civil/i }).click();
    await expect(page).toHaveURL(/d=civil/);
    // y-axis label becomes "reward (civil)" when one discipline is selected
    await expect(page.getByText(/reward \(civil\)/i)).toBeVisible();
  });

  test('harness filter can select the release harness', async ({ page }) => {
    await page.goto('/leaderboard');
    const rows = page.getByRole('table').locator('tbody tr[aria-label]');
    await expect(rows.first()).toBeVisible();
    const rowsBefore = await rows.count();
    await page.getByRole('button', { name: /--harness.*all/i }).click();
    await page.getByRole('option', { name: /tool_loop/i }).click();
    await expect(page).toHaveURL(/h=tool_loop/);
    const rowsAfter = await rows.count();
    expect(rowsAfter).toBe(rowsBefore);
  });

  test('row expand reveals per-discipline panel', async ({ page }) => {
    await page.goto('/leaderboard');
    const firstRow = page.getByRole('table').locator('tbody tr[aria-label]').first();
    await firstRow.click();
    // Expanded panel heading is "per-discipline reward"
    await expect(page.getByText(/per-discipline reward/i)).toBeVisible();
    await expect(page).toHaveURL(/open=/);
  });

  test('shared URL restores full state', async ({ page }) => {
    await page.goto('/leaderboard?x=tokens&d=civil&sort=reward&dir=desc');
    // y-axis label is "reward (civil)" when d=civil
    await expect(page.getByText(/reward \(civil\)/i)).toBeVisible();
    // x-axis label is "tokens / task (avg)" when x=tokens
    await expect(page.getByText(/tokens \/ task/i)).toBeVisible();
  });

  test('frontier badge appears on at least one row', async ({ page }) => {
    await page.goto('/leaderboard');
    // FrontierBadge renders "[frontier]" text
    const badges = page.getByText(/\[frontier\]/i);
    await expect(badges.first()).toBeVisible();
  });

  test('zero-match filter shows a clear prompt', async ({ page }) => {
    await page.goto('/leaderboard?h=nonexistent-harness');
    // ScatterChart renders "no entries match · clear filters..." when entries is empty
    await expect(page.getByText(/no entries match/i)).toBeVisible();
  });

  test('mobile filter sheet opens and applies', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/leaderboard');
    // Mobile filter button text is "filters" (no active filters) — use prefix match to be safe
    await page.getByRole('button', { name: /^filters/i }).click();
    await expect(page.getByRole('dialog', { name: /filters/i })).toBeVisible();
    // Pick "civil" discipline option in the sheet; option text is plain "civil" in mobile sheet
    await page.getByRole('option', { name: /civil/i }).click();
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page).toHaveURL(/d=civil/);
  });

  test('release coverage caveat renders', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.getByText(/incomplete suites/i)).toBeVisible();
  });
});
