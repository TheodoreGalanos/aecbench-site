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

  test('/tasks/electrical/voltage-drop renders the task contract and source bundle', async ({ page }) => {
    await page.goto('/tasks/electrical/voltage-drop');
    await expect(page.getByRole('heading', { level: 1, name: /Voltage Drop/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Parameters' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Example task' })).toBeVisible();
    await expect(page.getByText('conductor_material').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Task bundle' })).toBeVisible();
    await page.getByRole('tab', { name: 'Contract source' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('[params.conductor_material]');
    await page.getByRole('tab', { name: 'Scoring' }).click();
    await expect(page.getByRole('link', { name: /Reference implementation/i })).toHaveAttribute(
      'href',
      /4bb4073db1bc364bd7c4219c0abec4e903c5e9db/,
    );
  });

  test('/tasks accepts standard and tag filters from detail-page links', async ({ page }) => {
    await page.goto('/tasks?standard=ARR&tag=hydrology');
    await expect(page.getByText(/Showing 1 matching tasks/)).toBeVisible();
    await expect(page.getByRole('link', { name: /^Rational Method$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Voltage Drop$/ })).toHaveCount(0);
  });
});
