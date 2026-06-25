import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'out/playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3001',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 3001',
    url: 'http://127.0.0.1:3001/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1366, height: 900 } },
    },
    {
      name: 'android-chrome',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
    {
      name: 'iphone-safari-size',
      use: { ...devices['iPhone 14'], channel: 'chrome' },
    },
  ],
});
