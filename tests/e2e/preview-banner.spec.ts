// ABOUTME: Verifies the synthetic-data preview banner stays hidden for release data.
// ABOUTME: The component still exists for mocks, but the committed artefact is real.
import { test, expect } from '@playwright/test';

test('preview banner is hidden on landing when release data is active', async ({ page }) => {
  await page.goto('/');
  const banner = page.getByRole('alert').filter({ hasText: /synthetic preview data/i });
  await expect(banner).toHaveCount(0);
});
