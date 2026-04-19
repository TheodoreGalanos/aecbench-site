// ABOUTME: axe audit for /leaderboard/civil — desktop + mobile, collapsed + expanded categories.
// ABOUTME: Zero-violation expectation on all three viewports/states within our content section.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('discipline page a11y', () => {
  test('desktop · collapsed categories', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/leaderboard/civil');
    await page.waitForSelector('h1');
    // Scope to our content section to avoid auditing Fumadocs nav chrome,
    // which has its own WCAG surface (light-mode contrast, kbd elements, etc.).
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="leaderboard-heading"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('desktop · expanded first category', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/leaderboard/civil');
    await page.waitForSelector('h1');
    await page.locator('details summary').first().click();
    // Scope to our content section to avoid auditing Fumadocs nav chrome.
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="leaderboard-heading"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('mobile · collapsed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/leaderboard/civil');
    await page.waitForSelector('h1');
    // Scope to our content section to avoid auditing Fumadocs nav chrome.
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="leaderboard-heading"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
