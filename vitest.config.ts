import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

// Loaded here rather than inside the app so `src/config/env.ts` sees the test
// values first — dotenv never overwrites variables that are already set.
const testEnv = dotenv.config({ path: path.join(here, '.env.test') }).parsed ?? {};

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    // The tests share one database, so they must not run concurrently.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: { ...testEnv, NODE_ENV: 'test' },
    include: ['tests/**/*.test.ts'],
  },
});
