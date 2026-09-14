import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { initStorage } from './storage/index.js';
import { ensureSettingRows } from './modules/settings/service.js';

const start = async () => {
  await initStorage();
  await prisma.$connect();
  const created = await ensureSettingRows();
  if (created > 0) logger.info({ created }, 'Created missing site settings from the registry');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, origins: env.allowedOrigins },
      `Mian Dubai API listening on ${env.PUBLIC_BASE_URL}`,
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start the Mian Dubai API');
  process.exit(1);
});
