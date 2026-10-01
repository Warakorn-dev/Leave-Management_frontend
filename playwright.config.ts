import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { BACKEND_DIR, BACKEND_PORT, BACKEND_URL, FRONTEND_PORT, FRONTEND_URL, e2eDatabaseUrl } from './e2e/env';

const DATABASE_URL = e2eDatabaseUrl();

// `npm run test:e2e:demo`: real Google Chrome, visible and slowed down so a
// person can follow along. (npm sets npm_lifecycle_event for the workers too.)
const DEMO = process.env.npm_lifecycle_event === 'test:e2e:demo';

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  // The specs share one seeded database and log the same users in and out.
  fullyParallel: false,
  workers: 1,
  timeout: DEMO ? 300_000 : 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONTEND_URL,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: DEMO ? 'chrome' : 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        ...(DEMO ? { channel: 'chrome', headless: false, launchOptions: { slowMo: 400 } } : {}),
      },
    },
  ],
  webServer: [
    {
      // Fresh database, then the backend from source (no build, so the dev
      // server's dist/ is left alone). Rate limiting is off only here.
      command: `node "${path.join(__dirname, 'e2e', 'prepare-db.mjs')}" && node -r ts-node/register/transpile-only -r tsconfig-paths/register src/main.ts`,
      cwd: BACKEND_DIR,
      url: `${BACKEND_URL}/api/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      stdout: 'ignore',
      // The blocked SMTP port makes every notification log an error; hide it.
      stderr: 'ignore',
      env: {
        DATABASE_URL,
        PORT: String(BACKEND_PORT),
        NODE_ENV: 'test',
        DISABLE_RATE_LIMIT: 'true',
        FRONTEND_URL,
        CORS_ORIGINS: FRONTEND_URL,
        // No real e-mail: point SMTP at a closed local port.
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: '1',
        SMTP_USER: '',
        SMTP_PASS: '',
      },
    },
    {
      // Production build in its own folder so `npm run dev` (.next/dev) and a
      // normal `npm run build` (.next) are unaffected.
      command: `npx next build && npx next start -p ${FRONTEND_PORT}`,
      url: `${FRONTEND_URL}/login`,
      timeout: 400_000,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        NEXT_DIST_DIR: '.next-e2e',
        NEXT_PUBLIC_BACKEND_URL: BACKEND_URL,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  ],
});
