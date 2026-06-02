import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e-web',
  testMatch: '**/*.spec.ts',
  timeout: 30000,
  retries: 1,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },
  webServer: {
    command: 'npm run dev:web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
