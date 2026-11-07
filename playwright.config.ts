import { defineConfig } from '@playwright/test';

const app = 'http://127.0.0.1:3105';
const api = 'http://127.0.0.1:4310';
// Fail closed rather than letting an inherited shell or CI variable target production.
for (const [key, expected] of Object.entries({
  QA_WEB_URL: app, E2E_BASE_URL: app, PLAYWRIGHT_BASE_URL: app,
  QA_API_ORIGIN: api, E2E_API_ORIGIN: api, NEXT_PUBLIC_API_BASE_URL: api,
  NEXT_PUBLIC_SOCKET_URL: api,
})) {
  if (process.env[key] !== undefined && process.env[key] !== expected) {
    throw new Error(`${key} must be exactly ${expected} for SYNTHETIC E2E`);
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  globalTimeout: 15 * 60_000,
  expect: { timeout: 12_000 },
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: app,
    browserName: 'chromium',
    headless: true,
    serviceWorkers: 'block',
    contextOptions: { reducedMotion: 'reduce' },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    actionTimeout: 12_000,
    navigationTimeout: 30_000,
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [1440, 390].flatMap(width => (['light', 'dark'] as const).map(colorScheme => ({
    name: `${width === 1440 ? 'desktop1440' : 'mobile390'}-${colorScheme}`,
    use: { viewport: { width, height: 1000 }, colorScheme },
  }))),
  webServer: {
    command: 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3105',
    url: app,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_API_BASE_URL: api,
      NEXT_PUBLIC_SOCKET_URL: api,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_PATH: '',
    },
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
