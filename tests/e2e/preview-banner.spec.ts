// ABOUTME: Verifies the synthetic-data preview banner renders while mocks are in play.
// ABOUTME: Relies on the canonical seed producing is_mock=true in the committed artefact.
import { test, expect } from '@playwright/test';

test('preview banner renders on landing when mocks are active', async ({ page }) => {
  await page.goto('/');
  const banner = page.getByRole('alert').filter({ hasText: /synthetic preview data/i });
  await expect(banner).toBeVisible();
});
