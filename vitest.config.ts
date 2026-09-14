import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

// Loaded here rather than inside the app so `src/config/env.ts` sees the test
// values first — dotenv never overwrites variables that are already set.
const testEnv = dotenv.config({ path: path.join(here, '.env.test') }).parsed ?? {};

/**
 * The suite must never pick up a real mailbox — neither from `.env.test` nor
 * from a developer's `.env`, which `src/config/env.ts` also loads. Blank means
 * "not configured"; the notification tests stub placeholder values instead.
 */
const emailOff = Object.fromEntries(
  [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM_EMAIL',
    'SMTP_FROM_NAME',
    'CONTACT_NOTIFICATION_EMAIL',
  ].map((name) => [name, '']),
);

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    // The tests share one database, so they must not run concurrently.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: { ...testEnv, ...emailOff, NODE_ENV: 'test' },
    include: ['tests/**/*.test.ts'],
  },
});
