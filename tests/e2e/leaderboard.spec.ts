// ABOUTME: End-to-end tests for the /leaderboard page covering all interactive flows.
// ABOUTME: Runs against a built site with the committed mock artefact.
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
    expect(Math.abs(rowCount - dotCount)).toBeLessThanOrEqual(1);
  });

  test('axis swap updates URL and x-axis label', async ({ page }) => {
    await page.goto('/leaderboard');
    // The --x chip button has aria-label "--x cost"
    await page.getByRole('button', { name: /--x.*cost/i }).click();
    // Popover options use role="option"
    await page.getByRole('option', { name: /^tokens$/i }).click();
    await expect(page).toHaveURL(/x=tokens/);
    // Axis label in scatter SVG is "tokens / task (avg)"
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

  test('harness filter shrinks the dataset', async ({ page }) => {
    await page.goto('/leaderboard');
    // Wait for hydration — ensure table rows are present before counting
    const rows = page.getByRole('table').locator('tbody tr[aria-label]');
    await expect(rows.first()).toBeVisible();
    const rowsBefore = await rows.count();
    // The --harness chip button has aria-label "--harness all" (no filters active)
    await page.getByRole('button', { name: /--harness.*all/i }).click();
    // Use "direct" — 1 entry out of 7 uses the direct adapter in mock data.
    // Option accessible name includes a checkbox prefix (e.g. "☐ direct"), so match loosely.
    // "direct" is unique in the adapter list, avoiding substring collisions (unlike "rlm" / "lambda-rlm").
    await page.getByRole('option', { name: /direct/i }).click();
    await expect(page).toHaveURL(/h=direct/);
    const rowsAfter = await rows.count();
    expect(rowsAfter).toBeLessThan(rowsBefore);
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

  test('mock PREVIEW caveat renders', async ({ page }) => {
    await page.goto('/leaderboard');
    // Warning text includes "mock submissions"
    await expect(page.getByText(/mock submissions/i)).toBeVisible();
  });
});
