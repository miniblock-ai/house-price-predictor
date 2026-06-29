import { defineConfig } from '@playwright/test';
import { tmpdir } from 'os';
import { join } from 'path';

const slowMo = process.env.PLAYWRIGHT_SLOW_MO ? Number(process.env.PLAYWRIGHT_SLOW_MO) : undefined;

export default defineConfig({
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: slowMo ? 120000 : 30000,
  outputDir: join(tmpdir(), 'pw-output'),
  preserveOutput: 'never',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    channel: 'chrome',
    launchOptions: {
      slowMo,
      headless: !slowMo,
    },
  },
  webServer: {
    command: 'npx next dev -p 3001',
    port: 3001,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: 'app2-e2e',
      testDir: './e2e/app2',
      testMatch: ['market-analysis-e2e.spec.ts', 'houses-e2e.spec.ts'],
    },
    {
      name: 'uit',
      testDir: './__uit__',
      testMatch: '**/*.spec.ts',
    },
  ],
});