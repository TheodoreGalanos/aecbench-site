// ABOUTME: End-to-end smoke tests for the public task library and template detail routes.
// ABOUTME: Verifies sitemap exposure and canonical task-detail navigation.
import { test, expect } from '@playwright/test';

test.describe('Task library', () => {
  test('/tasks renders the sitemap and links to a template detail page', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByRole('heading', { level: 1, name: /Task Library/i })).toBeVisible();
    const navigation = page.getByRole('navigation', { name: /task library disciplines/i });
    await expect(navigation.getByRole('link', { name: /Civil/i })).toHaveAttribute(
      'href',
      '#civil-tasks-heading',
    );
    const voltage = page.getByRole('link', { name: /^Voltage Drop$/i });
    await expect(voltage).toHaveAttribute('href', '/tasks/electrical/voltage-drop');
  });

  test('/tasks discipline navigation jumps to a section', async ({ page }) => {
    await page.goto('/tasks');
    await page
      .getByRole('navigation', { name: /task library disciplines/i })
      .getByRole('link', { name: /Ground/i })
      .click();
    await expect(page).toHaveURL(/#ground-tasks-heading$/);
    await expect(page.getByRole('heading', { level: 3, name: 'Ground' })).toBeInViewport();
  });

  test('/tasks/electrical/voltage-drop renders generated template anatomy', async ({ page }) => {
    await page.goto('/tasks/electrical/voltage-drop');
    await expect(page.getByRole('heading', { level: 1, name: /Voltage Drop/i })).toBeVisible();
    await expect(page.getByText('Parameter Map')).toBeVisible();
    await expect(page.getByText('Generation Preview')).toBeVisible();
    await expect(page.getByText('conductor_material').first()).toBeVisible();
  });
});
