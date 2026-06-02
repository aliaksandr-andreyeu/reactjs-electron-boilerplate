import { test, expect } from '@playwright/test';

test.describe('Web App - REST API Client', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("API Client")').click();
  });

  test('validates URL before sending HTTP request', async ({ page }) => {
    await page.locator('input[aria-label="Request URL"]').fill('not-a-valid-url');
    await page.locator('button:has-text("Send")').click();
    await expect(page.locator('.field-error')).toBeVisible();
    await expect(page.locator('.field-error')).toContainText('URL');
  });

  test('validates empty URL', async ({ page }) => {
    await page.locator('button:has-text("Send")').click();
    await expect(page.locator('.field-error')).toContainText('Enter a request URL');
  });

  test('allows method selection', async ({ page }) => {
    const select = page.locator('select[aria-label="HTTP method"]');
    await select.selectOption('POST');
    await expect(select).toHaveValue('POST');
    await expect(page.locator('textarea[aria-label="Request body"]')).toBeVisible();
  });

  test('shows request body only for POST/PUT/PATCH', async ({ page }) => {
    await expect(page.locator('textarea[aria-label="Request body"]')).not.toBeVisible();

    const select = page.locator('select[aria-label="HTTP method"]');
    await select.selectOption('POST');
    await expect(page.locator('textarea[aria-label="Request body"]')).toBeVisible();

    await select.selectOption('DELETE');
    await expect(page.locator('textarea[aria-label="Request body"]')).not.toBeVisible();
  });

  test('adds and removes headers', async ({ page }) => {
    await page.locator('button:has-text("+ Add header")').click();
    const headerPairs = page.locator('.header-pair');
    const count = await headerPairs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await headerPairs.last().locator('button[aria-label="Remove header"]').click();
    expect(await page.locator('.header-pair').count()).toBe(count - 1);
  });

  test('sends HTTP request to a CORS-friendly endpoint', async ({ page }) => {
    await page.locator('input[aria-label="Request URL"]').fill('https://httpbin.org/get');
    await page.locator('button:has-text("Send")').click();

    await expect(page.locator('.response-viewer')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.status-badge')).toHaveText('200');
    await expect(page.locator('.response-viewer pre')).toContainText('httpbin');
  });
});

test.describe('Web App - WebSocket Client', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("API Client")').click();
    await page.locator('button[role="tab"]:has-text("WebSocket")').click();
  });

  test('validates WebSocket URL protocol', async ({ page }) => {
    await page.locator('input[aria-label="WebSocket URL"]').fill('https://wrong.com');
    await page.locator('button:has-text("Connect")').click();
    await expect(page.locator('.field-error')).toContainText('ws');
  });

  test('validates empty WebSocket URL', async ({ page }) => {
    await page.locator('button:has-text("Connect")').click();
    await expect(page.locator('.field-error')).toContainText('Enter a WebSocket URL');
  });

  test('shows disconnected status by default', async ({ page }) => {
    await expect(page.locator('.ws-status')).toHaveText('Disconnected');
  });

  test('connects to a WebSocket echo server', async ({ page }) => {
    await page.locator('input[aria-label="WebSocket URL"]').fill('wss://echo.websocket.org');
    await page.locator('button:has-text("Connect")').click();

    await expect(page.locator('.ws-status--connecting, .ws-status--connected')).toBeVisible({ timeout: 10000 });
  });
});
