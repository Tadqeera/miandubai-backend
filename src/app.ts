import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmetModule from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/public.js';
import { seoRouter } from './routes/seo.js';

/**
 * Helmet's CommonJS type declarations describe its default export as the whole
 * module object. Type checkers that resolve those declarations for this ES
 * module (Vercel's build) then see it as non-callable (TS2349). At runtime the
 * default export is the helmet function itself, so this selects that same
 * function under either view of the types.
 */
type HelmetModule = typeof helmetModule;
type HelmetFactory = HelmetModule extends { default: infer Factory } ? Factory : HelmetModule;
const helmet = ('default' in helmetModule ? helmetModule.default : helmetModule) as HelmetFactory;

export const createApp = (): Express => {
  const app = express();

  // Required for correct req.ip behind a reverse proxy (nginx, cPanel, Vercel).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // The API serves JSON and images, never HTML pages of its own.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.use(
    cors({
      // Explicit allow-list. A wildcard would be rejected by browsers for the
      // credentialed admin requests anyway.
      origin(origin, callback) {
        if (!origin || env.allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
          callback(null, true);
          return;
        }
        callback(new Error('Origin not allowed by CORS policy.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      maxAge: 86_400,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));
  app.use(cookieParser());

  if (!env.isTest) {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req: { url?: string }) => req.url === '/health' } }));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'miandubai-api', time: new Date().toISOString() });
  });

  /**
   * Convenience static mount for the external media directory during local
   * development. The files still live in MEDIA_ROOT, outside this deployment;
   * when MEDIA_PUBLIC_URL points at Apache/Nginx/a CDN this mount is skipped.
   */
  if (env.servesMediaLocally) {
    app.use(
      '/media',
      express.static(env.MEDIA_ROOT, {
        index: false,
        dotfiles: 'deny',
        maxAge: '30d',
        immutable: true,
        setHeaders: (res) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      }),
    );
  }

  app.use(seoRouter);

  app.use('/api/v1', apiLimiter, publicRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

/**
 * The single application instance. Vercel's Express runtime selects this module
 * (the first entry file that imports express) and invokes its default export;
 * src/server.ts reuses the same instance for local development and Node hosting.
 */
const app = createApp();

export default app;
