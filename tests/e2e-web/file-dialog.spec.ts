import { test, expect } from '@playwright/test';

test.describe('Web App - File Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('open file button is visible and clickable', async ({ page }) => {
    const btn = page.locator('button:has-text("Open file")');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('opens native file picker on click (simulated via file chooser)', async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('button:has-text("Open file")').click(),
    ]);

    expect(fileChooser).toBeDefined();

    await fileChooser.setFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello from web e2e test'),
    });

    await expect(page.locator('.file-path')).toContainText('hello.txt');
    await expect(page.locator('.content')).toHaveText('Hello from web e2e test');
  });

  test('handles file read with display of path', async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('button:has-text("Open file")').click(),
    ]);

    await fileChooser.setFiles({
      name: 'data.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"key":"value"}'),
    });

    await expect(page.locator('.file-path')).toContainText('data.json');
    await expect(page.locator('.content')).toContainText('"key":"value"');
  });
});
