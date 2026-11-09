import { createServer as createHttpServer, type Server } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createAuthRouter, SESSION_COOKIE } from './server/auth';
import { loadConfig } from './server/config';
import { deleteExpiredSessions, openDatabase } from './server/db';
import { createInstancesRouter } from './server/instances';
import { createProxyRouter } from './server/proxy';
import { apiLimiter, securityHeaders } from './server/security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvironment(): void {
  try {
    process.loadEnvFile?.();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') throw error;
  }
}

async function startServer(): Promise<void> {
  loadEnvironment();

  const config = loadConfig();
  const db = openDatabase(config.dataDir);
  const app = express();

  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(cookieParser());

  // Raw bodies are only needed by the proxy; JSON parsing is applied to the rest of the API.
  app.use('/api/proxy', express.raw({ type: '*/*', limit: '50mb' }));
  app.use(express.json({ limit: '256kb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, auth: 'google', cookie: SESSION_COOKIE });
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', createAuthRouter(db, config));
  app.use('/api/instances', createInstancesRouter(db, config));
  app.use('/api', createProxyRouter(db, config));
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  const cleanupTimer = setInterval(() => deleteExpiredSessions(db), 60 * 60 * 1000);
  cleanupTimer.unref();
  deleteExpiredSessions(db);

  let server: Server;

  if (!config.isProduction) {
    const httpServer = createHttpServer(app);
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    server = httpServer;
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      return res.sendFile(path.join(distDir, 'index.html'));
    });
    server = createHttpServer(app);
  }

  await new Promise<void>((resolve) => {
    server.listen(config.port, config.host, () => resolve());
  });

  console.log(
    `[hermes-console] listening on http://${config.host}:${config.port} (${config.isProduction ? 'production' : 'development'})`
  );
  console.log(`[hermes-console] data directory: ${config.dataDir}`);
  console.log(`[hermes-console] google auth client: ${config.googleClientId}`);

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(cleanupTimer);
    server.close(() => {
      db.close();
      process.exit(0);
    });
    setTimeout(() => {
      db.close();
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('[hermes-console] failed to start:', error instanceof Error ? error.message : error);
  process.exit(1);
});
