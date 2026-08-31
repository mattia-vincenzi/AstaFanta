import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4317',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 4317 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', testMatch: '**/compatibility.spec.js', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', testMatch: '**/compatibility.spec.js', use: { ...devices['iPhone 15'] } },
  ],
});
