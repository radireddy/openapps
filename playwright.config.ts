import { defineConfig, devices } from '@playwright/test';

// Use the project's dev server so Playwright can interact with the app.
// `npm run start` runs `vite` which uses port 3000 (configured in `vite.config.ts`).
const serverCommand = 'npm run start';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000', // The dev server URL
    trace: 'on-first-retry',
    // Record a video for every test run.
    video: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: serverCommand,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    timeout: 120 * 1000,
  },
});
