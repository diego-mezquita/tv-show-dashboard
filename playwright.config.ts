import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

// See https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: './e2e',
  // Tests use the real TVMaze API, which allows ~20 requests per 10 seconds, so they run one at a time
  fullyParallel: false,
  workers: 1,
  // Real network calls are slower than the defaults allow for
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 16'] } },
  ],
  // CI tests the production build; locally an already running dev server is reused
  webServer: {
    command: process.env.CI ? 'npm run build-only && npm run preview' : 'npm run dev',
    port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
  },
})
