import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 20000,
    video: 'retry-with-video',
  },
  reporter: process.env.CI ? [['html', { open: 'never' }], ['dot']] : [['list']],
});
