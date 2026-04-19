// ABOUTME: Full e2e path for the 5 discipline routes — link-through, collapsible, nav chips.
// ABOUTME: Smoke tests: landing card click, heading, catalogue summary, expand, prev/next, 404.
import { test, expect, type Page } from '@playwright/test';

const SLUGS = ['civil', 'electrical', 'ground', 'mechanical', 'structural'] as const;
type Slug = (typeof SLUGS)[number];

const NAMES: Record<Slug, string> = {
  civil: 'Civil',
  electrical: 'Electrical',
  ground: 'Ground',
  mechanical: 'Mechanical',
  structural: 'Structural',
};

async function landingToDiscipline(page: Page, slug: Slug) {
  await page.goto('/');
  await page.locator(`a[href="/leaderboard/${slug}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/leaderboard/${slug}$`));
}

test.describe('discipline pages — smoke', () => {
  for (const slug of SLUGS) {
    test(`${slug}: landing → page → heading + catalogue summary`, async ({ page }) => {
      await landingToDiscipline(page, slug);
      await expect(
        page.getByRole('heading', { level: 1, name: new RegExp(NAMES[slug], 'i') }),
      ).toBeVisible();
      await expect(page.getByText(/tasks.*built.*proposed/)).toBeVisible();
    });
  }

  test('civil → expand first category → cards visible', async ({ page }) => {
    await page.goto('/leaderboard/civil');
    const firstDetails = page.locator('details').first();
    // Click summary to expand:
    await firstDetails.locator('summary').click();
    // After expansion the details has the `open` attribute:
    await expect(firstDetails).toHaveJSProperty('open', true);
    // At least one task card title is now visible:
    const article = firstDetails.locator('article').first();
    await expect(article).toBeVisible();
  });

  test('electrical → next chip → ground; wraps at structural', async ({ page }) => {
    await page.goto('/leaderboard/electrical');
    await page.getByRole('link', { name: /next: ground/i }).click();
    await expect(page).toHaveURL(/\/leaderboard\/ground$/);

    await page.goto('/leaderboard/structural');
    await page.getByRole('link', { name: /next: civil/i }).click();
    await expect(page).toHaveURL(/\/leaderboard\/civil$/);
  });

  test('civil → prev chip → structural (wraparound)', async ({ page }) => {
    await page.goto('/leaderboard/civil');
    await page.getByRole('link', { name: /prev: structural/i }).click();
    await expect(page).toHaveURL(/\/leaderboard\/structural$/);
  });

  test('invalid slug returns 404', async ({ page }) => {
    // In Next.js dev with turbopack, notFound() triggers the 404 boundary
    // but the HTTP status may be 200 (streaming RSC behaviour). Assert on
    // page content instead: no discipline heading should be present.
    await page.goto('/leaderboard/quantum');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(0);
  });
});
