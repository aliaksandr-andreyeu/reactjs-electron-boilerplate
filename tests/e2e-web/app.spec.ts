import { test, expect } from '@playwright/test';

test.describe('Web App - General', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders the home page with File and API Client tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'API Client', exact: true })).toBeVisible();
  });

  test('shows open file button on File tab', async ({ page }) => {
    await expect(page.locator('button:has-text("Open file")')).toBeVisible();
  });

  test('toggles between light and dark theme', async ({ page }) => {
    const html = page.locator('html');
    const themeButton = page.locator('.theme-toggle');

    await themeButton.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await themeButton.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('switches to API Client tab', async ({ page }) => {
    await page.locator('button:has-text("API Client")').click();
    await expect(page.locator('.api-client-panel')).toBeVisible();
    await expect(page.locator('.http-form')).toBeVisible();
  });
});
