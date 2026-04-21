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

// Swagger docs (moved above security for Vercel compatibility)
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Orders Service API',
  customCssUrl: CSS_URL,
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"
  ]
}));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      "style-src": ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https://cdnjs.cloudflare.com"],
    },
  },
}));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orders-service', timestamp: new Date().toISOString() });
});


// Routes
app.use('/orders', ordersRouter);

// 404
app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// Error handler
app.use(errorHandler);

export default app;
