import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import swaggerUi  from 'swagger-ui-express';

import { swaggerSpec }  from './config/swagger';
import { ordersRouter } from './routes/orders.routes';
import { errorHandler } from './middleware/errorHandler';
import { AppError }     from './utils/AppError';
import { config }       from './config';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orders-service', timestamp: new Date().toISOString() });
});

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Orders Service API',
}));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// Routes
app.use('/orders', ordersRouter);

// 404
app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// Error handler
app.use(errorHandler);

export default app;
