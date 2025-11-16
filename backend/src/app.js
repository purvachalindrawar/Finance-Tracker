import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { router } from './routes/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.DOTENV_PATH || '.env' });

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));
  app.use(rateLimit({ windowMs: 60_000, max: 100 }));

  // Request ID
  app.use((req, res, next) => {
    const id = Math.random().toString(36).slice(2);
    req.id = id;
    res.setHeader('x-request-id', id);
    next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));
  // Mount router at root so routes defined as /api/... work as-is
  app.use(router);

  app.use((err, _req, res, _next) => {
    const status = err?.status || 500;
    const body = { error: err?.message || 'Server error' };
    try {
      if (_req?.id) body.requestId = _req.id;
    } catch {}
    res.status(status).json(body);
  });

  return app;
}
