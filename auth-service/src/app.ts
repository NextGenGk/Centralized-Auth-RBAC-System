import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';
import rateLimit  from 'express-rate-limit';
import swaggerUi  from 'swagger-ui-express';

import { swaggerSpec }  from './config/swagger';
import { authRouter }   from './routes/auth.routes';
import { adminRouter }  from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';
import { AppError }     from './utils/AppError';
import { config }       from './config';

const app = express();

// ── Security headers ───────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));

// ── Request parsing ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logging ────────────────────────────────────────────────────
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Global rate limit ──────────────────────────────────────────
app.use(rateLimit({
  windowMs: config.rateLimit.globalWindow * 1000,
  max:      config.rateLimit.globalMax,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// ── Swagger docs ───────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Auth Service API',
}));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// ── Routes ─────────────────────────────────────────────────────
app.use('/auth',  authRouter);
app.use('/admin', adminRouter);

// ── 404 ────────────────────────────────────────────────────────
app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// ── Error handler ──────────────────────────────────────────────
app.use(errorHandler);

export default app;
