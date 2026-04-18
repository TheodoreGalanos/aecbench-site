// ABOUTME: Smoke check for /leaderboard — page loads, heading visible, table has rows.
// ABOUTME: Verifies the RSC wrapper wires entries into LeaderboardSurface correctly.
import { test, expect } from '@playwright/test';

test('/leaderboard loads with heading and at least one row', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: /leaderboard/i }).first()).toBeVisible();
  const rows = page.getByRole('table').locator('tbody tr[role="button"]');
  await expect(rows.first()).toBeVisible();
});
