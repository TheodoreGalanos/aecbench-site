// ABOUTME: Accessibility audit using axe-core/playwright.
// ABOUTME: Desktop and mobile viewports — zero violations expected within <main>.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y — /leaderboard', () => {
  test('no axe violations on desktop', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForSelector('[data-testid^="dot-"]');
    // Scope to the leaderboard section to audit our content only.
    // Fumadocs HomeLayout renders nav + children inside a single <main>, so we
    // target our content section directly to avoid auditing third-party nav
    // components (which have their own WCAG surface, e.g. light-mode contrast).
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="leaderboard-heading"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('no axe violations on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/leaderboard');
    await page.waitForSelector('table');
    // Scope to the leaderboard section to audit our content only.
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="leaderboard-heading"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
