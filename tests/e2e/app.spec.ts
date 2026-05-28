import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test('opens a text file and displays its content', async () => {
  const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');
  const electronApp = await electron.launch({
    args: [mainPath],
    executablePath: require('electron'),
    env: {
      ...process.env,
      E2E_TEST: 'true',
      NODE_ENV: 'test',
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  const button = page.locator('button:has-text("Open file")');
  await button.waitFor({ state: 'visible' });
  await button.click();

  await expect(page.locator('.file-path')).toContainText('test.txt');
  await expect(page.locator('.content')).toHaveText('Hello E2E');

  await electronApp.close();
});
