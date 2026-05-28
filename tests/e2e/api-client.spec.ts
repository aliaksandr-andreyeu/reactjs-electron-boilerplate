import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

async function launchApp() {
  const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');
  return electron.launch({
    args: [mainPath],
    executablePath: require('electron'),
    env: {
      ...process.env,
      E2E_TEST: 'true',
      NODE_ENV: 'test',
    },
  });
}

test('API client: validates REST URL and shows mocked HTTP response', async () => {
  const electronApp = await launchApp();
  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  await page.locator('button:has-text("API Client")').click();
  await expect(page.locator('.http-form')).toBeVisible();

  await page.locator('.http-form input[aria-label="Request URL"]').fill('not-valid');
  await page.locator('.http-form button:has-text("Send")').click();
  await expect(page.locator('.field-error')).toContainText('URL');

  await page.locator('.http-form input[aria-label="Request URL"]').fill('https://example.com/api');
  await page.locator('.http-form button:has-text("Send")').click();
  await expect(page.locator('.response-viewer .status-badge')).toHaveText('200');
  await expect(page.locator('.response-viewer pre')).toContainText('"ok":true');

  await electronApp.close();
});

test('API client: validates WebSocket URL before connect', async () => {
  const electronApp = await launchApp();
  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  await page.locator('button:has-text("API Client")').click();
  await page.locator('.api-client-panel .tabs button:has-text("WebSocket")').click();

  await page.locator('.ws-form input[aria-label="WebSocket URL"]').fill('https://wrong-protocol.com');
  await page.locator('.ws-form button:has-text("Connect")').click();
  await expect(page.locator('.ws-form .field-error')).toContainText('ws');

  await electronApp.close();
});

test('toggles dark and light theme', async () => {
  const electronApp = await launchApp();
  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('button:has-text("Dark")').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('button:has-text("Light")').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await electronApp.close();
});
